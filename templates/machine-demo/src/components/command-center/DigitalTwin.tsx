"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { spring, breathe } from "@/lib/motion";
import { twinNodes, type TwinFocus } from "@/mock/command-center";
import { uiLabels } from "@/config/labels";
import { useCommandCenter } from "./CommandCenterContext";
import { useReducedMotion } from "@/components/motion";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/persian";
import { dashboardEntryFor } from "@/config/capabilities";

function healthColor(h: number) {
  if (h < 0.45) return "var(--danger)";
  if (h < 0.65) return "var(--warning)";
  return "var(--success)";
}

export function DigitalTwin() {
  const router = useRouter();
  const { twinFocus, setTwinFocus, pulse } = useCommandCenter();
  const reduced = useReducedMotion();

  const overall =
    twinNodes.reduce((s, n) => s + n.health, 0) / twinNodes.length;

  const openNode = (id: TwinFocus) => {
    if (!id) return;
    setTwinFocus(id);
    router.push(`/dashboards/${dashboardEntryFor(id)}`);
  };

  return (
    <section className="relative flex flex-col items-center">
      <p className="mb-2 text-[13px] font-medium text-text-tertiary">
        {uiLabels.digitalTwin}
      </p>
      <p className="mb-6 text-[12px] text-text-tertiary">
        هر گره → داشبورد تخصصی همان حوزه
      </p>

      <div className="relative h-[340px] w-full max-w-[420px]">
        <motion.div
          className="absolute inset-[8%] rounded-full border border-etch"
          animate={reduced ? {} : breathe.animate}
          transition={breathe.transition}
        />
        <motion.div
          className="absolute inset-[18%] rounded-full border border-etch-strong/60"
          animate={reduced ? {} : { rotate: 360 }}
          transition={{
            type: "tween",
            duration: 80,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ borderStyle: "dashed" }}
        />

        <svg
          className="absolute inset-0 h-full w-full pointer-events-none"
          viewBox="0 0 420 340"
          aria-hidden
        >
          {twinNodes.map((node) => {
            const rad = (node.angle * Math.PI) / 180;
            const cx = 210 + Math.cos(rad) * 118;
            const cy = 170 + Math.sin(rad) * 100;
            const active = twinFocus === node.id;
            return (
              <motion.line
                key={node.id}
                x1="210"
                y1="170"
                x2={cx}
                y2={cy}
                stroke={active ? "var(--primary)" : "var(--accent-muted)"}
                strokeWidth={active ? 1.5 : 1}
                initial={{ opacity: 0.15 }}
                animate={{ opacity: active ? 0.7 : 0.2 }}
                transition={spring.gentle}
              />
            );
          })}
        </svg>

        <motion.button
          type="button"
          className="absolute left-1/2 top-1/2 z-10 flex h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-border-hover bg-gradient-to-br from-primary/25 via-slab to-accent/20 cursor-pointer"
          animate={
            reduced
              ? {}
              : {
                  scale: pulse ? [1, 1.04, 1] : 1,
                  boxShadow: twinFocus
                    ? "0 0 32px var(--glow-primary)"
                    : "0 0 24px var(--glow-ai)",
                }
          }
          transition={spring.soft}
          onClick={() => router.push("/dashboards/db-risk")}
          aria-label="ورود به داشبورد ریسک پورتفویو"
        >
          <span className="text-[22px] font-semibold tabular-nums text-text-primary">
            {toPersianDigits(Math.round(overall * 100))}
          </span>
          <span className="text-[10px] text-text-tertiary">سلامت</span>
        </motion.button>

        {twinNodes.map((node, i) => {
          const rad = (node.angle * Math.PI) / 180;
          const x = Math.cos(rad) * 118;
          const y = Math.sin(rad) * 100;
          const active = twinFocus === node.id;

          return (
            <motion.button
              key={node.id}
              type="button"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{
                opacity: 1,
                scale: active ? 1.08 : 1,
                x,
                y,
              }}
              transition={{ delay: 0.4 + i * 0.08, ...spring.soft }}
              whileHover={{ scale: 1.1, transition: spring.gentle }}
              onClick={() => openNode(node.id as TwinFocus)}
              className={cn(
                "absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2",
                "min-w-[76px] rounded-[10px] border px-3 py-2 text-center cursor-pointer backdrop-blur-sm",
                active
                  ? "border-primary/50 bg-primary-soft shadow-[0_0_20px_var(--glow-primary)]"
                  : "border-etch bg-slab/90 hover:border-etch-strong"
              )}
            >
              <span
                className="mx-auto mb-1 block h-1.5 w-1.5 rounded-full"
                style={{ background: healthColor(node.health) }}
              />
              <span className="block text-[12px] font-medium text-text-primary">
                {node.label}
              </span>
              <span className="block text-[11px] tabular-nums text-text-tertiary">
                {toPersianDigits(Math.round(node.health * 100))}٪
              </span>
            </motion.button>
          );
        })}

        <AnimatePresence>
          {twinFocus && (
            <motion.p
              key={twinFocus}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -bottom-2 left-0 right-0 text-center text-[12px] text-accent"
            >
              ورود به داشبورد{" "}
              {twinNodes.find((n) => n.id === twinFocus)?.label}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
