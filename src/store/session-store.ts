"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { company } from "@/lib/demo/config";

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
  orgName: company.session.orgName,
  userName: company.session.userName,
  role: company.session.role,
  initials: company.session.initials,
  asOfLabel: company.session.asOfLabel,
  sources: [...company.session.sources],
  demoMode: company.session.demoMode,
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
      name: company.session.persistKey,
      partialize: (s) => ({ entered: s.entered, session: s.session }),
    }
  )
);
