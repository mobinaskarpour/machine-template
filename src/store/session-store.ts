"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TenantSession {
  orgName: string;
  userName: string;
  role: string;
  initials: string;
  /** Persian calendar-facing stamp for trust */
  asOfLabel: string;
  sources: string[];
  demoMode: boolean;
}

interface SessionState {
  entered: boolean;
  session: TenantSession;
  enter: () => void;
  leave: () => void;
  updateProfile: (patch: Partial<TenantSession>) => void;
}

export const defaultSession: TenantSession = {
  orgName: "گروه ساختمانی آسمان",
  userName: "مهندس رضایی",
  role: "مدیرعامل",
  initials: "ر",
  asOfLabel: "به‌روز تا ساعت ۰۷:۴۰ · امروز",
  sources: [
    "برنامه زمان‌بندی (پریماورا)",
    "دفتر مالی و صورت‌وضعیت",
    "قراردادها و دستور تغییر",
    "عملیات سایت",
  ],
  demoMode: true,
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      entered: false,
      session: defaultSession,
      enter: () => set({ entered: true }),
      leave: () => set({ entered: false }),
      updateProfile: (patch) =>
        set((s) => ({ session: { ...s.session, ...patch } })),
    }),
    {
      name: "machine-session",
      partialize: (s) => ({ entered: s.entered, session: s.session }),
    }
  )
);
