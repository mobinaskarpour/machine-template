"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { TwinFocus } from "@/mock/command-center";

interface CommandCenterContextValue {
  twinFocus: TwinFocus;
  setTwinFocus: (focus: TwinFocus) => void;
  pulse: number;
  triggerPulse: (focus?: TwinFocus) => void;
}

const CommandCenterContext = createContext<CommandCenterContextValue | null>(
  null
);

export function CommandCenterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [twinFocus, setTwinFocus] = useState<TwinFocus>(null);
  const [pulse, setPulse] = useState(0);

  const triggerPulse = useCallback((focus?: TwinFocus) => {
    if (focus !== undefined) setTwinFocus(focus);
    setPulse((p) => p + 1);
  }, []);

  return (
    <CommandCenterContext.Provider
      value={{ twinFocus, setTwinFocus, pulse, triggerPulse }}
    >
      {children}
    </CommandCenterContext.Provider>
  );
}

export function useCommandCenter() {
  const ctx = useContext(CommandCenterContext);
  if (!ctx) {
    throw new Error("useCommandCenter must be used within provider");
  }
  return ctx;
}
