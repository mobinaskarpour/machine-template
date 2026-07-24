"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Command,
  Sparkles,
  Layers,
  Inbox,
  LayoutDashboard,
  GitBranch,
  type LucideIcon,
} from "lucide-react";
import { railItems } from "@/config/labels";
import { cn } from "@/lib/utils";
import { ExecutiveRail } from "./ExecutiveRail";
import { Topbar } from "./Topbar";
import { PageTransition } from "@/components/motion";

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  dense?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  command: Command,
  sparkles: Sparkles,
  layers: Layers,
  layout: LayoutDashboard,
  branch: GitBranch,
  inbox: Inbox,
};

export function AppShell({ children, pageTitle, dense }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-void bg-void-depth">
      <aside className="hidden md:flex flex-col w-[76px] shrink-0 border-l border-etch bg-deck/80 backdrop-blur-md">
        <ExecutiveRail />
      </aside>

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
        <div
          className="pointer-events-none absolute inset-0 bg-structure opacity-40"
          aria-hidden
        />
        <Topbar pageTitle={pageTitle} />
        <main
          className={cn(
            "relative flex-1 min-h-0 overflow-hidden",
            "pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0"
          )}
        >
          <PageTransition
            className={cn(
              "h-full",
              dense ? "overflow-hidden" : "overflow-y-auto"
            )}
          >
            {children}
          </PageTransition>
        </main>

        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-etch bg-deck/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
          aria-label="ناوبری موبایل"
        >
          <ul className="flex items-stretch justify-around px-1 pt-1.5 pb-1.5">
            {railItems.map((item) => {
              const Icon = iconMap[item.icon];
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <li key={item.id} className="flex-1">
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-[10px] px-1 py-1.5 min-h-[44px] justify-center",
                      "transition-colors duration-[120ms]",
                      isActive
                        ? "text-primary"
                        : "text-text-tertiary hover:text-text-secondary"
                    )}
                  >
                    {Icon && <Icon size={18} strokeWidth={1.6} />}
                    <span className="text-[9px] font-medium leading-tight text-center max-w-[64px] truncate">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
