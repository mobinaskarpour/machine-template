"use client";

import { use } from "react";
import { OrgWorkflowView } from "@/components/modules/OrgWorkflowView";
import { WorkflowBuilderPage } from "@/components/intelligence/WorkflowBuilderPage";
import { getOrgWorkflow } from "@/config/capabilities";

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const decoded = decodeURIComponent(id);
  if (getOrgWorkflow(decoded)) {
    return <OrgWorkflowView workflowId={decoded} />;
  }
  return <WorkflowBuilderPage recommendationId={decoded} />;
}
