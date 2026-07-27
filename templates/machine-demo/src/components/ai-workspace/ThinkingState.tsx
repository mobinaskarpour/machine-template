"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ThinkingStateProps {
  active: boolean;
  steps: string[];
  onComplete?: () => void;
  cinematic?: boolean;
}

export function ThinkingState({
  active,
  steps,
  onComplete,
  cinematic = false,
}: ThinkingStateProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }

    setIndex(0);
    const interval = setInterval(() => {
      setIndex((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 280);
          return prev;
        }
        return prev + 1;
      });
    }, cinematic ? 900 : 700);

    return () => clearInterval(interval);
  }, [active, steps, onComplete, cinematic]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
          transition={spring.soft}
          className={cn(
            "flex items-center gap-4 rounded-[12px] border border-accent/25 bg-accent-soft/80 backdrop-blur-md",
            cinematic ? "px-6 py-4" : "px-4 py-3"
          )}
          aria-live="polite"
          role="status"
        >
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-accent"
                animate={{ opacity: [0.25, 1, 0.25], scale: [1, 1.2, 1] }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  delay: i * 0.18,
                }}
              />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
              transition={spring.gentle}
              className={cn(
                "text-text-secondary",
                cinematic ? "text-[16px]" : "text-[13px]"
              )}
            >
              {steps[index] ?? "در حال تحلیل…"}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
