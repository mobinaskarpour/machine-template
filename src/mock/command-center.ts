export type RiskLevel = "critical" | "high" | "medium" | "low" | "healthy";

export type TwinFocus =
  | "portfolio"
  | "cash"
  | "risk"
  | "schedule"
  | "ops"
  | null;

export interface ExecutiveBrief {
  greeting: string;
  headline: string;
  summary: string;
  businessImpact: string;
  financialImpact: string;
  financialAmount: string;
  riskLevel: RiskLevel;
  riskLabel: string;
  recommendedAction: string;
  ignoreHint: string;
}

export interface ChangedItem {
  id: string;
  title: string;
  detail: string;
  tone: RiskLevel;
}

export interface CommandItem {
  id: string;
  kind:
    | "recommendation"
    | "investigation"
    | "approval"
    | "risk"
    | "workflow"
    | "dashboard";
  title: string;
  detail: string;
  impact?: string;
  priority: "urgent" | "high" | "normal";
}

export interface ProjectCard {
  id: string;
  name: string;
  client: string;
  health: number;
  risk: RiskLevel;
  riskLabel: string;
  financial: string;
  financialTone: "positive" | "negative" | "neutral";
  progress: number;
  scheduleConfidence: number;
  cashflow: string;
  cashTone: RiskLevel;
  twinNode: TwinFocus;
}

export interface InsightCard {
  id: string;
  title: string;
  value: string;
  story: string;
  tone: RiskLevel;
  twinNode: TwinFocus;
}

export interface QuickQuestion {
  id: string;
  question: string;
}

import data from "@demo/mock-data/projects/command-center.json";

export const user = data.user;
export const executiveBrief = data.executiveBrief as ExecutiveBrief;
export const changedSinceYesterday = data.changedSinceYesterday as ChangedItem[];
export const commandItems = data.commandItems as CommandItem[];
export const projects = data.projects as ProjectCard[];
export const insights = data.insights as InsightCard[];
export const quickQuestions = data.quickQuestions as QuickQuestion[];
export const cashflowRiver = data.cashflowRiver;
export const portfolioHealthTimeline = data.portfolioHealthTimeline;
export const riskMatrix = data.riskMatrix;
export const twinNodes = data.twinNodes;
