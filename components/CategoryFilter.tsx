"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES } from "@/types/report";
import type { Category } from "@/types/report";

interface Props {
  readonly value: Category | null;
  readonly onChange: (v: Category | null) => void;
}

const PRIMARY_CATEGORIES: readonly Category[] = [
  "사고/위험",
  "보행 불편",
  "시설 고장",
];

const FILTER_OPTIONS: readonly { readonly label: string; readonly value: Category | null }[] = [
  { label: "전체", value: null },
  ...CATEGORIES.map((category) => ({ label: category, value: category })),
];

export default function CategoryFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selectedSecondary = CATEGORIES.find(
    (category) => category === value && !PRIMARY_CATEGORIES.includes(category)
  );

  function selectCategory(nextValue: Category | null) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <>
      <div className="flex items-center gap-2 pb-1">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
          <Chip active={value === null} onClick={() => onChange(null)}>
            전체
          </Chip>
          {PRIMARY_CATEGORIES.map((category) => (
            <Chip
              key={category}
              active={value === category}
              onClick={() => onChange(category)}
            >
              {category}
            </Chip>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            selectedSecondary
              ? "bg-primary text-white"
              : "bg-surface text-ink-muted hover:text-ink"
          }`}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <SlidersHorizontal size={15} />
          {selectedSecondary ?? "필터"}
        </button>
      </div>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-ink/30" role="presentation">
            <button
              type="button"
              className="absolute inset-0 h-full w-full"
              aria-label="필터 닫기"
              onClick={() => setOpen(false)}
            />
            <section
              role="dialog"
              aria-modal="true"
              aria-label="카테고리 필터"
              className="absolute inset-x-0 bottom-0 rounded-t-lg bg-white px-4 pb-6 pt-3 shadow-float"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink">카테고리</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="필터 닫기"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => selectCategory(option.value)}
                    className={`h-11 rounded-md px-3 text-left text-sm font-medium transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      value === option.value
                        ? "bg-primary text-white"
                        : "bg-surface text-ink"
                    }`}
                    aria-pressed={value === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>
          </div>,
          document.body
        )}
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 shrink-0 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active ? "bg-primary text-white" : "bg-surface text-ink-muted hover:text-ink"
      }`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
