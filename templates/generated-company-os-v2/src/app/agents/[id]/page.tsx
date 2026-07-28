import { notFound } from "next/navigation";
import { runtime } from "@/lib/runtime";
import { findByIdOrRouteSegment } from "@/lib/route-resolve";

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const agent = findByIdOrRouteSegment(runtime.agents, params.id);
  if (!agent) notFound();
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{agent.name}</h1>
        <p className="mt-2 text-stone-600">{agent.mission}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-medium">Mode & boundary</h2>
          <p className="mt-2 text-sm">{agent.executionMode}</p>
          <p className="mt-2 text-sm text-stone-600">{agent.approvalBoundary}</p>
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-medium">Prohibited actions</h2>
          <ul className="mt-2 list-disc pe-5 text-sm text-stone-700">
            {agent.prohibitedActions.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      </div>
      <section className="rounded-2xl border border-dashed border-emerald-700/30 bg-emerald-50/50 p-4">
        <h2 className="font-medium">Example mock insight</h2>
        <p className="mt-2 text-sm text-stone-700">
          Synthetic insight for demo: review open exceptions and prioritize approval queues. No
          autonomous action.
        </p>
      </section>
    </main>
  );
}
