"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { VoiceState } from "@/types/ai";
import { ThinkingState } from "./ThinkingState";
import { loopTween, timing } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion";
import { X, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceModeProps {
  open: boolean;
  state: VoiceState;
  thinkingSteps: string[];
  lastSpoken?: string;
  onClose: () => void;
  onSubmit: (q: string) => void;
  onThinkingComplete: () => void;
  thinking: boolean;
}

const demos = [
  "کدام پروژه بیشترین ریسک را دارد؟",
  "وضعیت نقدینگی این هفته چگونه است؟",
  "اگر برج آریا یک هفته تأخیر بخورد چه می‌شود؟",
];

export function VoiceMode({
  open,
  state,
  thinkingSteps,
  lastSpoken,
  onClose,
  onSubmit,
  onThinkingComplete,
  thinking,
}: VoiceModeProps) {
  const reduced = useReducedMotion();
  const [caption, setCaption] = useState("در حال گوش دادن…");

  useEffect(() => {
    if (state === "listening") setCaption("بفرمایید — جلسه صوتی اجرایی");
    if (state === "thinking") setCaption("در حال استدلال…");
    if (state === "speaking")
      setCaption(lastSpoken?.slice(0, 120) ?? "آماده‌سازی پاسخ اجرایی…");
  }, [state, lastSpoken]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: timing.voice * 0.45 }}
        >
          {/* Blurred world */}
          <motion.div
            className="absolute inset-0 bg-overlay backdrop-blur-2xl"
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(24px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
          />

          {/* Ambient light */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={
              reduced
                ? {}
                : {
                    background: [
                      "radial-gradient(ellipse 50% 40% at 50% 45%, var(--glow-ai) 0%, transparent 70%)",
                      "radial-gradient(ellipse 55% 45% at 50% 45%, var(--glow-primary) 0%, transparent 70%)",
                      "radial-gradient(ellipse 50% 40% at 50% 45%, var(--glow-ai) 0%, transparent 70%)",
                    ],
                  }
            }
            transition={{ duration: 6, repeat: Infinity }}
          />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 left-6 z-10 flex h-10 w-10 items-center justify-center rounded-[10px] border border-etch bg-slab/80 text-text-secondary cursor-pointer hover:border-border-hover"
            aria-label="خروج از حالت صوت"
          >
            <X size={18} strokeWidth={1.6} />
          </button>

          <div className="relative z-10 flex flex-col items-center px-6 max-w-2xl w-full">
            <p className="mb-10 text-[13px] text-text-tertiary tracking-wide">
              فرمان صوتی · پیش‌نمایش
            </p>

            <ExecutiveOrganism state={state} reduced={reduced} />

            <motion.p
              key={caption}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              className="mt-12 text-center text-[22px] md:text-[28px] font-medium text-text-primary leading-relaxed"
            >
              {caption}
            </motion.p>

            <div className="mt-8 min-h-[52px]">
              <ThinkingState
                active={thinking}
                steps={thinkingSteps}
                onComplete={onThinkingComplete}
                cinematic
              />
            </div>

            {state === "listening" && !thinking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 flex items-center gap-2 text-[13px] text-text-tertiary"
              >
                <Mic size={14} className="text-accent" />
                انتخاب یکی از سؤالات زیر — شنیدن زنده در نسخه بعد فعال می‌شود
              </motion.div>
            )}

            {/* Quick voice intents */}
            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {demos.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onSubmit(d)}
                  disabled={thinking}
                  className={cn(
                    "rounded-[10px] border border-etch bg-slab/50 px-3 py-2 text-[12px] text-text-secondary cursor-pointer",
                    "hover:border-border-hover disabled:opacity-40"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <Particles reduced={reduced} state={state} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ExecutiveOrganism({
  state,
  reduced,
}: {
  state: VoiceState;
  reduced: boolean;
}) {
  const speaking = state === "speaking";
  const thinking = state === "thinking";
  const listening = state === "listening";

  return (
    <div className="relative h-48 w-48 flex items-center justify-center">
      {/* Outer etch rings */}
      <motion.div
        className="absolute inset-0 rounded-full border border-etch"
        animate={
          reduced
            ? {}
            : {
                scale: listening ? [1, 1.06, 1] : [1, 1.03, 1],
                opacity: [0.4, 0.8, 0.4],
              }
        }
        transition={{ ...loopTween, duration: listening ? 2.2 : 4.5 }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border border-etch-strong"
        animate={
          reduced
            ? {}
            : { rotate: 360, scale: thinking ? [1, 1.04, 1] : 1 }
        }
        transition={
          thinking
            ? { ...loopTween, duration: 3 }
            : { type: "tween", duration: 40, repeat: Infinity, ease: "linear" }
        }
        style={{ borderStyle: "dashed" }}
      />
      <motion.div
        className="absolute inset-10 rounded-full border border-accent/30"
        animate={
          reduced
            ? {}
            : {
                scale: speaking ? [1, 1.08, 0.96, 1] : [1, 1.03, 1],
                opacity: speaking ? [0.6, 1, 0.6] : [0.5, 0.85, 0.5],
              }
        }
        transition={{
          duration: speaking ? 1.4 : 5,
          repeat: Infinity,
          ease: [0.45, 0, 0.55, 1],
        }}
      />

      {/* Core mass */}
      <motion.div
        className="relative h-24 w-24 rounded-full border border-border-hover"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, var(--primary)55, var(--accent)40, var(--slab) 70%)",
          boxShadow: speaking
            ? "0 0 48px var(--glow-primary), 0 0 80px var(--glow-ai)"
            : thinking
              ? "0 0 40px var(--glow-ai)"
              : "0 0 32px var(--glow-ai)",
        }}
        animate={
          reduced
            ? {}
            : {
                scale: speaking
                  ? [1, 1.12, 0.94, 1.06, 1]
                  : thinking
                    ? [1, 1.05, 1]
                    : [1, 1.04, 1],
              }
        }
        transition={{
          duration: speaking ? 1.6 : thinking ? 2.2 : 4,
          repeat: Infinity,
          ease: [0.45, 0, 0.55, 1],
        }}
      >
        <motion.div
          className="absolute inset-[28%] rounded-full bg-primary/40 blur-sm"
          animate={reduced ? {} : { opacity: [0.4, 0.9, 0.4] }}
          transition={loopTween}
        />
        <div className="absolute inset-[38%] rounded-full bg-text-primary/90" />
      </motion.div>

      {/* Asymmetric thinking flare */}
      {thinking && !reduced && (
        <motion.div
          className="absolute -right-2 top-8 h-3 w-3 rounded-full bg-accent"
          animate={{ x: [0, 12, 0], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      )}
    </div>
  );
}

function Particles({
  reduced,
  state,
}: {
  reduced: boolean;
  state: VoiceState;
}) {
  if (reduced) return null;
  const count = state === "speaking" ? 8 : 5;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-accent/50"
          style={{
            left: `${8 + ((i * 17) % 84)}%`,
            top: `${12 + ((i * 23) % 76)}%`,
          }}
          animate={{
            y: [0, -20 - (i % 5) * 4, 0],
            opacity: [0.1, 0.7, 0.1],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 3 + (i % 4),
            repeat: Infinity,
            delay: i * 0.15,
            ease: [0.45, 0, 0.55, 1],
          }}
        />
      ))}
    </div>
  );
}
