import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Logger } from "pino";
import type { AppConfig } from "../config/env.js";
import type { CompanyRegistry } from "../registry/company-registry.js";
import type { CompanyRepository } from "../persistence/company-repository.js";
import type { JobManager } from "../jobs/job-manager.js";
import type { CompanyKnowledgeService } from "../knowledge/company-knowledge-service.js";
import type {
  KnowledgeSynthesisProvider,
  NormalizedSourceContent,
  SearchProvider,
  WebsiteFetcher,
  DiscoveryStage,
} from "./discovery-types.js";
import { DISCOVERY_STAGE_PROGRESS } from "./discovery-types.js";
import { AppError, isAppError, toErrorRecord } from "../shared/errors.js";
import { assertSafePublicUrl } from "../security/safe-url.js";
import { resolveUnderRoot } from "../security/paths.js";
import { assertSafeSlug } from "../registry/slug.js";
import { writeJsonAtomic } from "../persistence/atomic.js";
import { nowIso } from "../shared/ids.js";
import { extractDeterministic } from "./extract.js";
import { rankWebsiteCandidates, selectTopWebsite } from "./source-ranking.js";
import { selectPagesToFetch } from "./page-selection.js";
import {
  normalizeCompanyKnowledge,
  semanticValidateKnowledge,
} from "../knowledge/knowledge-normalizer.js";
import {
  parseCompanyKnowledge,
  type CompanyKnowledge,
} from "../knowledge/company-knowledge-schema.js";
import { withJobContext } from "../logging/logger.js";
import { redactSecrets } from "../security/redact.js";

export type DiscoveryInput = {
  companyName: string;
  websiteHint?: string;
};

export type DiscoveryResult = {
  ok: boolean;
  needsInput: boolean;
  jobId: string;
  companyId: string;
  companySlug: string;
  knowledge?: CompanyKnowledge;
  candidates?: Array<{ url: string; score: number; title?: string }>;
  message: string;
  relativePaths?: {
    workspaceKnowledge: string;
    memoryKnowledge: string;
  };
};

export class DiscoveryOrchestrator {
  constructor(
    private readonly deps: {
      config: AppConfig;
      registry: CompanyRegistry;
      companies: CompanyRepository;
      jobs: JobManager;
      knowledge: CompanyKnowledgeService;
      searchProvider?: SearchProvider;
      fetcher: WebsiteFetcher;
      synthesis: KnowledgeSynthesisProvider;
      logger: Logger;
    },
  ) {}

