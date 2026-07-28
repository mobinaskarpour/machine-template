import type { RuntimeBlueprint } from "@/lib/runtime";

type WithIdRoute = { id: string; route?: string };

/** Match dynamic [id] params against blueprint ids or trailing route segments. */
export function findByIdOrRouteSegment<T extends WithIdRoute>(
  items: T[],
  param: string,
): T | undefined {
  return items.find((item) => {
    if (item.id === param) return true;
    if (!item.route) return false;
    if (item.route === param || item.route === `/${param}`) return true;
    const segment = item.route.replace(/\/+$/, "").split("/").pop();
    return segment === param;
  });
}

export function dashboardPath(d: WithIdRoute): string {
  return `/dashboards/${d.id}`;
}

export function modulePath(m: WithIdRoute): string {
  return `/modules/${m.id}`;
}

export function workflowPath(w: WithIdRoute): string {
  return `/workflows/${w.id}`;
}

export function agentPath(a: WithIdRoute): string {
  return `/agents/${a.id}`;
}

export type RuntimeNav = RuntimeBlueprint["navigation"];
