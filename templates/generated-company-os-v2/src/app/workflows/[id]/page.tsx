import { notFound } from "next/navigation";
import { runtime } from "@/lib/runtime";
import { findByIdOrRouteSegment } from "@/lib/route-resolve";

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
  const wf = findByIdOrRouteSegment(runtime.workflows, params.id);
  if (!wf) notFound();
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{wf.name}</h1>
        <p className="mt-2 text-stone-600">{wf.purpose}</p>
        <p className="mt-2 text-xs text-stone-500">
          Audit: {wf.auditRequired ? "required" : "optional"} · Demo only
        </p>
      </header>
      <ol className="space-y-3">
        {wf.stages.map((s) => (
          <li key={s.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-xs text-stone-500">Stage {s.order}</p>
            <p className="font-medium">{s.name}</p>
            <p className="mt-1 text-sm text-stone-600">
              {s.approvalRequired ? "Approval required" : "No approval gate"}
            </p>
          </li>
        ))}
      </ol>
      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="font-medium">States</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {wf.states.map((st) => (
            <span key={st} className="rounded-full bg-stone-100 px-3 py-1 text-xs">
              {st}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
