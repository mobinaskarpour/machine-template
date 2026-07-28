import { notFound } from "next/navigation";
import { runtime } from "@/lib/runtime";
import { findByIdOrRouteSegment } from "@/lib/route-resolve";
import { KpiGrid } from "@/components/KpiGrid";
import { DashboardCharts } from "@/components/DashboardCharts";

export default function DashboardDetailPage({ params }: { params: { id: string } }) {
  const dash = findByIdOrRouteSegment(runtime.dashboards, params.id);
  if (!dash) notFound();
  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wide text-stone-500">{dash.priority}</p>
        <h1 className="text-2xl font-semibold">{dash.name}</h1>
        <p className="mt-2 max-w-3xl text-stone-600">{dash.purpose}</p>
      </header>
      <KpiGrid dashboardId={dash.id} />
      <DashboardCharts dashboardId={dash.id} />
      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="font-medium">Widgets</h2>
        <ul className="mt-3 space-y-2 text-sm text-stone-700">
          {dash.widgets.map((w) => (
            <li key={w.id} className="flex justify-between gap-3 border-b border-stone-100 py-2">
              <span>{w.title}</span>
              <span className="text-stone-500">{w.type}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
