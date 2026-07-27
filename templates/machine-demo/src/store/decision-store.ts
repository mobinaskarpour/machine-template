"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DecisionStatus = "open" | "approved" | "deferred" | "rejected";

export interface ExecutiveDecision {
  id: string;
  title: string;
  detail: string;
  moneyAtStake: string;
  status: DecisionStatus;
  consequence?: string;
  decidedAt?: number;
}

interface DecisionState {
  decisions: ExecutiveDecision[];
  toasts: { id: string; message: string }[];
  decide: (
    id: string,
    status: Exclude<DecisionStatus, "open">,
    consequence: string
  ) => void;
  pushToast: (message: string) => void;
  dismissToast: (id: string) => void;
  ensureDefaults: () => void;
}

const defaults: ExecutiveDecision[] = [
  {
    id: "approve-collection",
    title: "اولویت وصول صورت‌وضعیت فاز ۲ آریا",
    detail: "آزادی سرمایه قفل‌شده نزد کارفرما",
    moneyAtStake: "۱۲.۱ میلیارد تومان",
    status: "open",
  },
  {
    id: "recovery-meeting",
    title: "جلسه بازیابی با پیمانکار سازه",
    detail: "بازیابی شناوری مسیر بحرانی تا پایان امروز",
    moneyAtStake: "۴.۲ میلیارد جریمه محتمل",
    status: "open",
  },
  {
    id: "vo-14",
    title: "دستور تغییر ۱۴",
    detail: "اثر حاشیه −۱.۱٪ در صورت تأیید بدون قید",
    moneyAtStake: "۲.۸ میلیارد تومان",
    status: "open",
  },
];

export const useDecisionStore = create<DecisionState>()(
  persist(
    (set, get) => ({
      decisions: defaults,
      toasts: [],

      ensureDefaults: () => {
        if (!get().decisions.length) set({ decisions: defaults });
      },

      decide: (id, status, consequence) => {
        set({
          decisions: get().decisions.map((d) =>
            d.id === id
              ? { ...d, status, consequence, decidedAt: Date.now() }
              : d
          ),
        });
        const toastId = `t-${Date.now()}`;
        set({
          toasts: [
            { id: toastId, message: consequence },
            ...get().toasts,
          ].slice(0, 3),
        });
        setTimeout(() => get().dismissToast(toastId), 5200);
      },

      pushToast: (message) => {
        const toastId = `t-${Date.now()}`;
        set({
          toasts: [{ id: toastId, message }, ...get().toasts].slice(0, 3),
        });
        setTimeout(() => get().dismissToast(toastId), 5200);
      },

      dismissToast: (id) =>
        set({ toasts: get().toasts.filter((t) => t.id !== id) }),
    }),
    {
      name: "machine-executive-decisions",
      partialize: (s) => ({ decisions: s.decisions }),
    }
  )
);
