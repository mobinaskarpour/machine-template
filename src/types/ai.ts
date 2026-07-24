export type RiskLevel = "critical" | "high" | "medium" | "low" | "healthy";

export type HistoryCategory =
  | "portfolio"
  | "capital"
  | "operations"
  | "risk"
  | "sessions";

export type CanvasType =
  | "welcome"
  | "project-risk"
  | "cashflow"
  | "delay-impact"
  | "contractor"
  | "decisions"
  | "working-capital";

export type BlockKind =
  | "summary"
  | "root-cause"
  | "business-impact"
  | "financial-impact"
  | "operational-impact"
  | "risk"
  | "decision"
  | "outcome"
  | "opportunity"
  | "related-projects"
  | "related-contractors"
  | "related-contracts"
  | "related-equipment";

export type VisualExperienceKind =
  | "executive-chart"
  | "project-cameras"
  | "project-images"
  | "project-videos"
  | "site-map"
  | "digital-twin"
  | "timeline"
  | "documents"
  | "risks"
  | "workflow-card"
  | "dashboard-card"
  | "equipment"
  | "financial-breakdown"
  | "cashflow"
  | "forecast"
  | "vision-analysis";

export interface VisualExperience {
  id: string;
  kind: VisualExperienceKind;
  title: string;
  subtitle?: string;
  /** Optional deep-link for CTA inside the card */
  href?: string;
}

export interface InsightBlock {
  id: string;
  kind: BlockKind;
  title: string;
  body: string;
  meta?: string;
  tone?: RiskLevel;
  items?: string[];
}

export interface Citation {
  id: string;
  source: string;
  label: string;
}

export interface AIAction {
  id: string;
  label: string;
}

export interface DiscoveryCard {
  id: string;
  type: "dashboard" | "workflow";
  title: string;
  reason: string;
  businessValue: string;
  expectedImpact: string;
  cta: string;
}

export interface ExecutiveReport {
  content: string;
  canvas: CanvasType;
  conversationTitle: string;
  category: HistoryCategory;
  thinkingSteps: string[];
  blocks: InsightBlock[];
  followUps: string[];
  reasoning: string[];
  citations: Citation[];
  actions: AIAction[];
  discoveries?: DiscoveryCard[];
  /** 1–3 interactive visual experiences embedded in the response */
  visuals?: VisualExperience[];
  memoryNote?: string;
}

export interface WorkspaceMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  report?: ExecutiveReport;
}

export interface Conversation {
  id: string;
  title: string;
  category: HistoryCategory;
  preview: string;
  updatedAt: string;
  messages: WorkspaceMessage[];
}

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

export type ExecutiveRole = "ceo" | "cfo" | "project" | "operations";
