export type SearchResult = {
  title: string;
  url: string;
  snippet?: string;
  score?: number;
};

export type FetchedPage = {
  url: string;
  finalUrl: string;
  statusCode: number;
  contentType: string;
  bodyText: string;
  bytes: number;
  fetchedAt: string;
};

export type NormalizedSourceContent = {
  sourceId: string;
  url: string;
  title?: string;
  sourceType:
    | "OFFICIAL_WEBSITE"
    | "BUSINESS_REGISTRY"
    | "SOCIAL_PROFILE"
    | "NEWS"
    | "DIRECTORY"
    | "SEARCH_RESULT"
    | "USER_INPUT"
    | "OTHER";
  authorityScore: number;
  extracted: DeterministicExtraction;
  evidenceText: string;
};

export type DeterministicExtraction = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  headings: string[];
  emails: string[];
  phones: string[];
  logoUrl?: string;
  languages: string[];
  jsonLdOrganizations: Array<Record<string, unknown>>;
  socialUrls: string[];
  productHints: string[];
  visibleTextSample: string;
};

export type WebsiteCandidate = {
  url: string;
  title?: string;
  snippet?: string;
  score: number;
  reasons: string[];
  penalties: string[];
};

export type DiscoveryStage =
  | "RESOLVING_COMPANY"
  | "LOADING_EXISTING_KNOWLEDGE"
  | "SEARCHING_SOURCES"
  | "RANKING_WEBSITES"
  | "FETCHING_WEBSITE"
  | "SELECTING_PAGES"
  | "EXTRACTING_FACTS"
  | "SYNTHESIZING_KNOWLEDGE"
  | "VALIDATING_KNOWLEDGE"
  | "PERSISTING_KNOWLEDGE"
  | "DISCOVERY_COMPLETE";

export const DISCOVERY_STAGE_PROGRESS: Record<DiscoveryStage, number> = {
  RESOLVING_COMPANY: 5,
  LOADING_EXISTING_KNOWLEDGE: 10,
  SEARCHING_SOURCES: 20,
  RANKING_WEBSITES: 30,
  FETCHING_WEBSITE: 40,
  SELECTING_PAGES: 50,
  EXTRACTING_FACTS: 65,
  SYNTHESIZING_KNOWLEDGE: 75,
  VALIDATING_KNOWLEDGE: 85,
  PERSISTING_KNOWLEDGE: 95,
  DISCOVERY_COMPLETE: 100,
};

export interface SearchProvider {
  readonly name: string;
  searchCompany(input: {
    companyName: string;
    countryHint?: string;
    websiteHint?: string;
    limit: number;
  }): Promise<SearchResult[]>;
}

export interface WebsiteFetcher {
  fetchPage(input: {
    url: string;
    timeoutMs: number;
    maxBytes: number;
  }): Promise<FetchedPage>;
}

export interface KnowledgeSynthesisProvider {
  readonly name: string;
  synthesize(input: {
    companyName: string;
    companyId: string;
    companySlug: string;
    sources: NormalizedSourceContent[];
    existingKnowledge?: import("../knowledge/company-knowledge-schema.js").CompanyKnowledge;
  }): Promise<unknown>;
}