  async discover(input: DiscoveryInput): Promise<DiscoveryResult> {
    const companyName = input.companyName.trim();
    if (!companyName) {
      throw new AppError("VALIDATION_ERROR", "Company name cannot be empty");
    }

    const resolved = await this.deps.registry.resolveByName(companyName);
    await this.deps.companies.update(resolved.company.id, { status: "DISCOVERING" });

    const job = await this.deps.jobs.create({
      type: "DISCOVERY",
      companyId: resolved.company.id,
      projectId: resolved.project.id,
      currentStage: "RESOLVING_COMPANY",
      input: {
        companyName,
        websiteHint: input.websiteHint,
        phase: 1,
      },
    });

    const log = withJobContext(this.deps.logger, {
      jobId: job.id,
      companyId: resolved.company.id,
      projectId: resolved.project.id,
      command: "demo",
      stage: "RESOLVING_COMPANY",
    });

    const artifactDir = resolveUnderRoot(
      this.deps.config.projectsRoot,
      assertSafeSlug(resolved.company.slug),
      "artifacts",
      "discovery",
      job.id,
    );

    const setStage = async (stage: DiscoveryStage) => {
      await this.deps.jobs.setStage(
        job.id,
        stage,
        DISCOVERY_STAGE_PROGRESS[stage],
      );
    };

    try {
      await this.deps.jobs.transition(job.id, "RUNNING");
      await setStage("RESOLVING_COMPANY");
      await mkdir(artifactDir, { recursive: true });
      await mkdir(join(artifactDir, "pages"), { recursive: true });

      await setStage("LOADING_EXISTING_KNOWLEDGE");
      const existing = await this.deps.knowledge.get(resolved.company.slug);

      let websiteUrl = input.websiteHint?.trim();
      let candidates: ReturnType<typeof rankWebsiteCandidates> = [];

      if (websiteUrl) {
        const safe = await assertSafePublicUrl(websiteUrl, { resolveDns: true });
        websiteUrl = safe.href;
      } else if (existing?.identity.officialWebsite) {
        websiteUrl = existing.identity.officialWebsite;
      } else {
        await setStage("SEARCHING_SOURCES");
        if (!this.deps.searchProvider) {
          await this.deps.jobs.fail(job.id, {
            code: "DISCOVERY_NEEDS_INPUT",
            message: "No search provider configured and no website provided",
          });
          return {
            ok: false,
            needsInput: true,
            jobId: job.id,
            companyId: resolved.company.id,
            companySlug: resolved.company.slug,
            message: this.needsInputMessage(companyName, []),
          };
        }

        let searchResults;
        try {
          searchResults = await this.deps.searchProvider.searchCompany({
            companyName,
            websiteHint: input.websiteHint,
            limit: this.deps.config.discovery.maxSearchResults,
          });
        } catch (error) {
          throw new AppError("DISCOVERY_SEARCH_FAILED", "Search provider failed", {
            cause: error,
          });
        }
        await writeJsonAtomic(join(artifactDir, "search-results.json"), {
          provider: this.deps.searchProvider.name,
          results: searchResults,
        });

        await setStage("RANKING_WEBSITES");
        candidates = rankWebsiteCandidates({ companyName, results: searchResults });
        await writeJsonAtomic(join(artifactDir, "candidates.json"), candidates);
        const selection = selectTopWebsite(
          candidates,
          this.deps.config.discovery.minWebsiteConfidence,
        );
        if (!selection.selected || selection.ambiguous) {
          await this.deps.jobs.fail(job.id, {
            code: "DISCOVERY_WEBSITE_AMBIGUOUS",
            message: "Official website could not be selected confidently",
          });
          return {
            ok: false,
            needsInput: true,
            jobId: job.id,
            companyId: resolved.company.id,
            companySlug: resolved.company.slug,
            candidates: candidates.slice(0, 5).map((c) => ({
              url: c.url,
              score: c.score,
              title: c.title,
            })),
            message: this.needsInputMessage(
              companyName,
              candidates.slice(0, 5).map((c) => c.url),
            ),
          };
        }
        websiteUrl = selection.selected.url;
      }

      await setStage("FETCHING_WEBSITE");
      const home = await this.deps.fetcher.fetchPage({
        url: websiteUrl!,
        timeoutMs: this.deps.config.discovery.fetchTimeoutMs,
        maxBytes: this.deps.config.discovery.maxPageBytes,
      });
      const homeOrigin = new URL(home.finalUrl).origin;

      await setStage("SELECTING_PAGES");
      const pageUrls = selectPagesToFetch({
        origin: homeOrigin,
        html: home.bodyText,
        maxPages: this.deps.config.discovery.maxPages,
      });

      const fetchedPages = [home];
      for (const pageUrl of pageUrls) {
        if (pageUrl === home.url || pageUrl === home.finalUrl) continue;
        if (fetchedPages.length >= this.deps.config.discovery.maxPages) break;
        try {
          const page = await this.deps.fetcher.fetchPage({
            url: pageUrl,
            timeoutMs: this.deps.config.discovery.fetchTimeoutMs,
            maxBytes: this.deps.config.discovery.maxPageBytes,
          });
          if (new URL(page.finalUrl).origin !== homeOrigin) continue;
          fetchedPages.push(page);
        } catch (error) {
          log.warn(
            {
              url: pageUrl,
              err: isAppError(error) ? error.code : "FETCH_ERROR",
            },
            "discovery.page_fetch_skipped",
          );
        }
      }

      await setStage("EXTRACTING_FACTS");
      const normalizedSources: NormalizedSourceContent[] = [];
      let totalChars = 0;
      for (const [index, page] of fetchedPages.entries()) {
        const extracted = extractDeterministic(page.bodyText, page.finalUrl);
        const evidenceText = extracted.visibleTextSample;
        totalChars += evidenceText.length;
        if (totalChars > this.deps.config.discovery.maxTotalTextChars) break;
        const sourceId = `src_${index + 1}`;
        const sourceType =
          index === 0
            ? input.websiteHint
              ? ("USER_INPUT" as const)
              : ("OFFICIAL_WEBSITE" as const)
            : ("OFFICIAL_WEBSITE" as const);
        normalizedSources.push({
          sourceId,
          url: page.finalUrl,
          title: extracted.title,
          sourceType,
          authorityScore: index === 0 ? 0.9 : 0.75,
          extracted,
          evidenceText,
        });
        await writeFile(
          join(artifactDir, "pages", `${sourceId}.txt`),
          redactSecrets(evidenceText.slice(0, 20_000)),
          "utf8",
        );
      }

      await writeJsonAtomic(join(artifactDir, "extraction-input.json"), {
        companyName,
        sourceCount: normalizedSources.length,
      });

      if (normalizedSources.length === 0) {
        throw new AppError("DISCOVERY_FETCH_FAILED", "No pages could be fetched");
      }

      await setStage("SYNTHESIZING_KNOWLEDGE");
      let rawSynthesis: unknown;
      try {
        rawSynthesis = await this.deps.synthesis.synthesize({
          companyName,
          companyId: resolved.company.id,
          companySlug: resolved.company.slug,
          sources: normalizedSources,
          existingKnowledge: existing ?? undefined,
        });
      } catch (error) {
        if (isAppError(error) && error.code === "DISCOVERY_INVALID_MODEL_OUTPUT") {
          rawSynthesis = await this.deps.synthesis.synthesize({
            companyName,
            companyId: resolved.company.id,
            companySlug: resolved.company.slug,
            sources: normalizedSources,
            existingKnowledge: existing ?? undefined,
          });
        } else {
          throw new AppError("DISCOVERY_SYNTHESIS_FAILED", "Knowledge synthesis failed", {
            cause: error,
          });
        }
      }
      await writeJsonAtomic(join(artifactDir, "extraction-output.json"), rawSynthesis);

      await setStage("VALIDATING_KNOWLEDGE");
      let knowledge = parseCompanyKnowledge(rawSynthesis);
      knowledge = {
        ...knowledge,
        companyId: resolved.company.id,
        companySlug: resolved.company.slug,
        displayName: companyName,
        identity: {
          ...knowledge.identity,
          officialWebsite: knowledge.identity.officialWebsite ?? home.finalUrl,
        },
        discoveredAt: existing?.discoveredAt ?? knowledge.discoveredAt ?? nowIso(),
        updatedAt: nowIso(),
      };
      knowledge = normalizeCompanyKnowledge(knowledge);
      knowledge = semanticValidateKnowledge(knowledge, {
        minReadyConfidence: this.deps.config.discovery.minReadyConfidence,
        minWebsiteConfidence: this.deps.config.discovery.minWebsiteConfidence,
      });

      await setStage("PERSISTING_KNOWLEDGE");
      const saved = await this.deps.knowledge.save(knowledge);

      await writeJsonAtomic(join(artifactDir, "discovery-report.json"), {
        jobId: job.id,
        status: saved.status,
        overallConfidence: saved.overallConfidence,
        website: saved.identity.officialWebsite,
        productCount: saved.products.length,
        sourceCount: saved.sources.length,
      });
      await writeJsonAtomic(join(artifactDir, "sources.json"), saved.sources);

      await setStage("DISCOVERY_COMPLETE");
      const companyStatus = saved.status === "READY" ? "READY" : "CREATED";
      await this.deps.companies.update(resolved.company.id, { status: companyStatus });

      const succeeded = await this.deps.jobs.succeed(job.id, {
        phase: 1,
        knowledgeStatus: saved.status,
        overallConfidence: saved.overallConfidence,
        officialWebsite: saved.identity.officialWebsite,
        productCount: saved.products.length,
        departmentCount: saved.departments.length,
        painPointCount: saved.painPoints.length,
        sourceCount: saved.sources.length,
      });

      if (succeeded.status !== "SUCCEEDED") {
        throw new AppError(
          "INVALID_STATE_TRANSITION",
          "Discovery job did not reach SUCCEEDED",
        );
      }

      log.info(
        { knowledgeStatus: saved.status, confidence: saved.overallConfidence },
        "discovery.succeeded",
      );

      return {
        ok: true,
        needsInput: saved.status === "NEEDS_INPUT",
        jobId: job.id,
        companyId: resolved.company.id,
        companySlug: resolved.company.slug,
        knowledge: saved,
        message: formatDiscoverySummary(saved, {
          persian: /[\u0600-\u06FF]/.test(companyName),
        }),
        relativePaths: {
          workspaceKnowledge: `data/projects/${saved.companySlug}/.factory/knowledge.json`,
          memoryKnowledge: `data/memory/companies/${saved.companySlug}.json`,
        },
      };
    } catch (error) {
      const record = toErrorRecord(error);
      await this.deps.jobs.fail(job.id, record).catch(() => undefined);
      await this.deps.companies
        .update(resolved.company.id, { status: "FAILED" })
        .catch(() => undefined);
      await writeJsonAtomic(join(artifactDir, "discovery-report.json"), {
        jobId: job.id,
        failed: true,
        error: { code: record.code, message: record.message },
      }).catch(() => undefined);
      log.error({ err: { code: record.code, message: record.message } }, "discovery.failed");
      throw error;
    }
  }

