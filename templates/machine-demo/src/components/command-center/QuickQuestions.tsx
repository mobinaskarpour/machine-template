"use client";

import { motion } from "framer-motion";
import { spring, stagger, cardHover } from "@/lib/motion";
import {
  changedSinceYesterday,
  quickQuestions,
} from "@/mock/command-center";
import { uiLabels } from "@/config/labels";
import { useCommandCenter } from "./CommandCenterContext";
import { useReducedMotion } from "@/components/motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

const toneDot = {
  critical: "bg-danger",
  high: "bg-warning",
  medium: "bg-accent",
  low: "bg-success",
  healthy: "bg-success",
};

export function ChangedStrip() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, ...spring.soft }}
      className="mt-10"
    >
      <p className="mb-4 text-[13px] font-medium text-text-tertiary">
        {uiLabels.fromYesterday}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {changedSinceYesterday.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.07, ...spring.gentle }}
            className="min-w-[220px] shrink-0 rounded-[12px] border border-etch bg-slab/60 px-4 py-3"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={cn("h-1.5 w-1.5 rounded-full", toneDot[item.tone])}
              />
              <p className="text-[13px] font-medium text-text-primary truncate">
                {item.title}
              </p>
            </div>
            <p className="text-[12px] text-text-tertiary">{item.detail}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

export function QuickQuestions() {
  const { triggerPulse } = useCommandCenter();
  const reduced = useReducedMotion();

  return (
    <section>
      <p className="mb-4 text-[13px] font-medium text-text-tertiary">
        {uiLabels.quickQuestions}
      </p>
      <motion.div
        variants={stagger.fast}
        initial="initial"
        animate="animate"
        className="flex flex-wrap gap-2.5"
      >
        {quickQuestions.map((q, i) => (
          <motion.div key={q.id} variants={stagger.item}>
            <Link href={`/chat?q=${encodeURIComponent(q.question)}`}>
              <motion.span
                whileHover={reduced ? undefined : cardHover}
                onMouseEnter={() => {
                  if (i === 0 || i === 1) triggerPulse("risk");
                  else if (i === 2 || i === 4) triggerPulse("cash");
                  else if (i === 3) triggerPulse("ops");
                  else triggerPulse("portfolio");
                }}
                className="inline-flex rounded-[10px] border border-etch bg-slab/70 px-4 py-2.5 text-[13px] text-text-secondary cursor-pointer transition-colors duration-[120ms] hover:border-border-hover hover:text-text-primary hover:bg-slab-raised"
              >
                {q.question}
              </motion.span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
