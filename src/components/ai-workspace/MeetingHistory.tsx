"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { Conversation, HistoryCategory, ExecutiveRole } from "@/types/ai";
import {
  historyCategories,
  getCategoryLabel,
  roleLabels,
} from "@/mock/ai-workspace";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MeetingHistoryProps {
  conversations: Conversation[];
  activeId: string | null;
  activeCategory: HistoryCategory | "all";
  role: ExecutiveRole;
  onSelect: (id: string) => void;
  onNew: () => void;
  onCategory: (c: HistoryCategory | "all") => void;
  onRole: (r: ExecutiveRole) => void;
}

export function MeetingHistory({
  conversations,
  activeId,
  activeCategory,
  role,
  onSelect,
  onNew,
  onCategory,
  onRole,
}: MeetingHistoryProps) {
  const filtered =
    activeCategory === "all"
      ? conversations
      : conversations.filter((c) => c.category === activeCategory);

  return (
    <aside className="hidden md:flex flex-col w-[280px] shrink-0 border-l border-etch bg-deck/50">
      <div className="flex items-center justify-between p-4 border-b border-etch">
        <p className="text-[13px] font-medium text-text-tertiary">جلسات</p>
        <motion.button
          type="button"
          onClick={onNew}
          whileHover={{ y: -2, transition: spring.gentle }}
          className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-etch text-text-tertiary hover:border-border-hover cursor-pointer"
          aria-label="جلسه جدید"
        >
          <Plus size={14} strokeWidth={1.6} />
        </motion.button>
      </div>

      {/* Role context — changes quick questions */}
      <div className="px-3 py-2 border-b border-etch">
        <p className="px-1 mb-1.5 text-[10px] text-text-tertiary">نقش جلسه</p>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(roleLabels) as ExecutiveRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRole(r)}
              className={cn(
                "rounded-[6px] px-2 py-1 text-[11px] cursor-pointer transition-colors",
                role === r
                  ? "bg-primary/15 text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 p-3 border-b border-etch overflow-x-auto">
        <CatBtn
          active={activeCategory === "all"}
          onClick={() => onCategory("all")}
          label="همه"
        />
        {historyCategories.map((cat) => (
          <CatBtn
            key={cat.id}
            active={activeCategory === cat.id}
            onClick={() => onCategory(cat.id)}
            label={cat.label}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.map((conv) => (
          <motion.button
            key={conv.id}
            type="button"
            onClick={() => onSelect(conv.id)}
            whileHover={{ x: 2, transition: spring.gentle }}
            className={cn(
              "w-full rounded-[10px] p-3 text-right cursor-pointer border transition-colors duration-[120ms]",
              activeId === conv.id
                ? "bg-primary/8 border-border-hover"
                : "border-transparent hover:bg-hover"
            )}
          >
            <p className="text-[13px] font-medium text-text-primary truncate">
              {conv.title}
            </p>
            <p className="text-[11px] text-text-tertiary mt-0.5 truncate">
              {conv.preview || "جلسه خالی"}
            </p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-text-tertiary">
                {getCategoryLabel(conv.category)}
              </span>
              <span className="text-[10px] text-text-tertiary">
                {conv.updatedAt}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </aside>
  );
}

function CatBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-[6px] px-2 py-1 text-[11px] cursor-pointer transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-text-tertiary hover:text-text-secondary"
      )}
    >
      {label}
    </button>
  );
}
