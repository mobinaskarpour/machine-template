"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Video,
  FileText,
  Map,
  Sparkles,
  Calendar,
  AlertTriangle,
  Eye,
  Play,
  Search,
  X,
  Layers,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { pageLabels } from "@/config/labels";
import { InteractiveProjectMap } from "@/components/evidence/InteractiveProjectMap";
import {
  aiInsights,
  beforeAfterPairs,
  docCategories,
  docStatusLabel,
  evidenceDocuments,
  evidenceImages,
  evidenceKpis,
  evidenceTimeline,
  evidenceVideos,
  imageCategories,
  type EvidenceDocument,
  type EvidenceImage,
  type EvidenceVideo,
} from "@/mock/evidence-hub";
import { mapZones } from "@/mock/project-map";
import { spring, stagger } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

export function EvidenceHubPage() {
  const reduced = useReducedMotion();
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [imgCat, setImgCat] = useState<string>("همه");
  const [docCat, setDocCat] = useState("همه");
  const [docQ, setDocQ] = useState("");
  const [timelineId, setTimelineId] = useState(evidenceTimeline[3].id);
  const [lightbox, setLightbox] = useState<EvidenceImage | null>(null);
  const [previewDoc, setPreviewDoc] = useState<EvidenceDocument | null>(null);

  const activeMapZone = mapZones.find((z) => z.id === zoneId) ?? null;

  const filteredImages = useMemo(() => {
    let list = evidenceImages;
    if (activeMapZone) {
      list = list.filter((i) => activeMapZone.imageIds.includes(i.id));
    }
    if (imgCat !== "همه") list = list.filter((i) => i.category === imgCat);
    return list;
  }, [activeMapZone, imgCat]);

  const filteredVideos = useMemo(() => {
    if (!activeMapZone) return evidenceVideos;
    return evidenceVideos.filter((v) => activeMapZone.videoIds.includes(v.id));
  }, [activeMapZone]);

  const filteredDocs = useMemo(() => {
    return evidenceDocuments.filter((d) => {
      const catOk = docCat === "همه" || d.category === docCat;
      const qOk =
        !docQ.trim() ||
        d.fileName.toLowerCase().includes(docQ.toLowerCase()) ||
        d.category.includes(docQ);
      const zoneOk =
        !activeMapZone || activeMapZone.docIds.includes(d.id);
      return catOk && qOk && zoneOk;
    });
  }, [docCat, docQ, activeMapZone]);

  const timeline = evidenceTimeline.find((t) => t.id === timelineId)!;

  return (
    <AppShell pageTitle={pageLabels.evidence}>
      <div className="px-5 py-7 md:px-10 max-w-[1240px] mx-auto pb-28">
        <motion.header
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.soft}
          className="mb-8"
        >
          <p className="text-[12px] text-accent">شواهد زنده پروژه · برج آریا</p>
          <h1 className="mt-1.5 text-[clamp(26px,3.6vw,36px)] font-semibold text-text-primary tracking-tight">
            مرکز مستندات و پایش تصویری پروژه
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] text-text-secondary leading-relaxed">
            تمام تصاویر، ویدئوها، اسناد، نقشه‌ها و تحلیل‌های هوش مصنوعی در یک مرکز
            واحد — برای تصمیم مدیرعامل، نه فقط بایگانی فایل.
          </p>
        </motion.header>

        <KpiStrip />

        <Section
          title="نقشه تعاملی پروژه"
          subtitle="دوقلوی دیجیتال ۲.۵بُعدی سایت — وضعیت هر بخش در یک نگاه"
          icon={<Map size={15} />}
        >
          <InteractiveProjectMap onZoneFilter={setZoneId} />
          {zoneId && activeMapZone && (
            <p className="mt-3 text-[12px] text-accent">
              فیلتر فعال: {activeMapZone.name} — گالری و اسناد زیر هم‌تراز شده‌اند.
              <button
                type="button"
                onClick={() => setZoneId(null)}
                className="mr-2 underline cursor-pointer"
              >
                پاک کردن
              </button>
            </p>
          )}
        </Section>

        <Section
          title="تحلیل هوش مصنوعی"
          subtitle="برآورد پیشرفت، اختلاف برنامه، ریسک و کیفیت از شواهد تصویری"
          icon={<Sparkles size={15} />}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {aiInsights.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i, ...spring.gentle }}
                className={cn(
                  "rounded-[14px] border px-4 py-3.5",
                  a.tone === "danger" && "border-danger/30 bg-danger-soft/25",
                  a.tone === "warn" && "border-warning/30 bg-warning-soft/25",
                  a.tone === "ok" && "border-success/30 bg-success-soft/25",
                  a.tone === "info" && "border-accent/25 bg-accent-soft/30"
                )}
              >
                <p className="text-[11px] text-text-tertiary">{a.title}</p>
                <p className="mt-1.5 text-[20px] font-semibold tabular-nums text-text-primary">
                  {a.value}
                </p>
                <p className="mt-1.5 text-[12px] text-text-secondary leading-snug">
                  {a.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section
          title="تصاویر پروژه"
          subtitle="گالری شواهد با تحلیل هوش مصنوعی روی هر فریم"
          icon={<Camera size={15} />}
        >
          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {["همه", ...imageCategories].map((c) => (
              <Chip
                key={c}
                active={imgCat === c}
                onClick={() => setImgCat(c)}
                label={c}
              />
            ))}
          </div>
          <motion.div
            variants={stagger.container}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {filteredImages.map((img) => (
              <ImageCard
                key={img.id}
                image={img}
                onOpen={() => setLightbox(img)}
              />
            ))}
          </motion.div>
          {!filteredImages.length && (
            <Empty hint="تصویری برای این فیلتر نیست." />
          )}
        </Section>

        <Section
          title="ویدئوهای پروژه"
          subtitle="پهپاد، موبایل و CCTV با تحلیل کنار هر کلیپ"
          icon={<Video size={15} />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredVideos.map((vid) => (
              <VideoCard key={vid.id} video={vid} />
            ))}
          </div>
        </Section>

        <Section
          title="مرکز اسناد"
          subtitle="نسخه‌بندی، وضعیت تأیید و پیش‌نمایش — نام فایل‌های واقعی پروژه"
          icon={<FileText size={15} />}
        >
          <div className="relative mb-3">
            <Search
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
            />
            <input
              value={docQ}
              onChange={(e) => setDocQ(e.target.value)}
              placeholder="جستجوی نام فایل یا دسته…"
              className="w-full rounded-[10px] border border-etch bg-slab/70 py-2.5 pr-9 pl-3 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-border-hover"
            />
          </div>
          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {docCategories.map((c) => (
              <Chip
                key={c}
                active={docCat === c}
                onClick={() => setDocCat(c)}
                label={c}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredDocs.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                onPreview={() => setPreviewDoc(doc)}
              />
            ))}
          </div>
          {!filteredDocs.length && <Empty hint="سندی یافت نشد." />}
        </Section>

        <Section
          title="خط زمان تصویری"
          subtitle="تاریخ را انتخاب کنید و روند پیشرفت را ببینید"
          icon={<Calendar size={15} />}
        >
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
            {evidenceTimeline.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimelineId(t.id)}
                className={cn(
                  "shrink-0 rounded-[12px] border px-4 py-3 text-right min-w-[140px] cursor-pointer transition-colors",
                  timelineId === t.id
                    ? "border-primary/45 bg-primary-soft"
                    : "border-etch bg-slab/60 hover:border-border-hover"
                )}
              >
                <p className="text-[13px] font-semibold text-text-primary">
                  {t.label}
                </p>
                <p className="mt-1 text-[11px] text-text-tertiary">{t.date}</p>
                <p className="mt-2 text-[15px] tabular-nums text-accent">
                  {toPersianDigits(t.progress)}٪
                </p>
              </button>
            ))}
          </div>
          <div className="rounded-[14px] border border-etch bg-slab/70 p-4">
            <p className="text-[14px] text-text-secondary mb-3">{timeline.note}</p>
            <div className="flex gap-2 overflow-x-auto">
              {timeline.imageIds.map((id) => {
                const img = evidenceImages.find((i) => i.id === id);
                if (!img) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setLightbox(img)}
                    className="relative h-28 w-40 shrink-0 rounded-[10px] overflow-hidden border border-etch cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt={img.location}
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        <Section
          title="قبل و بعد"
          subtitle="مقایسه بصری بخش‌های کلیدی در دو نقطه زمانی"
          icon={<Layers size={15} />}
        >
          <div className="space-y-4">
            {beforeAfterPairs.map((pair) => (
              <motion.div
                key={pair.id}
                whileHover={{ y: -2 }}
                transition={spring.gentle}
                className="rounded-[16px] border border-etch bg-slab/80 p-4 md:p-5"
              >
                <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
                  <div>
                    <p className="text-[15px] font-semibold text-text-primary">
                      {pair.title}
                    </p>
                    <p className="text-[12px] text-text-tertiary">
                      {pair.location}
                    </p>
                  </div>
                  <span className="text-[12px] text-accent">{pair.delta}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <BAFrame src={pair.before} label={pair.beforeLabel} tag="قبل" />
                  <BAFrame src={pair.after} label={pair.afterLabel} tag="بعد" />
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      </div>

      <AnimatePresence>
        {lightbox && (
          <Lightbox image={lightbox} onClose={() => setLightbox(null)} />
        )}
        {previewDoc && (
          <DocPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function KpiStrip() {
  const items = [
    { label: "تصاویر", value: toPersianDigits(evidenceKpis.images), icon: Camera },
    { label: "ویدئوها", value: toPersianDigits(evidenceKpis.videos), icon: Video },
    {
      label: "اسناد",
      value: toPersianDigits(evidenceKpis.documents),
      icon: FileText,
    },
    {
      label: "نقشه‌ها",
      value: toPersianDigits(evidenceKpis.drawings),
      icon: Map,
    },
    {
      label: "آخرین بازدید",
      value: evidenceKpis.lastSiteVisit,
      icon: Eye,
    },
    {
      label: "پوشش تصویری",
      value: `${toPersianDigits(evidenceKpis.visualCoverage)}٪`,
      icon: Camera,
    },
    {
      label: "آخرین تحلیل AI",
      value: evidenceKpis.lastAiAnalysis,
      icon: Sparkles,
    },
    {
      label: "ایرادات شناسایی‌شده",
      value: toPersianDigits(evidenceKpis.issuesFound),
      icon: AlertTriangle,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.soft}
      className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-2.5"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="rounded-[14px] border border-etch bg-gradient-to-br from-slab/90 to-void/40 px-3.5 py-3.5 backdrop-blur-sm"
          >
            <div className="flex items-center gap-1.5 text-text-tertiary mb-2">
              <Icon size={12} strokeWidth={1.6} />
              <span className="text-[10px]">{item.label}</span>
            </div>
            <p className="text-[15px] md:text-[16px] font-semibold text-text-primary leading-snug tabular-nums">
              {item.value}
            </p>
          </div>
        );
      })}
    </motion.section>
  );
}

function ImageCard({
  image,
  onOpen,
}: {
  image: EvidenceImage;
  onOpen: () => void;
}) {
  return (
    <motion.button
      type="button"
      variants={stagger.item}
      onClick={onOpen}
      whileHover={{ y: -3 }}
      transition={spring.gentle}
      className="group text-right rounded-[14px] border border-etch bg-slab/80 overflow-hidden cursor-pointer hover:border-border-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.location}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute top-2 right-2 rounded-[6px] bg-void/75 backdrop-blur px-2 py-0.5 text-[10px] text-text-primary">
          {image.category}
        </span>
      </div>
      <div className="p-3.5">
        <div className="flex justify-between gap-2 text-[11px] text-text-tertiary">
          <span>{image.location}</span>
          <span>{image.date}</span>
        </div>
        <p className="mt-2 text-[13px] font-medium text-text-primary">
          پیشرفت {toPersianDigits(image.progress)}٪
        </p>
        <p className="mt-1.5 text-[11px] text-accent leading-snug line-clamp-2">
          {image.aiAnalysis}
        </p>
      </div>
    </motion.button>
  );
}

function VideoCard({ video }: { video: EvidenceVideo }) {
  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={spring.gentle}
      className="rounded-[14px] border border-etch bg-slab/80 overflow-hidden flex flex-col sm:flex-row"
    >
      <div className="relative sm:w-[42%] aspect-video sm:aspect-auto shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumb}
          alt={video.title}
          className="h-full w-full object-cover min-h-[140px]"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-void/25">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-etch-strong bg-slab/90 text-primary">
            <Play size={16} fill="currentColor" />
          </span>
        </div>
        <span className="absolute bottom-2 left-2 rounded-[5px] bg-void/80 px-1.5 py-0.5 text-[10px] tabular-nums text-text-primary">
          {video.duration}
        </span>
        <span className="absolute top-2 right-2 rounded-[5px] border border-etch bg-void/70 px-1.5 py-0.5 text-[9px] text-accent">
          {video.source}
        </span>
      </div>
      <div className="p-4 flex-1">
        <h3 className="text-[14px] font-semibold text-text-primary">
          {video.title}
        </h3>
        <p className="mt-1.5 text-[11px] text-text-tertiary">
          {video.location} · {video.date} · ثبت {video.source}
        </p>
        <div className="mt-3 rounded-[10px] border border-accent/25 bg-accent-soft/30 px-3 py-2.5">
          <p className="text-[10px] text-accent mb-1">تحلیل AI</p>
          <p className="text-[12px] text-text-secondary leading-relaxed">
            {video.aiAnalysis}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function DocCard({
  doc,
  onPreview,
}: {
  doc: EvidenceDocument;
  onPreview: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPreview}
      className="w-full text-right rounded-[12px] border border-etch bg-slab/80 px-4 py-3.5 hover:border-border-hover cursor-pointer transition-colors"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-primary/25 bg-primary-soft text-primary">
          <FileText size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-text-primary truncate font-mono tracking-tight">
            {doc.fileName}
          </p>
          <p className="mt-1 text-[11px] text-text-tertiary">
            {doc.category} · نسخه {toPersianDigits(doc.version)} · {doc.size}
          </p>
          <p className="mt-1 text-[11px] text-text-secondary">
            {doc.author} · ویرایش {doc.lastEdit} · {doc.date}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              className={cn(
                "rounded-[6px] border px-2 py-0.5 text-[10px]",
                doc.status === "approved" &&
                  "border-success/30 text-success bg-success-soft/40",
                doc.status === "review" &&
                  "border-warning/30 text-warning bg-warning-soft/40",
                doc.status === "draft" &&
                  "border-etch text-text-tertiary",
                doc.status === "rejected" &&
                  "border-danger/30 text-danger bg-danger-soft/40"
              )}
            >
              {docStatusLabel[doc.status]}
            </span>
            <span className="text-[11px] text-accent">پیش‌نمایش</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function BAFrame({
  src,
  label,
  tag,
}: {
  src: string;
  label: string;
  tag: string;
}) {
  return (
    <div className="relative aspect-[16/10] rounded-[12px] overflow-hidden border border-etch">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} className="h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/90 to-transparent p-3 pt-8">
        <span className="text-[10px] text-accent">{tag}</span>
        <p className="text-[12px] text-text-primary">{label}</p>
      </div>
    </div>
  );
}

function Lightbox({
  image,
  onClose,
}: {
  image: EvidenceImage;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-overlay cursor-pointer"
        aria-label="بستن"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={spring.panel}
        className="relative w-full max-w-3xl rounded-[16px] border border-etch-strong bg-deck overflow-hidden shadow-[var(--shadow-md)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 left-3 z-10 rounded-full border border-etch bg-void/70 p-1.5 text-text-secondary cursor-pointer"
        >
          <X size={14} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.location}
          className="w-full max-h-[55vh] object-cover"
        />
        <div className="p-5">
          <p className="text-[15px] font-semibold text-text-primary">
            {image.location} · {image.category}
          </p>
          <p className="mt-1 text-[12px] text-text-tertiary">
            {image.date} · پیشرفت {toPersianDigits(image.progress)}٪
          </p>
          <p className="mt-3 text-[13px] text-accent leading-relaxed">
            {image.aiAnalysis}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DocPreview({
  doc,
  onClose,
}: {
  doc: EvidenceDocument;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-overlay cursor-pointer"
        aria-label="بستن"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={spring.panel}
        className="relative w-full max-w-lg rounded-[16px] border border-etch-strong bg-deck p-5 shadow-[var(--shadow-md)]"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] text-text-tertiary">{doc.category}</p>
            <h3 className="mt-1 text-[15px] font-semibold text-text-primary font-mono break-all">
              {doc.fileName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
        <div className="rounded-[12px] border border-etch bg-void/40 aspect-[3/4] max-h-[320px] flex flex-col items-center justify-center gap-3 p-6">
          <FileText size={36} className="text-primary opacity-80" />
          <p className="text-[13px] text-text-secondary text-center">
            {doc.previewHint}
          </p>
          <p className="text-[11px] text-text-tertiary">
            پیش‌نمایش سند · {doc.size}
          </p>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
          <div>
            <dt className="text-text-tertiary">نسخه</dt>
            <dd className="text-text-secondary">
              {toPersianDigits(doc.version)}
            </dd>
          </div>
          <div>
            <dt className="text-text-tertiary">وضعیت</dt>
            <dd className="text-text-secondary">{docStatusLabel[doc.status]}</dd>
          </div>
          <div>
            <dt className="text-text-tertiary">تهیه‌کننده</dt>
            <dd className="text-text-secondary">{doc.author}</dd>
          </div>
          <div>
            <dt className="text-text-tertiary">آخرین ویرایش</dt>
            <dd className="text-text-secondary">{doc.lastEdit}</dd>
          </div>
        </dl>
      </motion.div>
    </motion.div>
  );
}

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-[9px] border border-etch bg-slab text-primary">
          {icon}
        </span>
        <div>
          <h2 className="text-[18px] font-semibold text-text-primary">{title}</h2>
          <p className="mt-0.5 text-[12px] text-text-tertiary">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-[8px] border px-2.5 py-1.5 text-[11px] cursor-pointer",
        active
          ? "border-accent/40 text-accent bg-accent-soft"
          : "border-etch text-text-tertiary hover:border-border-hover"
      )}
    >
      {label}
    </button>
  );
}

function Empty({ hint }: { hint: string }) {
  return (
    <p className="py-10 text-center text-[13px] text-text-tertiary">{hint}</p>
  );
}
