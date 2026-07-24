"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo, lazy } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { useAIWorkspace } from "@/hooks/useAIWorkspace";
import { ContextPanel } from "./ContextPanel";
import { MeetingCanvas } from "./MeetingCanvas";
import { MeetingHistory } from "./MeetingHistory";
import { PromptBar } from "./PromptBar";
import { IntelligenceNotifications } from "@/components/intelligence/IntelligenceNotifications";
import { ExecutiveReviewDialog } from "@/components/intelligence/ExecutiveReviewDialog";
import { Reveal } from "@/components/motion";
import { pageLabels } from "@/config/labels";
import {
  selectProposedRecommendations,
  useIntelligenceStore,
} from "@/store/intelligence-store";
import { orgDashboards, orgWorkflows } from "@/config/capabilities";

const VoiceMode = lazy(() =>
  import("./VoiceMode").then((m) => ({ default: m.VoiceMode }))
);

function AIWorkspaceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = useMemo(() => searchParams.get("q"), [searchParams]);

  const {
    conversations,
    activeId,
    messages,
    thinking,
    thinkingSteps,
    activeCategory,
    role,
    contextualQuestions,
    lastReport,
    voiceOpen,
    voiceState,
    submitQuery,
    selectConversation,
    newMeeting,
    setActiveCategory,
    setRole,
    onThinkingComplete,
    openVoice,
    closeVoice,
  } = useAIWorkspace(initialQuery);

  const recommendations = useIntelligenceStore((s) => s.recommendations);
  const activeReviewId = useIntelligenceStore((s) => s.activeReviewId);
  const openReview = useIntelligenceStore((s) => s.openReview);
  const closeReview = useIntelligenceStore((s) => s.closeReview);
  const dismiss = useIntelligenceStore((s) => s.dismiss);
  const defer = useIntelligenceStore((s) => s.defer);
  const approve = useIntelligenceStore((s) => s.approve);
  const getById = useIntelligenceStore((s) => s.getById);

  // Active proposals first; deferred resurface softly (non-intrusive continuous learning)
  const visibleRecs = selectProposedRecommendations(recommendations)
    .filter((r) => r.status === "proposed" || r.status === "reviewing" || r.status === "deferred")
    .sort((a, b) => {
      const rank = (s: string) =>
        s === "reviewing" ? 0 : s === "proposed" ? 1 : 2;
      return rank(a.status) - rank(b.status) || b.createdAt - a.createdAt;
    })
    .slice(0, 4);
  const reviewItem = activeReviewId ? getById(activeReviewId) ?? null : null;

  const handleApprove = (id: string) => {
    const approved = approve(id);
    if (!approved) return;
    // Prefer stable org capability routes over ephemeral recommendation ids
    if (approved.kind === "workflow") {
      const orgId =
        orgWorkflows.find((w) => w.domain === approved.domain)?.id ?? approved.id;
      router.push(`/workflows/${encodeURIComponent(orgId)}`);
    } else {
      const orgId =
        orgDashboards.find((d) => d.domain === approved.domain)?.id ??
        approved.id;
      router.push(`/dashboards/${encodeURIComponent(orgId)}`);
    }
  };

  return (
    <AppShell pageTitle={pageLabels.chat} dense>
      <div className="flex h-[calc(100dvh-3.75rem)] md:h-[calc(100vh-65px)] overflow-hidden pb-0">
        <Reveal delay={0} className="contents">
          <ContextPanel report={lastReport} />
        </Reveal>

        <Reveal delay={0.1} className="flex flex-1 flex-col min-w-0">
          <MeetingCanvas
            messages={messages}
            thinking={thinking}
            thinkingSteps={thinkingSteps}
            questions={contextualQuestions}
            onQuestion={submitQuery}
            onThinkingComplete={onThinkingComplete}
            suppressThinking={voiceOpen}
          />
          <PromptBar
            onSubmit={submitQuery}
            onVoice={openVoice}
            disabled={thinking}
          />
        </Reveal>

        <Reveal delay={0.18} className="contents">
          <MeetingHistory
            conversations={conversations}
            activeId={activeId}
            activeCategory={activeCategory}
            role={role}
            onSelect={selectConversation}
            onNew={newMeeting}
            onCategory={setActiveCategory}
            onRole={setRole}
          />
        </Reveal>
      </div>

      {voiceOpen && (
        <Suspense fallback={null}>
          <VoiceMode
            open={voiceOpen}
            state={voiceState}
            thinkingSteps={thinkingSteps}
            lastSpoken={lastReport?.content}
            onClose={closeVoice}
            onSubmit={submitQuery}
            onThinkingComplete={onThinkingComplete}
            thinking={thinking}
          />
        </Suspense>
      )}

      <IntelligenceNotifications
        items={visibleRecs}
        onReview={openReview}
        onDefer={defer}
        onDismiss={dismiss}
      />

      <ExecutiveReviewDialog
        open={Boolean(activeReviewId && reviewItem)}
        recommendation={reviewItem}
        onClose={closeReview}
        onApprove={handleApprove}
        onDefer={defer}
      />
    </AppShell>
  );
}

export function AIWorkspacePage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex h-full items-center justify-center text-text-tertiary text-[14px]">
            آماده‌سازی فضای کار…
          </div>
        </AppShell>
      }
    >
      <AIWorkspaceInner />
    </Suspense>
  );
}
