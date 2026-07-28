"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { runtime } from "@/lib/runtime";
import {
  agentPath,
  dashboardPath,
  modulePath,
  workflowPath,
} from "@/lib/route-resolve";

function resolveNavHref(route: string): string {
  const dash = runtime.dashboards.find((d) => d.route === route);
  if (dash) return dashboardPath(dash);

  const mod = runtime.modules.find(
    (m) =>
      m.routePrefix === route ||
      route.startsWith(`${m.routePrefix}/`) ||
      m.pages.some((p) => p.route === route),
  );
  if (mod) return modulePath(mod);

  const wf = runtime.workflows.find(
    (w) => route === `/workflows/${w.id}` || route.endsWith(`/${w.id}`),
  );
  if (wf) return workflowPath(wf);

  const agent = runtime.agents.find(
    (a) => route === `/agents/${a.id}` || route.endsWith(`/${a.id}`),
  );
  if (agent) return agentPath(agent);

  return route;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const primary = runtime.navigation.primary;
  const utility = runtime.navigation.utility;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-e border-stone-200 bg-[var(--brand)] text-[var(--brand-foreground)]">
        <div className="px-5 py-6">
          <p className="text-xs uppercase tracking-[0.2em] opacity-80">Company OS</p>
          <h1 className="mt-2 text-xl font-semibold leading-snug">{runtime.company.displayName}</h1>
          <p className="mt-2 text-xs opacity-80">{runtime.company.industryPackId}</p>
        </div>
        <nav className="space-y-1 px-3 pb-6" aria-label="Primary">
          <Link
            href="/"
            className={`block rounded-lg px-3 py-2 text-sm ${pathname === "/" ? "bg-white/15" : "hover:bg-white/10"}`}
          >
            Overview
          </Link>
          {primary.map((item) => {
            const href = resolveNavHref(item.route);
            return (
              <Link
                key={item.id}
                href={href}
                className={`block rounded-lg px-3 py-2 text-sm ${
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-white/15"
                    : "hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="px-3 pt-4 text-[11px] uppercase tracking-wider opacity-70">Utility</div>
          {utility.map((item) => {
            const href = resolveNavHref(item.route);
            return (
              <Link
                key={item.id}
                href={href}
                className="block rounded-lg px-3 py-2 text-sm hover:bg-white/10"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
          <div>
            <p className="text-xs text-stone-500">Demo role simulation</p>
            <select
              className="mt-1 rounded-md border border-stone-300 bg-white px-2 py-1 text-sm"
              defaultValue={runtime.roles[0]?.id}
              aria-label="Demo role"
            >
              {runtime.roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-stone-500">{runtime.demo.authLabel}</p>
        </header>
        <div className="px-4 py-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
