"use client";

import { useEffect } from "react";
import { MotionProvider } from "@/components/motion";
import { SessionGate } from "@/components/shell/SessionGate";
import { ToastStack } from "@/components/shell/ToastStack";
import { useDecisionStore } from "@/store/decision-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const ensureDefaults = useDecisionStore((s) => s.ensureDefaults);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
    ensureDefaults();
  }, [ensureDefaults]);

  return (
    <MotionProvider>
      <SessionGate>
        {children}
        <ToastStack />
      </SessionGate>
    </MotionProvider>
  );
}
