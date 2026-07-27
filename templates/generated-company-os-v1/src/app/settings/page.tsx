import { runtime } from "@/lib/runtime";

export default function SettingsPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings & company profile</h1>
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-medium">Identity</h2>
        <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          <div><dt className="text-stone-500">Name</dt><dd>{runtime.company.displayName}</dd></div>
          <div><dt className="text-stone-500">Slug</dt><dd className="font-mono text-xs">{runtime.company.slug}</dd></div>
          <div><dt className="text-stone-500">Industry</dt><dd>{runtime.company.industryPackId}</dd></div>
          <div><dt className="text-stone-500">RTL</dt><dd>{runtime.company.rtl ? "yes" : "no"}</dd></div>
        </dl>
      </section>
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-medium">Demo assumptions</h2>
        <ul className="mt-3 list-disc pe-5 text-sm text-stone-700">
          <li>{runtime.demo.currencyAssumption}</li>
          <li>{runtime.demo.calendarAssumption}</li>
          <li>{runtime.demo.authLabel}</li>
        </ul>
      </section>
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-medium">Unresolved questions</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {runtime.unresolvedQuestions.map((q) => (
            <li key={q.id} className="rounded-lg bg-stone-50 px-3 py-2">
              {q.question}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