  private needsInputMessage(companyName: string, candidateUrls: string[]): string {
    const persian = /[\u0600-\u06FF]/.test(companyName);
    const lines = persian
      ? [
          "نتوانستم وب‌سایت رسمی را با اطمینان کافی تشخیص دهم.",
          "",
          "لطفاً دوباره با آدرس رسمی امتحان کنید:",
          `/demo ${companyName} | https://official-company-site.com`,
        ]
      : [
          "I could not identify the official website with enough confidence.",
          "",
          "Retry with:",
          `/demo ${companyName} | https://official-company-site.com`,
        ];
    if (candidateUrls.length) {
      lines.push("", persian ? "نامزدهای مشاهده‌شده:" : "Observed candidates:");
      for (const url of candidateUrls.slice(0, 5)) lines.push(`• ${url}`);
    }
    return lines.join("\n");
  }
}

export function formatDiscoverySummary(
  knowledge: CompanyKnowledge,
  options?: { persian?: boolean },
): string {
  return [
    options?.persian ? "کشف شرکت تکمیل شد." : "Company discovery completed.",
    "",
    `Company: ${knowledge.displayName}`,
    `Slug: ${knowledge.companySlug}`,
    `Industry: ${knowledge.industry.primary || "—"}`,
    `Official website: ${knowledge.identity.officialWebsite ?? "—"}`,
    `Products found: ${knowledge.products.length}`,
    `Departments inferred: ${knowledge.departments.length}`,
    `Pain points identified: ${knowledge.painPoints.length}`,
    `Sources reviewed: ${knowledge.sources.length}`,
    `Confidence: ${knowledge.overallConfidence.toFixed(2)}`,
    `Knowledge status: ${knowledge.status}`,
    "",
    options?.persian ? "دانش ذخیره شد." : "Knowledge saved.",
    options?.persian
      ? "تولید اپلیکیشن در فاز ۱ پیاده‌سازی نشده است."
      : "Application generation is not implemented in Phase 1.",
  ].join("\n");
}
