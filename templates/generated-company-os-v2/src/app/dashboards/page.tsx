import Link from "next/link";
import { runtime } from "@/lib/runtime";
import { KpiGrid } from "@/components/KpiGrid";
import { DashboardCharts } from "@/components/DashboardCharts";

export default function DashboardsPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboards</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {runtime.dashboards.map((d) => (
          <Link key={d.id} href={`/dashboards/${encodeURIComponent(d.id)}`} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-emerald-700/40">
            <h2 className="text-lg font-medium">{d.name}</h2>
            <p className="mt-2 text-sm text-stone-600">{d.purpose}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-stone-500">{d.priority}</p>
          </Link>
        ))}
      </div>
      {runtime.dashboards[0] ? (
        <div className="space-y-4">
          <KpiGrid dashboardId={runtime.dashboards[0].id} />
          <DashboardCharts dashboardId={runtime.dashboards[0].id} />
        </div>
      ) : null}
    </main>
  );
}
