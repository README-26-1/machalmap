"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Filter, X } from "lucide-react";
import { CATEGORIES } from "@/types/report";
import type { Category } from "@/types/report";

interface Props {
  readonly value: Category | null;
  readonly onChange: (v: Category | null) => void;
}

const FILTER_OPTIONS: readonly {
  readonly label: string;
  readonly value: Category | null;
}[] = [
  { label: "전체", value: null },
  ...CATEGORIES.map((category) => ({ label: category, value: category })),
];

// 우측 하단 플로팅 깔때기 버튼 + 카테고리 선택 바텀시트
export default function CategoryFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const active = value !== null;

  function selectCategory(nextValue: Category | null) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={active ? `필터: ${value}` : "카테고리 필터"}
        className="relative flex h-14 w-14 items-center justify-center rounded-full border border-line bg-white text-ink shadow-float transition hover:bg-surface active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Filter size={22} aria-hidden="true" />
        {active && (
          <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white" />
        )}
      </button>

      {open &&
        createPortal(
          // 모바일: 하단 드로어(딤 배경) / 데스크톱: 우측 하단 버튼 위 팝오버(배경 투명)
          <div
            className="fixed inset-0 z-50 bg-ink/30 md:bg-transparent"
            role="presentation"
          >
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
              className="absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-lg bg-white px-4 pb-6 pt-3 shadow-float md:inset-x-auto md:bottom-24 md:right-5 md:mx-0 md:w-72 md:max-w-none md:rounded-lg md:border md:border-line md:pb-4"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line md:hidden" />
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
