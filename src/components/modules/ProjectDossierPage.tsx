"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AppShell } from "@/components/shell/AppShell";
import { spring } from "@/lib/motion";
import { projects } from "@/mock/command-center";
import { useSessionStore } from "@/store/session-store";
import { toPersianDigits } from "@/lib/persian";
import { ArrowLeft } from "lucide-react";

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

export function ProjectDossierPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const project =
    projects.find(
      (p) =>
        p.id === projectId ||
        (projectId === "aria" && p.name.includes("آریا"))
    ) ?? projects[0];

  return (
    <AppShell pageTitle={`پرونده · ${project.name}`}>
      <div className="px-5 py-8 md:px-10 max-w-[900px] mx-auto pb-28">
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
            {session.asOfLabel} · منابع برنامه، مالی، قرارداد
          </p>
          <h1 className="mt-2 text-[32px] font-semibold text-text-primary">
            {project.name}
          </h1>
          <p className="mt-2 text-[15px] text-text-secondary">
            {project.client} · سلامت {toPersianDigits(project.health)} ·{" "}
            {project.riskLabel}
          </p>
          <p className="mt-4 max-w-2xl text-[15px] text-text-secondary leading-relaxed">
            این پرونده برای تصمیم است، نه گزارش‌دهی. چهار عددی که امروز باید
            ببینید:
          </p>
        </motion.header>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      </div>
    </AppShell>
  );
}
