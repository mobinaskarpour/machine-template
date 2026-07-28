import Link from "next/link";
import { runtime } from "@/lib/runtime";

export default function AgentsPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">AI Agent Center</h1>
      <p className="text-sm text-stone-600">Agents are non-executable planning records. No live LLM calls.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {runtime.agents.map((a) => (
          <Link key={a.id} href={`/agents/${encodeURIComponent(a.id)}`} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium">{a.name}</h2>
            <p className="mt-2 text-sm text-stone-600">{a.mission}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-amber-800">{a.executionMode}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
