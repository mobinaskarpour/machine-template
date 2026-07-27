import { notFound } from "next/navigation";
import { runtime, mockData } from "@/lib/runtime";

export default function ModuleDetailPage({ params }: { params: { id: string } }) {
  const mod = runtime.modules.find((m) => m.id === params.id);
  if (!mod) notFound();
  const entityId =
    mod.pages.find((p) => p.type === "LIST")?.route.includes("ent")
      ? undefined
      : undefined;
  const records = mockData.records as Record<string, Array<Record<string, unknown>>>;
  const preferredKeys = Object.keys(records).filter(
    (k) => k.includes(mod.id.replace(/^mod[-_]?/i, "")) || mod.name.toLowerCase().includes(k.replace(/^ent[-_]?/i, "")),
  );
  const rows = (records[preferredKeys[0] ?? ""] ?? Object.values(records)[0] ?? []).slice(0, 25);
  void entityId;
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{mod.name}</h1>
        <p className="mt-2 text-stone-600">{mod.description}</p>
      </header>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">ID</th>
              <th className="px-4 py-3 text-start font-medium">Title</th>
              <th className="px-4 py-3 text-start font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-stone-500" colSpan={3}>
                  No records for this module in the mock plan.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={String(row.id)} className="border-t border-stone-100">
                  <td className="px-4 py-3 font-mono text-xs">{String(row.id)}</td>
                  <td className="px-4 py-3">{String(row.title ?? row.name ?? "—")}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
                      {String(row.status ?? "active")}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
