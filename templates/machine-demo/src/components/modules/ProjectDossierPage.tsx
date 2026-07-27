"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  FileText,
  Map,
  Eye,
  Box,
  AlertTriangle,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { spring } from "@/lib/motion";
import { projects } from "@/mock/command-center";
import { useSessionStore } from "@/store/session-store";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";
import { ExecutiveChart } from "@/components/dashboards/ExecutiveCharts";

type ProjectTab = "overview" | "vision" | "documents";

const ariaFacts = [
  {
    title: "شناوری مسیر بحرانی",
    value: "۰ روز",
    detail: "سه روز شناوری از بین رفته؛ نقطه عطف تیرماه در خطر است.",
  },
  {
    title: "صورت‌وضعیت معوق",
    value: "۱۲.۱ میلیارد",
    detail: "فاز ۲ نزد کارفرما؛ متوسط وصول ۲۱ روز.",
  },
  {
    title: "پیمانکار سازه",
    value: "۶۲٪ هدف",
    detail: "بهره‌وری زیر آستانه؛ پرداخت مشروط توصیه می‌شود.",
  },
  {
    title: "جریمه محتمل یک‌هفته",
    value: "۴.۲ میلیارد",
    detail: "اگر بازیابی شروع نشود، بند تأخیر فعال می‌شود.",
  },
];

const visionFindings = [
  { title: "تأخیر جبهه سازه", detail: "۱۳ روز نسبت به برنامه", tone: "danger" },
  { title: "تجهیزات بیکار", detail: "جرثقیل شماره ۲ · ۴ ساعت خواب", tone: "warn" },
  { title: "منطقه مسدود", detail: "بلوک B · دسترسی مصالح قطع", tone: "warn" },
  { title: "نقص ایمنی", detail: "۲ مورد بدون حفاظ لبه", tone: "danger" },
  { title: "کیفیت قالب", detail: "ناپیوستگی در تراز ۳", tone: "warn" },
  { title: "کمبود مصالح", detail: "فولاد مسیر بحرانی", tone: "danger" },
];

const documents = [
  { cat: "نقشه‌ها", name: "نقشه سازه Rev ۱۲", ver: "۱۲", updated: "۲ روز پیش" },
  { cat: "نقشه‌ها", name: "نقشه معماری Rev ۸", ver: "۸", updated: "۵ روز پیش" },
  { cat: "قراردادها", name: "قرارداد اصلی کارفرما", ver: "۳", updated: "۱ ماه پیش" },
  { cat: "RFI", name: "RFI-۰۴۲ اتصال تیر", ver: "۲", updated: "دیروز" },
  { cat: "Submittals", name: "تأیید فولاد A۳", ver: "۱", updated: "۳ روز پیش" },
  { cat: "Shop Drawings", name: "جزئیات اتصالات فلزی", ver: "۴", updated: "هفته پیش" },
  { cat: "گزارش روزانه", name: "گزارش کارگاه ۲۴ تیر", ver: "۱", updated: "امروز" },
  { cat: "صورت‌جلسه", name: "جلسه بازیابی پیمانکار", ver: "۱", updated: "دیروز" },
  { cat: "مجوزها", name: "پروانه کار در ارتفاع", ver: "۲", updated: "۱۰ روز پیش" },
  { cat: "فنی", name: "مشخصات فنی بتن", ver: "۵", updated: "۲ هفته پیش" },
];

const docCats = [
  "همه",
  "نقشه‌ها",
  "قراردادها",
  "RFI",
  "Submittals",
  "Shop Drawings",
  "گزارش روزانه",
  "صورت‌جلسه",
  "مجوزها",
  "فنی",
];

