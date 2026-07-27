"use client";

import { use } from "react";
import { ProjectDossierPage } from "@/components/modules/ProjectDossierPage";

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ProjectDossierPage projectId={decodeURIComponent(id)} />;
}
