"use client";

import { use } from "react";
import { OrgDashboardView } from "@/components/modules/OrgDashboardView";
import { DashboardBuilderPage } from "@/components/intelligence/DashboardBuilderPage";
import { getOrgDashboard } from "@/config/capabilities";

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const decoded = decodeURIComponent(id);
  if (getOrgDashboard(decoded)) {
    return <OrgDashboardView dashboardId={decoded} />;
  }
  return <DashboardBuilderPage recommendationId={decoded} />;
}