export function ProjectDossierPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const [tab, setTab] = useState<ProjectTab>("overview");
  const [docCat, setDocCat] = useState("همه");
  const [docQ, setDocQ] = useState("");

  const project =
    projects.find(
      (p) =>
        p.id === projectId ||
        (projectId === "aria" && p.name.includes("آریا"))
    ) ?? projects[0];

  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      const catOk = docCat === "همه" || d.cat === docCat;
      const qOk = !docQ.trim() || d.name.includes(docQ) || d.cat.includes(docQ);
      return catOk && qOk;
    });
  }, [docCat, docQ]);

  const tabs: { id: ProjectTab; label: string }[] = [
    { id: "overview", label: "نمای اجرایی" },
    { id: "vision", label: "هوش بصری پروژه" },
    { id: "documents", label: "مرکز اسناد" },
  ];

  return (
    <AppShell pageTitle={`پرونده · ${project.name}`}>
      <div className="px-5 py-8 md:px-10 max-w-[1100px] mx-auto pb-28">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.soft}
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[13px] text-text-tertiary hover:text-text-secondary cursor-pointer mb-6"
          >
            <ArrowLeft size={14} className="rotate-180" />
            بازگشت
          </button>
          <p className="text-[12px] text-text-tertiary">
            {session.asOfLabel} · پرونده تصمیم پروژه
          </p>
          <h1 className="mt-2 text-[32px] font-semibold text-text-primary">
            {project.name}
          </h1>
          <p className="mt-2 text-[15px] text-text-secondary">
            {project.client} · سلامت {toPersianDigits(project.health)} ·{" "}
            {project.riskLabel}
          </p>
        </motion.header>

        <div className="mt-6 mb-8 flex gap-1.5 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-[9px] border px-3.5 py-2 text-[13px] cursor-pointer",
                tab === t.id
                  ? "border-accent/40 text-accent bg-accent-soft"
                  : "border-etch text-text-tertiary hover:border-border-hover"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            <p className="max-w-2xl text-[15px] text-text-secondary leading-relaxed mb-6">
              این پرونده برای تصمیم است، نه گزارش‌دهی. چهار عددی که امروز باید
              ببینید:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ariaFacts.map((f) => (
                <div
                  key={f.title}
                  className="rounded-[14px] border border-etch bg-slab/80 px-5 py-4"
                >
                  <p className="text-[12px] text-text-tertiary">{f.title}</p>
                  <p className="mt-2 text-[22px] font-semibold text-primary tabular-nums">
                    {f.value}
                  </p>
                  <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
                    {f.detail}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setTab("vision")}
                className="rounded-[10px] bg-accent px-5 py-3 text-[14px] font-medium text-void cursor-pointer"
              >
                ورود به هوش بصری
              </button>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/chat?q=${encodeURIComponent("کدام پروژه بیشترین ریسک را دارد؟")}`
                  )
                }
                className="rounded-[10px] bg-primary px-5 py-3 text-[14px] font-medium text-text-inverse cursor-pointer"
              >
                جلسه اجرایی روی این پروژه
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-[10px] border border-etch px-5 py-3 text-[14px] text-text-secondary cursor-pointer"
              >
                بازگشت به دید مدیریتی
              </button>
            </div>
          </>
        )}

        {tab === "vision" && <VisionIntelligence />}

        {tab === "documents" && (
          <DocumentsCenter
            docs={filteredDocs}
            docCat={docCat}
            setDocCat={setDocCat}
            docQ={docQ}
            setDocQ={setDocQ}
          />
        )}
      </div>
    </AppShell>
  );
}

function VisionIntelligence() {
  return (
    <div className="space-y-8">
      <section className="rounded-[14px] border border-accent/30 bg-accent-soft/25 p-5">
        <div className="flex items-start gap-3">
          <Eye size={16} className="text-accent mt-0.5" />
          <div>
            <p className="text-[12px] text-accent mb-1">تحلیل هوش بصری</p>
            <p className="text-[14px] text-text-primary leading-relaxed">
              پیشرفت واقعی ۶۱٪ در برابر برنامه ۷۴٪ است. تأخیر ۱۳ روزه عمدتاً از
              جبهه سازه و کمبود فولاد ناشی می‌شود. اطمینان تخمین ۷۸٪.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            ["پیشرفت واقعی", "۶۱٪"],
            ["برنامه‌ای", "۷۴٪"],
            ["تأخیر", "۱۳ روز"],
            ["تکمیل پیش‌بینی", "آبان"],
          ].map(([l, v]) => (
            <div
              key={l}
              className="rounded-[10px] border border-etch bg-void/30 px-3 py-2.5"
            >
              <p className="text-[10px] text-text-tertiary">{l}</p>
              <p className="mt-1 text-[16px] font-semibold text-text-primary">
                {v}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="نقشه تعاملی کارگاه" icon={<Map size={14} />}>
          <div className="relative h-48 rounded-[10px] border border-etch bg-void/40 overflow-hidden">
            <svg viewBox="0 0 320 180" className="w-full h-full">
              <rect x="24" y="40" width="100" height="80" rx="8" fill="var(--slab)" stroke="var(--etch-strong)" />
              <rect x="140" y="28" width="70" height="60" rx="8" fill="color-mix(in oklab, var(--danger) 22%, transparent)" stroke="var(--danger)" />
              <rect x="230" y="70" width="65" height="65" rx="8" fill="color-mix(in oklab, var(--success) 18%, transparent)" stroke="var(--success)" />
              <circle cx="175" cy="140" r="10" fill="var(--accent)" opacity="0.75" />
              <text x="40" y="85" fill="var(--text-tertiary)" fontSize="10">بلوک A</text>
              <text x="152" y="60" fill="var(--danger)" fontSize="9">مسدود</text>
              <text x="242" y="105" fill="var(--success)" fontSize="9">فعال</text>
            </svg>
          </div>
        </Panel>

        <Panel title="دوقلوی دیجیتال پروژه" icon={<Box size={14} />}>
          <div className="h-48 flex items-center justify-center relative">
            <div className="absolute h-32 w-32 rounded-full border border-etch" />
            <div className="absolute h-20 w-20 rounded-full border border-dashed border-etch-strong" />
            <div className="relative z-10 h-12 w-12 rounded-full border border-primary bg-primary-soft flex items-center justify-center text-[11px] font-semibold text-primary">
              ۴۲
            </div>
          </div>
          <p className="text-[12px] text-text-tertiary text-center -mt-2">
            سلامت گره پروژه · ورود به داشبورد تخصصی از دید مدیریتی
          </p>
        </Panel>

        <Panel title="تحلیل تصویر / قبل و بعد" icon={<Camera size={14} />}>
          <div className="grid grid-cols-2 gap-2">
            {["قبل · هفته ۴", "بعد · امروز"].map((l, i) => (
              <div
                key={l}
                className="aspect-[4/3] rounded-[10px] border border-etch relative overflow-hidden"
                style={{
                  background: `linear-gradient(${100 + i * 40}deg, #1a1f28, #2c3644)`,
                }}
              >
                <span className="absolute bottom-2 right-2 text-[10px] text-text-tertiary">
                  {l}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="خط زمان بصری" icon={<Eye size={14} />}>
          <ExecutiveChart kind="timeline" seed={2} />
        </Panel>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-warning" />
          <h3 className="text-[15px] font-semibold text-text-primary">
            کشف خودکار مسائل
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {visionFindings.map((f) => (
            <div
              key={f.title}
              className={cn(
                "rounded-[12px] border px-4 py-3",
                f.tone === "danger"
                  ? "border-danger/30 bg-danger-soft/30"
                  : "border-warning/30 bg-warning-soft/30"
              )}
            >
              <p className="text-[13px] font-medium text-text-primary">
                {f.title}
              </p>
              <p className="mt-1 text-[12px] text-text-secondary">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <Panel title="گالری هوشمند و ویدئو" icon={<Camera size={14} />}>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["هوایی", "جبهه سازه", "انبار", "ایمنی", "قالب"].map((l, i) => (
            <div
              key={l}
              className="h-24 w-36 shrink-0 rounded-[10px] border border-etch relative"
              style={{
                background: `linear-gradient(${80 + i * 25}deg, #161a21, #283040)`,
              }}
            >
              <span className="absolute bottom-2 right-2 text-[10px] text-text-tertiary">
                {l}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function DocumentsCenter({
  docs,
  docCat,
  setDocCat,
  docQ,
  setDocQ,
}: {
  docs: typeof documents;
  docCat: string;
  setDocCat: (c: string) => void;
  docQ: string;
  setDocQ: (q: string) => void;
}) {
  return (
    <div>
      <p className="text-[14px] text-text-secondary mb-5 leading-relaxed max-w-2xl">
        مرکز اسناد حرفه‌ای پروژه — نسخه‌بندی، جستجوی معنایی و پیش‌نمایش برای
        تصمیم اجرایی.
      </p>

      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
        />
        <input
          value={docQ}
          onChange={(e) => setDocQ(e.target.value)}
          placeholder="جستجوی معنایی اسناد…"
          className="w-full rounded-[10px] border border-etch bg-slab/70 py-2.5 pr-9 pl-3 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-border-hover"
        />
      </div>

      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {docCats.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setDocCat(c)}
            className={cn(
              "shrink-0 rounded-[8px] border px-2.5 py-1.5 text-[11px] cursor-pointer",
              docCat === c
                ? "border-accent/40 text-accent bg-accent-soft"
                : "border-etch text-text-tertiary"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {docs.map((d) => (
          <button
            key={d.name}
            type="button"
            className="text-right rounded-[12px] border border-etch bg-slab/80 px-4 py-3.5 hover:border-border-hover cursor-pointer transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-etch bg-void/40 text-primary">
                <FileText size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-text-primary truncate">
                  {d.name}
                </p>
                <p className="mt-1 text-[11px] text-text-tertiary">
                  {d.cat} · نسخه {toPersianDigits(d.ver)} · {d.updated}
                </p>
              </div>
              <span className="text-[11px] text-accent shrink-0">پیش‌نمایش</span>
            </div>
          </button>
        ))}
      </div>

      {!docs.length && (
        <p className="mt-8 text-center text-[13px] text-text-tertiary">
          سندی با این فیلتر یافت نشد.
        </p>
      )}
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[14px] border border-etch bg-slab/70 p-4">
      <div className="flex items-center gap-2 mb-3 text-text-tertiary">
        {icon}
        <h3 className="text-[13px] font-medium text-text-secondary">{title}</h3>
      </div>
      {children}
    </section>
  );
}
