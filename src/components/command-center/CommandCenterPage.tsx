"use client";

import { AppShell } from "@/components/shell/AppShell";
import { CommandCenterProvider } from "./CommandCenterContext";
import { ExecutiveBrief } from "./ExecutiveBrief";
import { DigitalTwin } from "./DigitalTwin";
import { ProjectPortfolio } from "./ProjectPortfolio";
import { ExecutiveInsights } from "./ExecutiveInsights";
import { ChangedStrip, QuickQuestions } from "./QuickQuestions";
import { Reveal } from "@/components/motion";
import { TodayDecisions } from "./TodayDecisions";
import { OverviewCapabilities } from "./OverviewCapabilities";
import { pageLabels } from "@/config/labels";

export function CommandCenterPage() {
  return (
    <AppShell pageTitle={pageLabels.home}>
      <CommandCenterProvider>
        <div className="px-5 py-7 md:px-10 md:py-10 pb-28 max-w-[1200px] mx-auto">
          <Reveal delay={0.04}>
            <ExecutiveBrief />
          </Reveal>

          <div className="mt-10">
            <Reveal delay={0.08}>
              <ExecutiveInsights />
            </Reveal>
          </div>

          <div className="mt-8">
            <Reveal delay={0.12}>
              <ChangedStrip />
            </Reveal>
          </div>

          <div className="mt-10">
            <Reveal delay={0.14}>
              <TodayDecisions />
            </Reveal>
          </div>

          <div className="mt-12">
            <Reveal delay={0.16}>
              <OverviewCapabilities />
            </Reveal>
          </div>

          <div className="mt-12">
            <Reveal delay={0.18}>
              <QuickQuestions />
            </Reveal>
          </div>

          <div className="mt-16 md:mt-20 grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
            <Reveal delay={0.1}>
              <DigitalTwin />
            </Reveal>
            <Reveal delay={0.14}>
              <ProjectPortfolio compact />
            </Reveal>
          </div>
        </div>
      </CommandCenterProvider>
    </AppShell>
  );
}
