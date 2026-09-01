"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CuratorPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const PAGES_PER_GROUP = 6;

export function CuratorPagination({
  currentPage,
  totalPages,
  onPageChange,
}: CuratorPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const currentGroup = Math.floor((safeCurrentPage - 1) / PAGES_PER_GROUP);
  const firstPageInGroup = currentGroup * PAGES_PER_GROUP + 1;
  const lastPageInGroup = Math.min(
    firstPageInGroup + PAGES_PER_GROUP - 1,
    safeTotalPages,
  );
  const pageNumbers = Array.from(
    { length: lastPageInGroup - firstPageInGroup + 1 },
    (_, index) => firstPageInGroup + index,
  );
  const hasPreviousPages = firstPageInGroup > 1;
  const hasNextPages = lastPageInGroup < safeTotalPages;

  return (
    <div className="inline-flex items-end justify-center gap-1 sm:gap-2">
      <button
        type="button"
        aria-label="Trang trước"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:text-[rgb(var(--primary))] disabled:pointer-events-none disabled:opacity-40"
        onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
        disabled={safeCurrentPage === 1}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {hasPreviousPages ? (
        <span
          aria-hidden="true"
          className="inline-flex h-9 min-w-[1.5rem] items-center justify-center pb-2 text-lg text-slate-400"
        >
          ...
        </span>
      ) : null}

      {pageNumbers.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onPageChange(pageNumber)}
          className={cn(
            "relative inline-flex h-9 min-w-[2.25rem] items-center justify-center px-3 pb-2 text-lg font-medium transition",
            safeCurrentPage === pageNumber
              ? "font-semibold text-[rgb(var(--primary))] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-6 after:-translate-x-1/2 after:rounded-full after:bg-[rgb(var(--primary))]"
              : "text-slate-400 hover:text-slate-700",
          )}
        >
          {pageNumber}
        </button>
      ))}

      {hasNextPages ? (
        <span
          aria-hidden="true"
          className="inline-flex h-9 min-w-[1.5rem] items-center justify-center pb-2 text-lg text-slate-400"
        >
          ...
        </span>
      ) : null}

      <button
        type="button"
        aria-label="Trang sau"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:text-[rgb(var(--primary))] disabled:pointer-events-none disabled:opacity-40"
        onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
        disabled={safeCurrentPage === safeTotalPages}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
