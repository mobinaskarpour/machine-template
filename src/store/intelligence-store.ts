"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ConcernSignal,
  ConversationExtraction,
  IntelligenceRecommendation,
  LearningProfile,
  RecommendationStatus,
} from "@/types/intelligence";
import {
  deriveRecommendations,
  emptyLearning,
  seedSignals,
  updateConcernSignals,
  updateLearning,
} from "@/lib/intelligence/engine";
import { extractFromConversation } from "@/lib/intelligence/extract";

interface IntelligenceState {
  extractions: ConversationExtraction[];
  signals: ConcernSignal[];
  recommendations: IntelligenceRecommendation[];
  learning: LearningProfile;
  activeReviewId: string | null;
  observe: (query: string, assistantContent?: string) => IntelligenceRecommendation[];
  setStatus: (id: string, status: RecommendationStatus) => void;
  openReview: (id: string) => void;
  closeReview: () => void;
  dismiss: (id: string) => void;
  defer: (id: string) => void;
  approve: (id: string) => IntelligenceRecommendation | null;
  getById: (id: string) => IntelligenceRecommendation | undefined;
}

export const useIntelligenceStore = create<IntelligenceState>()(
  persist(
    (set, get) => ({
      extractions: [],
      signals: seedSignals(),
      recommendations: [],
      learning: emptyLearning(),
      activeReviewId: null,

      observe: (query, assistantContent) => {
        const extraction = extractFromConversation(query, assistantContent);
        const learning = updateLearning(get().learning, extraction);
        const signals = updateConcernSignals(get().signals, extraction, learning);
        const fresh = deriveRecommendations(
          signals,
          get().recommendations,
          learning
        );

        set({
          extractions: [extraction, ...get().extractions].slice(0, 80),
          signals,
          learning,
          recommendations: fresh.length
            ? [...fresh, ...get().recommendations]
            : get().recommendations,
        });

        return fresh;
      },

      setStatus: (id, status) =>
        set({
          recommendations: get().recommendations.map((r) =>
            r.id === id ? { ...r, status } : r
          ),
        }),

      openReview: (id) =>
        set({
          activeReviewId: id,
          recommendations: get().recommendations.map((r) =>
            r.id === id &&
            (r.status === "proposed" || r.status === "deferred")
              ? { ...r, status: "reviewing" }
              : r
          ),
        }),

      closeReview: () => set({ activeReviewId: null }),

      dismiss: (id) =>
        set({
          recommendations: get().recommendations.map((r) =>
            r.id === id ? { ...r, status: "dismissed" } : r
          ),
          activeReviewId:
            get().activeReviewId === id ? null : get().activeReviewId,
        }),

      defer: (id) =>
        set({
          recommendations: get().recommendations.map((r) =>
            r.id === id ? { ...r, status: "deferred" } : r
          ),
          activeReviewId:
            get().activeReviewId === id ? null : get().activeReviewId,
        }),

      approve: (id) => {
        const rec = get().recommendations.find((r) => r.id === id);
        if (!rec) return null;
        set({
          recommendations: get().recommendations.map((r) =>
            r.id === id ? { ...r, status: "approved" } : r
          ),
          activeReviewId: null,
        });
        return { ...rec, status: "approved" };
      },

      getById: (id) => get().recommendations.find((r) => r.id === id),
    }),
    {
      name: "machine-executive-intelligence",
      partialize: (s) => ({
        signals: s.signals,
        recommendations: s.recommendations.filter(
          (r) => r.status !== "dismissed"
        ),
        learning: s.learning,
        extractions: s.extractions.slice(0, 40),
      }),
    }
  )
);

export function selectProposedRecommendations(
  recs: IntelligenceRecommendation[]
) {
  return recs.filter(
    (r) => r.status === "proposed" || r.status === "reviewing" || r.status === "deferred"
  );
}
