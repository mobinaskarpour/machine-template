"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, ArrowUp } from "lucide-react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface PromptBarProps {
  onSubmit: (value: string) => void;
  onVoice: () => void;
  disabled?: boolean;
}

export function PromptBar({ onSubmit, onVoice, disabled }: PromptBarProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
    inputRef.current?.focus();
  }, [value, disabled, onSubmit]);

  return (
    <div className="border-t border-etch bg-deck/80 backdrop-blur-md p-4">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="موضوع جلسه را بپرسید — مثلاً اثر یک هفته تأخیر آریا…"
            rows={1}
            disabled={disabled}
            className={cn(
              "w-full resize-none rounded-[10px] border border-etch bg-void px-4 py-3",
              "text-[15px] text-text-primary placeholder:text-text-tertiary",
              "outline-none transition-colors duration-[120ms] focus:border-border-hover",
              "disabled:opacity-50 max-h-32"
            )}
            style={{ minHeight: 46 }}
          />
        </div>

        <motion.button
          type="button"
          onClick={onVoice}
          whileHover={{ y: -2, transition: spring.gentle }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-accent/30 bg-accent-soft text-accent cursor-pointer hover:border-accent/50"
          aria-label="حالت صوت اجرایی"
        >
          <Mic size={18} strokeWidth={1.6} />
        </motion.button>

        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          whileHover={{ y: -2, transition: spring.gentle }}
          whileTap={{ scale: 0.95, transition: spring.snappy }}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] cursor-pointer",
            value.trim() && !disabled
              ? "bg-primary text-text-inverse border border-primary shadow-[0_0_16px_var(--glow-primary)]"
              : "border border-etch text-text-tertiary opacity-50 cursor-not-allowed"
          )}
          aria-label="ارسال"
        >
          <ArrowUp size={18} strokeWidth={1.6} />
        </motion.button>
      </div>
    </div>
  );
}
