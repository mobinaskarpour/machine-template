"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain,
  Link2,
  FileText,
  GitBranch,
  Save,
  CheckCircle2,
  Wallet,
} from "lucide-react";
import type { ExecutiveReport } from "@/types/ai";
import { spring } from "@/lib/motion";
import { pageLabels } from "@/config/labels";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/components/motion";
import { DecisionDialog } from "@/components/shell/DecisionDialog";
import { useDecisionStore } from "@/store/decision-store";

const actionIcons: Record<string, typeof Save> = {
  "approve-collection": Wallet,
  "recovery-meeting": CheckCircle2,
  "open-dossier": FileText,
  "priority-ar": Wallet,
  "pin-cash": FileText,
  "approve-recovery": CheckCircle2,
  "client-brief": FileText,
  "eval-sub": GitBranch,
  "conditional-pay": Wallet,
  "send-inbox": Save,
  "start-first": CheckCircle2,
  "break-wip": FileText,
  "open-risk": FileText,
};

const sourceLabels: Record<string, string> = {
  schedule: "برنامه زمان‌بندی",
  finance: "مالی",
  contract: "قرارداد",
  memory: "حافظه جلسه",
  ops: "عملیات",
  ar: "مطالبات",
  inbox: "صندوق اجرایی",
  command: "دید مدیریتی",
};

const decisionActionIds = new Set([
  "approve-collection",
  "recovery-meeting",
  "priority-ar",
  "conditional-pay",
  "approve-recovery",
  "vo-14",
]);

export function ContextPanel({
  report,
}: {
  report: ExecutiveReport | null;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const pushToast = useDecisionStore((s) => s.pushToast);
  const [decisionId, setDecisionId] = useState<string | null>(null);

  const runAction = (id: string, label: string) => {
    if (id === "open-dossier") {
      router.push("/projects/aria");
      return;
    }
    if (id === "open-risk") {
      router.push(
        `/chat?q=${encodeURIComponent("کدام پروژه بیشترین ریسک را دارد؟")}`
      );
      return;
    }
    if (id === "send-inbox") {
      pushToast("سه تصمیم امروز در صندوق اجرایی تثبیت شد.");
      router.push("/inbox");
      return;
    }
    if (id === "start-first") {
      setDecisionId("approve-collection");
      return;
    }
    if (id === "break-wip" || id === "pin-cash" || id === "client-brief") {
      router.push(`/chat?q=${encodeURIComponent(label)}`);
      return;
    }
    if (decisionActionIds.has(id) || id.includes("approve") || id.includes("pay")) {
      setDecisionId(id);
      return;
    }
    router.push(`/chat?q=${encodeURIComponent(label)}`);
  };

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 border-r border-etch bg-deck/50 overflow-y-auto">
      <div className="p-4 border-b border-etch">
        <p className="text-[12px] font-medium text-text-tertiary">زمینه جلسه</p>
        <p className="mt-1 text-[15px] text-text-primary">{pageLabels.chat}</p>
      </div>

      {!report && (
        <p className="p-4 text-[13px] text-text-tertiary leading-relaxed">
          پس از نخستین پاسخ، استدلال، منابع و اقدامات قابل ثبت اینجا می‌آید.
        </p>
      )}

      {report?.reasoning && report.reasoning.length > 0 && (
        <div className="p-4 border-b border-etch">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} strokeWidth={1.6} className="text-accent" />
            <p className="text-[12px] font-medium text-text-tertiary">استدلال</p>
          </div>
          <div className="space-y-2">
            {report.reasoning.map((item) => (
              <p
                key={item}
                className="text-[13px] text-text-secondary leading-relaxed"
              >
                {item}
              </p>
            ))}
          </div>
        </div>
      )}

      {report?.citations && report.citations.length > 0 && (
        <div className="p-4 border-b border-etch">
          <div className="flex items-center gap-2 mb-3">
            <Link2 size={14} strokeWidth={1.6} className="text-primary" />
            <p className="text-[12px] font-medium text-text-tertiary">منابع</p>
          </div>
          <div className="space-y-2">
            {report.citations.map((cite) => (
              <motion.div
                key={cite.id}
                whileHover={
                  reduced ? undefined : { x: -2, transition: spring.gentle }
                }
                className="rounded-[10px] border border-etch px-3 py-2 hover:border-etch-strong transition-colors"
              >
                <p className="text-[13px] text-text-primary">{cite.label}</p>
                <p className="text-[11px] text-text-tertiary mt-0.5">
                  {sourceLabels[cite.source] ?? "منبع سازمانی"}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {report?.actions && report.actions.length > 0 && (
        <div className="p-4">
          <p className="text-[12px] font-medium text-text-tertiary mb-3">
            اقدامات اجرایی
          </p>
          <div className="space-y-1.5">
            {report.actions.map((action) => {
              const Icon = actionIcons[action.id] ?? FileText;
              return (
                <motion.button
                  key={action.id}
                  type="button"
                  whileHover={
                    reduced ? undefined : { x: -2, transition: spring.gentle }
                  }
                  onClick={() => runAction(action.id, action.label)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 min-h-[44px]",
                    "text-[13px] text-text-secondary text-right cursor-pointer",
                    "hover:bg-hover hover:text-text-primary transition-colors duration-[120ms]",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                  )}
                >
                  <Icon size={14} strokeWidth={1.6} />
                  {action.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      <DecisionDialog
        actionId={decisionId}
        open={Boolean(decisionId)}
        onClose={() => setDecisionId(null)}
      />
    </aside>
  );
}
