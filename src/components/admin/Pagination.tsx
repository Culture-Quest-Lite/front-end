"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <p className="text-xs text-slate-500">
        Hiển thị {start}–{end} / {totalItems} mục
      </p>
      <div className="inline-flex items-end gap-1 sm:gap-2">
        <button
          type="button"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-white hover:text-[#D94A8D] hover:shadow-[0_6px_16px_rgba(15,23,42,0.06)] disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        {pages.map((p, i) => {
          const prev = pages[i - 1];
          const showEllipsis = prev !== undefined && p - prev > 1;
          return (
            <span key={p} className="flex items-end gap-1">
              {showEllipsis ? <span className="px-1 pb-2 text-sm text-slate-300">…</span> : null}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                className={`relative inline-flex h-9 min-w-9 items-center justify-center px-3 pb-2 text-sm font-medium transition ${
                  p === page
                    ? "font-semibold text-[#D94A8D] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-6 after:-translate-x-1/2 after:rounded-full after:bg-[#D94A8D]"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {p}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          aria-label="Trang sau"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-white hover:text-[#D94A8D] hover:shadow-[0_6px_16px_rgba(15,23,42,0.06)] disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
