"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { WorkspaceMessage } from "@/types/ai";
import { ExecutiveReportView } from "./ExecutiveReportView";
import { ThinkingState } from "./ThinkingState";
import { businessActions } from "@/lib/visual-experiences";
import { spring } from "@/lib/motion";
import { pageLabels } from "@/config/labels";
import { cn } from "@/lib/utils";

interface MeetingCanvasProps {
  messages: WorkspaceMessage[];
  thinking: boolean;
  thinkingSteps: string[];
  questions: string[];
  onQuestion: (q: string) => void;
  onThinkingComplete: () => void;
  suppressThinking?: boolean;
}

export function MeetingCanvas({
  messages,
  thinking,
  thinkingSteps,
  questions,
  onQuestion,
  onThinkingComplete,
  suppressThinking,
}: MeetingCanvasProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  const isEmpty = messages.length === 0 && !thinking;

  return (
    <div className="flex-1 overflow-y-auto px-5 md:px-8 py-6 md:py-8">
      <AnimatePresence mode="wait">
        {isEmpty ? (
          <WelcomeState
            key="welcome"
            questions={questions}
            onQuestion={onQuestion}
          />
        ) : (
          <motion.div
            key="meeting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {!thinking && messages.length > 0 && (
              <BusinessActionBar onAction={onQuestion} />
            )}

            {messages.map((msg) =>
              msg.role === "user" ? (
                <UserIntent key={msg.id} content={msg.content} />
              ) : msg.report ? (
                <ExecutiveReportView
                  key={msg.id}
                  report={msg.report}
                  onFollowUp={onQuestion}
                />
              ) : (
                <p
                  key={msg.id}
                  className="text-[15px] text-text-secondary leading-relaxed"
                >
                  {msg.content}
                </p>
              )
            )}

            <ThinkingState
              active={thinking && !suppressThinking}
              steps={thinkingSteps}
              onComplete={onThinkingComplete}
            />

            <div ref={endRef} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BusinessActionBar({ onAction }: { onAction: (q: string) => void }) {
  return (
    <div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-void/80 backdrop-blur-md border-b border-etch/60">
      <p className="mb-2 text-[10px] text-text-tertiary">اقدام‌های بصری</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {businessActions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onAction(a.query)}
            className="shrink-0 rounded-[8px] border border-etch bg-slab/90 px-2.5 py-1.5 text-[11px] text-text-secondary cursor-pointer hover:border-border-hover hover:text-text-primary transition-colors"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function UserIntent({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={spring.gentle}
      className="flex justify-start"
    >
      <div className="inline-flex max-w-xl rounded-[10px] border border-etch bg-void/50 px-4 py-2.5 text-[14px] text-text-secondary">
        <span className="text-text-tertiary me-2">موضوع جلسه:</span>
        {content}
      </div>
    </motion.div>
  );
}

function WelcomeState({
  questions,
  onQuestion,
}: {
  questions: string[];
  onQuestion: (q: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(4px)" }}
      transition={spring.soft}
      className="flex flex-col items-center justify-center min-h-[55vh] text-center px-4"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border-hover bg-slab mb-6 shadow-[0_0_28px_var(--glow-ai)]">
        <Sparkles size={22} strokeWidth={1.6} className="text-accent" />
      </div>
      <p className="text-[13px] text-text-tertiary tracking-wide">
        {pageLabels.chat}
      </p>
      <h2 className="mt-3 text-[28px] md:text-[36px] font-semibold text-text-primary max-w-lg leading-tight">
        جلسه با رئیس ستاد اجرایی
      </h2>
      <p className="mt-4 max-w-md text-[15px] text-text-secondary leading-relaxed">
        سؤال بپرسید تا تصویر تصمیم روشن شود. پاسخ‌ها تجربه تعاملی‌اند — نه پیام
        چت.
      </p>

      <div className="mt-8 w-full max-w-2xl">
        <p className="mb-3 text-[12px] font-medium text-text-tertiary">
          تجربه بصری پروژه
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {businessActions.map((a, i) => (
            <motion.button
              key={a.id}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.03, ...spring.gentle }}
              whileHover={{ y: -2, transition: spring.gentle }}
              onClick={() => onQuestion(a.query)}
              className={cn(
                "rounded-[10px] border border-etch bg-slab/80 px-3.5 py-2",
                "text-[12px] text-text-secondary cursor-pointer",
                "hover:border-accent/40 hover:text-text-primary transition-colors duration-[120ms]"
              )}
            >
              {a.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-8 w-full max-w-xl">
        <p className="mb-3 text-[12px] font-medium text-text-tertiary">
          دغدغه‌های اجرایی اکنون
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {questions.slice(0, 4).map((q, i) => (
            <motion.button
              key={q}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.04, ...spring.gentle }}
              onClick={() => onQuestion(q)}
              className={cn(
                "rounded-[10px] border border-etch bg-void/40 px-4 py-2.5",
                "text-[13px] text-text-secondary cursor-pointer",
                "hover:border-border-hover hover:text-text-primary transition-colors duration-[120ms]"
              )}
            >
              {q}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
