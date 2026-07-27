/** Executive Intelligence — types */

export type ConcernDomain =
  | "delay"
  | "cashflow"
  | "contractor"
  | "procurement"
  | "equipment"
  | "budget"
  | "workforce"
  | "reporting"
  | "contract-approval"
  | "collection"
  | "margin"
  | "risk-portfolio"
  | "hse"
  | "quality";

export type RecommendationKind = "workflow" | "dashboard";

export type RecommendationStatus =
  | "proposed"
  | "reviewing"
  | "approved"
  | "dismissed"
  | "deferred";

export interface ExtractedEntity {
  type:
    | "project"
    | "contract"
    | "contractor"
    | "equipment"
    | "department"
    | "financial"
    | "person";
  label: string;
}

export interface ConversationExtraction {
  id: string;
  at: number;
  query: string;
  topic: string;
  objective: string;
  domains: ConcernDomain[];
  entities: ExtractedEntity[];
  risks: string[];
  bottlenecks: string[];
  decisionPattern?: string;
  priority: "urgent" | "high" | "normal";
}

export interface ConcernSignal {
  domain: ConcernDomain;
  count: number;
  lastSeen: number;
  samples: string[];
  strength: number;
}

export interface WorkflowBlueprint {
  id: string;
  name: string;
  objective: string;
  whyMatters: string;
  businessValue: string;
  kpiImprovements: string[];
  actors: string[];
  automationOpportunities: string[];
  expectedRoi: string;
  processSteps: BusinessNode[];
  connections: BusinessEdge[];
}

export type WidgetKind =
  | "metric"
  | "kpi-row"
  | "line"
  | "bar"
  | "area"
  | "donut"
  | "gauge"
  | "heatmap"
  | "waterfall"
  | "treemap"
  | "timeline"
  | "list"
  | "river"
  | "rings"
  | "matrix";

export interface DashboardWidget {
  id: string;
  title: string;
  kind: WidgetKind;
  why: string;
  span: 1 | 2;
}

export interface DashboardBlueprint {
  id: string;
  name: string;
  whyMonitor: string;
  questionsAnswered: string[];
  keyKpis: string[];
  executiveValue: string;
  strategicImpact: string;
  updateFrequency: string;
  departments: string[];
  widgets: DashboardWidget[];
  /** Executive Analytics Workspace — filled by packs when missing */
  aiBrief?: string;
  rootCause?: string[];
  financialImpact?: string;
  operationalImpact?: string;
  relatedRisks?: string[];
  recommendedAction?: string;
  historicalTrend?: string;
}

export interface BusinessNode {
  id: string;
  label: string;
  role: "start" | "action" | "decision" | "notify" | "end";
  owner?: string;
  description?: string;
  x: number;
  y: number;
}

export interface BusinessEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface IntelligenceRecommendation {
  id: string;
  kind: RecommendationKind;
  domain: ConcernDomain;
  title: string;
  explanation: string;
  businessImpact: string;
  expectedValue: string;
  primaryCta: string;
  secondaryCta: string;
  status: RecommendationStatus;
  createdAt: number;
  concernCount: number;
  workflow?: WorkflowBlueprint;
  dashboard?: DashboardBlueprint;
}

export interface LearningProfile {
  interests: Record<string, number>;
  domainWeights: Partial<Record<ConcernDomain, number>>;
  decisionFrequency: number;
  languageHints: string[];
  totalExtractions: number;
}
