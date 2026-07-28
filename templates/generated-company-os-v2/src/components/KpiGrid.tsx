import { runtime, mockData } from "@/lib/runtime";

export function KpiGrid({ dashboardId }: { dashboardId: string }) {
  const dash = runtime.dashboards.find((d) => d.id === dashboardId);
  if (!dash) return null;
  const widgets = dash.widgets.filter((w) => w.type === "KPI_CARD" || w.type === "GAUGE").slice(0, 6);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {widgets.map((w) => {
        const value = (mockData.totals as Record<string, number>)[w.kpiIds[0] ?? ""] ?? w.kpiIds.length;
        return (
          <div key={w.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-stone-500">{w.title}</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
            <p className="mt-2 text-xs leading-5 text-stone-600">{w.description}</p>
          </div>
        );
      })}
    </div>
  );
}
