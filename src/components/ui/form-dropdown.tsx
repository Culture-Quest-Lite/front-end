"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";

export type FormDropdownOption = {
  value: string;
  label: string;
};

type FormDropdownProps = {
  id: string;
  value: string;
  options: FormDropdownOption[];
  placeholder: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  searchEmptyMessage?: string;
  triggerClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  onValueChange: (value: string) => void;
};

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function FormDropdown({
  id,
  value,
  options,
  placeholder,
  disabled = false,
  searchable = false,
  searchPlaceholder = "Tìm kiếm...",
  emptyMessage = "Không có dữ liệu để chọn.",
  searchEmptyMessage = "Không tìm thấy kết quả phù hợp.",
  triggerClassName,
  menuClassName,
  optionClassName,
  onValueChange,
}: FormDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const isMenuOpen = !disabled && isOpen;

  const selectedOption =
    options.find((option) => option.value === value) ?? null;
  const normalizedSearchTerm = normalizeSearchValue(searchTerm);
  const filteredOptions = useMemo(() => {
    if (!searchable || !normalizedSearchTerm) {
      return options;
    }

    return options.filter((option) => {
      const normalizedLabel = normalizeSearchValue(option.label);
      const normalizedValue = normalizeSearchValue(option.value);

      return (
        normalizedLabel.includes(normalizedSearchTerm) ||
        normalizedValue.includes(normalizedSearchTerm)
      );
    });
  }, [normalizedSearchTerm, options, searchable]);

  function closeMenu() {
    setIsOpen(false);
    setSearchTerm("");
  }

  function handleToggleMenu() {
    setIsOpen((current) => {
      const nextIsOpen = !current;

      if (!nextIsOpen) {
        setSearchTerm("");
      }

      return nextIsOpen;
    });
  }

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen || !searchable) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isMenuOpen, searchable]);

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isMenuOpen}
        disabled={disabled}
        onClick={handleToggleMenu}
        className={cn(
          triggerClassName,
          "appearance-none flex w-full items-center justify-between gap-3 text-left outline-none transition-colors focus:border-[#F7DCE8] focus:ring-3 focus:ring-[#FCE7F1] focus-visible:border-[#F7DCE8] focus-visible:ring-3 focus-visible:ring-[#FCE7F1]",
          isMenuOpen && "border-[#F7DCE8] ring-3 ring-[#FCE7F1]",
        )}
      >
        <span
          className={cn(
            "min-w-0 truncate",
            selectedOption ? "text-inherit" : "text-slate-400",
          )}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition",
            isMenuOpen && "rotate-180",
          )}
        />
      </button>

      {isMenuOpen ? (
        <div
          role="listbox"
          aria-labelledby={id}
          className={cn(
            "absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_36px_rgba(15,23,42,0.14)]",
            menuClassName,
          )}
        >
          {searchable ? (
            <div className="mb-1.5 border-b border-slate-100 px-1 pb-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.stopPropagation();
                      closeMenu();
                    }
                  }}
                  placeholder={searchPlaceholder}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#F7DCE8] focus:ring-3 focus:ring-[#FCE7F1]"
                />
              </div>
            </div>
          ) : null}

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setSearchTerm("");
                    onValueChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-[13px] text-slate-700 transition hover:bg-[#FFF1F5] hover:text-slate-900",
                    isSelected && "bg-[#FFF1F5] text-slate-900",
                    optionClassName,
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected ? (
                    <Check className="h-4 w-4 shrink-0 text-[#CF3F34]" />
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-[13px] text-slate-500">
              {searchable && normalizedSearchTerm
                ? searchEmptyMessage
                : emptyMessage}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
