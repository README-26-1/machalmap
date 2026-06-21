"use client";

import { CATEGORIES, Category } from "@/types/report";

interface Props {
  value: Category | null;
  onChange: (v: Category | null) => void;
}

export default function CategoryFilter({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Chip active={value === null} onClick={() => onChange(null)}>
        전체
      </Chip>
      {CATEGORIES.map((c) => (
        <Chip key={c} active={value === c} onClick={() => onChange(c)}>
          {c}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? "bg-primary text-white" : "bg-surface text-ink-muted"
      }`}
    >
      {children}
    </button>
  );
}
