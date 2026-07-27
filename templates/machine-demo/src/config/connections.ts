import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Calculator,
  Package,
  HardHat,
  FileText,
  Bot,
  CalendarClock,
  FolderKanban,
  Cloud,
  Boxes,
  Landmark,
  Database,
  Briefcase,
  Warehouse,
  Truck,
  Radio,
  Users,
  Clock,
  Mail,
  Share2,
  HardDrive,
  BarChart3,
  Webhook,
  Cpu,
  Layers,
} from "lucide-react";
import connectionsConfig from "@demo/config/connections.json";

export type ConnectionStatus = "online" | "warning" | "offline";

export type ConnectionCategoryId =
  | "project"
  | "finance"
  | "procurement"
  | "hr-ops"
  | "docs"
  | "ai-data";

export interface OrgConnection {
  id: string;
  name: string;
  category: ConnectionCategoryId;
  status: ConnectionStatus;
  lastSyncLabel: string;
  lastSyncMinutes: number;
  latencyMs: number;
  dataQuality: number;
  recordsSynced: number;
  health: number;
  lastError?: string;
  feeds: string[];
  businessImpact: string;
  recommendedAction: string;
  monogram: string;
  icon: LucideIcon;
}

export interface ConnectionCategory {
  id: ConnectionCategoryId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

const iconByName: Record<string, LucideIcon> = {
  Building2,
  Calculator,
  Package,
  HardHat,
  FileText,
  Bot,
  CalendarClock,
  FolderKanban,
  Cloud,
  Boxes,
  Landmark,
  Database,
  Briefcase,
  Warehouse,
  Truck,
  Radio,
  Users,
  Clock,
  Mail,
  Share2,
  HardDrive,
  BarChart3,
  Webhook,
  Cpu,
  Layers,
};

function resolveIcon(name: string): LucideIcon {
  return iconByName[name] || Layers;
}

export const connectionCategories: ConnectionCategory[] =
  connectionsConfig.categories.map((c) => ({
    id: c.id as ConnectionCategoryId,
    title: c.title,
    subtitle: c.subtitle,
    icon: resolveIcon(c.icon),
  }));

export const statusLabel: Record<ConnectionStatus, string> =
  connectionsConfig.statusLabels as Record<ConnectionStatus, string>;

export const orgConnections: OrgConnection[] = connectionsConfig.items.map((c) => ({
  ...(c as Omit<OrgConnection, "icon" | "category" | "status">),
  category: c.category as ConnectionCategoryId,
  status: c.status as ConnectionStatus,
  icon: resolveIcon(c.icon),
}));


export interface EcosystemOverview {
  total: number;
  online: number;
  warning: number;
  offline: number;
  lastSyncLabel: string;
  healthScore: number;
}

export function getEcosystemOverview(
  connections: OrgConnection[] = orgConnections
): EcosystemOverview {
  const online = connections.filter((c) => c.status === "online").length;
  const warning = connections.filter((c) => c.status === "warning").length;
  const offline = connections.filter((c) => c.status === "offline").length;
  const freshest = Math.min(...connections.map((c) => c.lastSyncMinutes));
  const lastSyncLabel =
    freshest <= 1
      ? "کمتر از یک دقیقه پیش"
      : freshest <= 2
        ? "۲ دقیقه پیش"
        : `${freshest} دقیقه پیش`;

  const healthScore = Math.round(
    (online * 100 + warning * 70 + offline * 15) / connections.length
  );

  return {
    total: connections.length,
    online,
    warning,
    offline,
    lastSyncLabel,
    healthScore,
  };
}

export function getPriorityAdvisories(
  connections: OrgConnection[] = orgConnections
): OrgConnection[] {
  return connections
    .filter((c) => c.status === "offline" || c.status === "warning")
    .sort((a, b) => {
      const rank = (s: ConnectionStatus) =>
        s === "offline" ? 0 : s === "warning" ? 1 : 2;
      return rank(a.status) - rank(b.status) || b.lastSyncMinutes - a.lastSyncMinutes;
    });
}

/** Graph orbit nodes — aggregated systems around THE MACHINE */
export interface GraphNode {
  id: string;
  label: string;
  status: ConnectionStatus;
  angle: number;
}

export function getConnectionGraphNodes(
  connections: OrgConnection[] = orgConnections
): GraphNode[] {
  const groups: { id: string; label: string; match: (c: OrgConnection) => boolean }[] = [
    {
      id: "erp",
      label: "ERP",
      match: (c) =>
        ["sap", "oracle-erp", "dynamics", "sepidar"].includes(c.id),
    },
    {
      id: "primavera",
      label: "Primavera",
      match: (c) => c.id === "primavera",
    },
    {
      id: "pm",
      label: "مدیریت پروژه",
      match: (c) =>
        ["ms-project", "acc", "procore"].includes(c.id),
    },
    {
      id: "finance",
      label: "مالی",
      match: (c) => c.category === "finance",
    },
    {
      id: "hr",
      label: "منابع انسانی",
      match: (c) => ["attendance", "hr"].includes(c.id),
    },
    {
      id: "warehouse",
      label: "انبار",
      match: (c) => ["wms", "procurement", "supplier", "asset"].includes(c.id),
    },
    {
      id: "iot",
      label: "IoT",
      match: (c) => ["iot-equip", "fleet-gps"].includes(c.id),
    },
    {
      id: "email",
      label: "ایمیل",
      match: (c) => c.id === "email",
    },
    {
      id: "sharepoint",
      label: "SharePoint",
      match: (c) => c.id === "sharepoint",
    },
    {
      id: "gdrive",
      label: "Google Drive",
      match: (c) => c.id === "gdrive",
    },
    {
      id: "powerbi",
      label: "Power BI",
      match: (c) => c.id === "powerbi",
    },
    {
      id: "api",
      label: "API",
      match: (c) => ["rest-apis", "ai-agents", "custom-data"].includes(c.id),
    },
  ];

  return groups.map((g, i) => {
    const members = connections.filter(g.match);
    const worst: ConnectionStatus = members.some((m) => m.status === "offline")
      ? "offline"
      : members.some((m) => m.status === "warning")
        ? "warning"
        : "online";
    return {
      id: g.id,
      label: g.label,
      status: worst,
      angle: (i / groups.length) * Math.PI * 2 - Math.PI / 2,
    };
  });
}

