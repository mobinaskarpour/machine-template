"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type {
  Conversation,
  ExecutiveRole,
  HistoryCategory,
  VoiceState,
  WorkspaceMessage,
} from "@/types/ai";
import {
  initialConversations,
  getContextualQuestions,
} from "@/mock/ai-workspace";
import { processExecutiveQuery } from "@/lib/ai-engine";
import { useIntelligenceStore } from "@/store/intelligence-store";

function uid() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useAIWorkspace(initialQuery?: string | null) {
  const observe = useIntelligenceStore((s) => s.observe);
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<
    HistoryCategory | "all"
  >("all");
  const [role, setRole] = useState<ExecutiveRole>("ceo");
  const [thinking, setThinking] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [pending, setPending] = useState<{
    content: string;
    convId: string | null;
  } | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [hour, setHour] = useState(9);
  const finishingRef = useRef(false);
  const bootQueryRef = useRef(false);

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  const contextualQuestions = useMemo(
    () => getContextualQuestions(role, hour),
    [role, hour]
  );

  const activeConversation = conversations.find((c) => c.id === activeId);
  const messages = activeConversation?.messages ?? [];

  const lastReport = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    return last?.report ?? null;
  }, [messages]);

  const finishResponse = useCallback(
    (userContent: string, convId: string | null) => {
      const report = processExecutiveQuery(userContent);
      const assistantMsg: WorkspaceMessage = {
        id: uid(),
        role: "assistant",
        content: report.content,
        report,
      };

      // Executive Intelligence — observe conversation, derive capabilities
      observe(userContent, report.content);

      if (convId) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: [...c.messages, assistantMsg],
                  title: report.conversationTitle,
                  preview: userContent,
                  updatedAt: "اکنون",
                  category: report.category,
                }
              : c
          )
        );
      }

      setThinking(false);
      setThinkingSteps([]);
      setPending(null);
      finishingRef.current = false;

      if (voiceOpen) {
        setVoiceState("speaking");
        setTimeout(() => setVoiceState("listening"), 3200);
      }
    },
    [voiceOpen, observe]
  );

  const submitQuery = useCallback(
    (content: string) => {
      if (thinking || !content.trim()) return;

      const userMsg: WorkspaceMessage = {
        id: uid(),
        role: "user",
        content: content.trim(),
      };

      let convId = activeId;

      if (!convId) {
        const newConv: Conversation = {
          id: uid(),
          title: content.trim().slice(0, 24),
          category: "sessions",
          preview: content.trim(),
          updatedAt: "اکنون",
          messages: [userMsg],
        };
        setConversations((prev) => [newConv, ...prev]);
        convId = newConv.id;
        setActiveId(convId);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: [...c.messages, userMsg],
                  preview: content.trim(),
                }
              : c
          )
        );
      }

      const preview = processExecutiveQuery(content);
      setThinkingSteps(preview.thinkingSteps);
      setThinking(true);
      finishingRef.current = false;
      setPending({ content: content.trim(), convId });
      if (voiceOpen) setVoiceState("thinking");
    },
    [activeId, thinking, voiceOpen]
  );

  const onThinkingComplete = useCallback(() => {
    if (!pending || finishingRef.current) return;
    finishingRef.current = true;
    finishResponse(pending.content, pending.convId);
  }, [pending, finishResponse]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const newMeeting = useCallback(() => {
    setActiveId(null);
  }, []);

  const openVoice = useCallback(() => {
    setVoiceOpen(true);
    setVoiceState("listening");
  }, []);

  const closeVoice = useCallback(() => {
    setVoiceOpen(false);
    setVoiceState("idle");
  }, []);

  useEffect(() => {
    if (initialQuery && !bootQueryRef.current) {
      bootQueryRef.current = true;
      const t = setTimeout(() => submitQuery(initialQuery), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  return {
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
    setVoiceState,
  };
}
