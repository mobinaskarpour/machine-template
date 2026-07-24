"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Ban } from "lucide-react";
import { spring, stagger } from "@/lib/motion";
import { useDecisionStore } from "@/store/decision-store";
import { DecisionDialog } from "@/components/shell/DecisionDialog";
import { useReducedMotion } from "@/components/motion";
import { cn } from "@/lib/utils";

export function TodayDecisions() {
  const decisions = useDecisionStore((s) => s.decisions);
  const reduced = useReducedMotion();
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const open = decisions.filter((d) => d.status === "open");
  const closed = decisions.filter((d) => d.status !== "open");

  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="text-[18px] font-semibold text-text-primary">
            سه تصمیم امروز
          </h2>
          <p className="mt-1 text-[13px] text-text-tertiary">
            تأیید اینجا ثبت می‌شود — نه گفتگو برای گفتگو.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            router.push(
              `/chat?q=${encodeURIComponent("امروز سه تصمیمی که باید بگیرم چیست؟")}`
            )
          }
          className="text-[13px] text-accent hover:underline cursor-pointer"
        >
          توضیح با هوش مصنوعی
        </button>
      </div>

      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        {open.map((d) => (
          <motion.button
            key={d.id}
            type="button"
            variants={stagger.item}
            whileHover={reduced ? undefined : { y: -2, transition: spring.gentle }}
            onClick={() => setActiveId(d.id)}
            className="text-right rounded-[14px] border border-etch bg-slab/80 px-5 py-4 cursor-pointer hover:border-border-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
          >
            <p className="text-[15px] font-semibold text-text-primary leading-snug">
              {d.title}
            </p>
            <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
              {d.detail}
            </p>
            <p className="mt-3 text-[13px] text-primary tabular-nums">
              {d.moneyAtStake}
            </p>
            <p className="mt-3 text-[12px] text-text-tertiary">ثبت تصمیم ←</p>
          </motion.button>
        ))}
      </motion.div>

      {closed.length > 0 && (
        <ul className="mt-4 space-y-2">
          {closed.map((d) => (
            <li
              key={d.id}
              className={cn(
                "flex items-start gap-2 rounded-[10px] border border-etch px-4 py-2.5 text-[13px]",
                d.status === "approved" && "text-success",
                d.status === "deferred" && "text-warning",
                d.status === "rejected" && "text-danger"
              )}
            >
              {d.status === "approved" && <CheckCircle2 size={14} className="mt-0.5" />}
              {d.status === "deferred" && <Clock3 size={14} className="mt-0.5" />}
              {d.status === "rejected" && <Ban size={14} className="mt-0.5" />}
              <span>
                <span className="font-medium">{d.title}</span>
                {d.consequence ? ` — ${d.consequence}` : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      <DecisionDialog
        actionId={activeId}
        open={Boolean(activeId)}
        onClose={() => setActiveId(null)}
      />
    </section>
  );
}
