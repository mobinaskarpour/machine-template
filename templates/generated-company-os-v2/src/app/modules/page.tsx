import Link from "next/link";
import { runtime, mockData } from "@/lib/runtime";

export default function ModulesPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Modules</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {runtime.modules.map((m) => {
          const count = (mockData.totals as Record<string, number>)[`module:${m.id}`] ?? m.pages.length;
          return (
            <Link key={m.id} href={`/modules/${encodeURIComponent(m.id)}`} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-medium">{m.name}</h2>
              <p className="mt-2 text-sm text-stone-600">{m.description}</p>
              <p className="mt-4 text-xs text-stone-500">{count} records · {m.pages.length} pages</p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
