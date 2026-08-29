"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

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
  emptyMessage?: string;
  triggerClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  onValueChange: (value: string) => void;
};

export function FormDropdown({
  id,
  value,
  options,
  placeholder,
  disabled = false,
  emptyMessage = "Không có dữ liệu để chọn.",
  triggerClassName,
  menuClassName,
  optionClassName,
  onValueChange,
}: FormDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isMenuOpen = !disabled && isOpen;

  const selectedOption =
    options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isMenuOpen}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
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
          {options.length > 0 ? (
            options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
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
              {emptyMessage}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
