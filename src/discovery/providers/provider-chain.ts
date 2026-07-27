import type { AppConfig } from "../../config/env.js";
import type { Logger } from "pino";
import type { SafeCommandRunner } from "../../runners/safe-command-runner.js";
import type {
  KnowledgeSynthesisProvider,
  SearchProvider,
  WebsiteFetcher,
} from "../discovery-types.js";
import { TavilySearchProvider } from "../../integrations/tavily/tavily-search-provider.js";
import { SerperSearchProvider } from "../../integrations/serper/serper-search-provider.js";
import { SafeWebsiteFetcher } from "./website-fetcher.js";
import { DeterministicKnowledgeSynthesisProvider } from "./deterministic-synthesis.js";
import { CodexKnowledgeSynthesisProvider } from "../../integrations/codex/codex-synthesis-provider.js";
import { access } from "node:fs/promises";
import { constants } from "node:fs";

export async function createDiscoveryProviders(input: {
  config: AppConfig;
  runner: SafeCommandRunner;
  logger: Logger;
  overrides?: {
    searchProvider?: SearchProvider;
    fetcher?: WebsiteFetcher;
    synthesis?: KnowledgeSynthesisProvider;
  };
}): Promise<{
  searchProvider?: SearchProvider;
  fetcher: WebsiteFetcher;
  synthesis: KnowledgeSynthesisProvider;
}> {
  if (input.overrides?.searchProvider || input.overrides?.fetcher || input.overrides?.synthesis) {
    return {
      searchProvider: input.overrides.searchProvider,
      fetcher: input.overrides.fetcher ?? new SafeWebsiteFetcher(),
      synthesis:
        input.overrides.synthesis ?? new DeterministicKnowledgeSynthesisProvider(),
    };
  }

  let searchProvider: SearchProvider | undefined;
  if (input.config.discovery.searchProvider === "tavily") {
    searchProvider = new TavilySearchProvider(input.config.discovery.tavilyApiKey);
  } else if (input.config.discovery.searchProvider === "serper") {
    searchProvider = new SerperSearchProvider(input.config.discovery.serperApiKey);
  }

  const deterministic = new DeterministicKnowledgeSynthesisProvider();
  let synthesis: KnowledgeSynthesisProvider = deterministic;

  const mode = input.config.discovery.synthesisProvider;
  if (mode === "codex" || mode === "auto") {
    const codexPath = "/usr/local/bin/codex";
    const available = await access(codexPath, constants.X_OK)
      .then(() => true)
      .catch(() => false);
    if (available && mode === "codex") {
      synthesis = new CodexKnowledgeSynthesisProvider(input.runner, {
        model: input.config.codex.model,
        timeoutMs: input.config.codex.discoveryTimeoutMs,
        codexPath,
      });
    } else if (available && mode === "auto") {
      input.logger.info(
        { codexAvailable: true },
        "discovery.synthesis.using_deterministic",
      );
      synthesis = deterministic;
    } else if (mode === "codex" && !available) {
      input.logger.warn("discovery.synthesis.codex_unavailable_fallback_deterministic");
      synthesis = deterministic;
    }
  }

  return {
    searchProvider,
    fetcher: new SafeWebsiteFetcher(),
    synthesis,
  };
}
