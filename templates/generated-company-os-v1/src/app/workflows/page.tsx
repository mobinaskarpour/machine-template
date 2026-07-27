import Link from "next/link";
import { runtime } from "@/lib/runtime";

export default function WorkflowsPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Workflows</h1>
      <p className="text-sm text-stone-600">Demo representations only — not an executable workflow engine.</p>
      <div className="space-y-3">
        {runtime.workflows.map((w) => (
          <Link key={w.id} href={`/workflows/${encodeURIComponent(w.id)}`} className="block rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-medium">{w.name}</h2>
              <span className="text-xs uppercase tracking-wide text-stone-500">{w.priority}</span>
            </div>
            <p className="mt-2 text-sm text-stone-600">{w.purpose}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
