import { runtime } from "@/lib/runtime";
import { KpiGrid } from "@/components/KpiGrid";
import { DashboardCharts } from "@/components/DashboardCharts";

export default function HomePage() {
  const dash = runtime.dashboards[0];
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-emerald-900/70">{runtime.demo.authLabel}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{runtime.company.displayName}</h1>
        <p className="max-w-3xl text-base leading-7 text-stone-700">{runtime.company.description}</p>
      </header>
      {dash ? (
        <>
          <h2 className="text-xl font-medium">{dash.name}</h2>
          <KpiGrid dashboardId={dash.id} />
          <DashboardCharts dashboardId={dash.id} />
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-6">No dashboards configured.</p>
      )}
    </main>
  );
}
