"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Command,
  Sparkles,
  Layers,
  Inbox,
  LayoutDashboard,
  GitBranch,
  type LucideIcon,
} from "lucide-react";
import { spring } from "@/lib/motion";
import { railItems } from "@/config/labels";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  command: Command,
  sparkles: Sparkles,
  layers: Layers,
  layout: LayoutDashboard,
  branch: GitBranch,
  inbox: Inbox,
};

export function ExecutiveRail() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-col items-center gap-2 py-6 px-2 overflow-y-auto max-h-screen"
      aria-label="ناوبری اجرایی"
    >
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-[10px] border border-etch-strong bg-slab">
        <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_var(--glow-primary)]" />
      </div>

      {railItems.map((item) => {
        const Icon = iconMap[item.icon];
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.id}
            href={item.href}
            className="group relative flex flex-col items-center shrink-0"
            aria-current={isActive ? "page" : undefined}
            title={item.label}
          >
            <motion.div
              whileHover={{ y: -2, transition: spring.gentle }}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-[10px]",
                "border transition-colors duration-[120ms]",
                isActive
                  ? "border-border-hover bg-slab text-primary shadow-[0_0_20px_var(--glow-primary)]"
                  : "border-transparent text-text-tertiary hover:border-etch hover:bg-hover hover:text-text-secondary"
              )}
            >
              {Icon && <Icon size={20} strokeWidth={1.6} />}
            </motion.div>
            <span
              className={cn(
                "mt-1.5 max-w-[72px] text-center text-[10px] font-medium leading-tight transition-colors duration-[120ms]",
                isActive
                  ? "text-primary"
                  : "text-text-tertiary/70 group-hover:text-text-tertiary"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
