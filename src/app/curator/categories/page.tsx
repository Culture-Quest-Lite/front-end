"use client";

import { useDeferredValue, useRef, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CategoryItem = {
  id: string;
  name: string;
  usageCount: number;
  initial: string;
  color: string;
};

const initialCategories: CategoryItem[] = [
  {
    id: "di-tich-lich-su",
    name: "Di tích lịch sử",
    usageCount: 18,
    initial: "D",
    color: "#D4550D",
  },
  {
    id: "kien-truc-ton-giao",
    name: "Kiến trúc tôn giáo",
    usageCount: 11,
    initial: "K",
    color: "#7C3AED",
  },
  {
    id: "bao-tang",
    name: "Bảo tàng",
    usageCount: 7,
    initial: "B",
    color: "#0EA5E9",
  },
  {
    id: "di-san-van-hoa",
    name: "Di sản văn hoá",
    usageCount: 14,
    initial: "D",
    color: "#0F9D74",
  },
  {
    id: "khong-gian-cong-cong",
    name: "Không gian công cộng",
    usageCount: 9,
    initial: "K",
    color: "#F59E0B",
  },
];

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildCategoryId(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCategoryInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "M";
}

export default function CuratorCategoriesPage() {
  const [categories, setCategories] = useState(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState("#C2410C");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);
  const createSectionRef = useRef<HTMLDivElement>(null);
  const deferredSearch = useDeferredValue(searchQuery);

  const normalizedQuery = normalizeText(deferredSearch);
  const filteredCategories = categories.filter((category) => {
    if (!normalizedQuery) {
      return true;
    }

    return normalizeText(category.name).includes(normalizedQuery);
  });
  const isEditing = editingCategoryId !== null;

  function handleCreateFocus() {
    createSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
    draftInputRef.current?.focus();
  }

  function resetForm() {
    setDraftName("");
    setDraftColor("#C2410C");
    setEditingCategoryId(null);
    setFormError(null);
  }

  function handleSubmitCategory() {
    const trimmedName = draftName.trim();

    if (!trimmedName) {
      setFormError("Tên danh mục không được để trống.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        category.id !== editingCategoryId &&
        normalizeText(category.name) === normalizeText(trimmedName),
    );

    if (duplicate) {
      setFormError("Tên phải duy nhất trong hệ thống.");
      return;
    }

    setFormError(null);

    if (editingCategoryId) {
      setCategories((current) =>
        current.map((category) =>
          category.id === editingCategoryId
            ? {
                ...category,
                name: trimmedName,
                color: draftColor,
                initial: getCategoryInitial(trimmedName),
              }
            : category,
        ),
      );
      resetForm();
      return;
    }

    const nextIdBase =
      buildCategoryId(trimmedName) || `danh-muc-${categories.length + 1}`;
    let nextId = nextIdBase;
    let suffix = 2;

    while (categories.some((category) => category.id === nextId)) {
      nextId = `${nextIdBase}-${suffix}`;
      suffix += 1;
    }

    setCategories((current) => [
      ...current,
      {
        id: nextId,
        name: trimmedName,
        usageCount: 0,
        initial: getCategoryInitial(trimmedName),
        color: draftColor,
      },
    ]);
    resetForm();
  }

  function handleEditCategory(category: CategoryItem) {
    setEditingCategoryId(category.id);
    setDraftName(category.name);
    setDraftColor(category.color);
    setFormError(null);
    handleCreateFocus();
  }

  function handleDeleteCategory(categoryId: string) {
    setCategories((current) =>
      current.filter((category) => category.id !== categoryId),
    );

    if (editingCategoryId === categoryId) {
      resetForm();
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="cq-page-title">
              Danh mục
            </h1>
            <p className="cq-page-subtitle max-w-2xl">
              Quản lý phân loại nội dung di sản.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleCreateFocus}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#CF3F34] px-4 py-2 text-white shadow-sm hover:bg-[#BE372D]"
          >
            <Plus className="h-4 w-4" />
            Tạo mới
          </Button>
        </div>

        <section className="rounded-[1.75rem] border border-slate-200/80 bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="cq-section-title">
              Danh mục ({categories.length})
            </h2>

            <div className="relative w-full lg:max-w-[218px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm danh mục phù hợp"
                className="h-11 rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>
          </div>

          <div className="mt-5">
            {filteredCategories.map((category, index) => (
              <div
                key={category.id}
                className={cn(
                  "flex items-center gap-4 py-5",
                  index !== filteredCategories.length - 1 &&
                    "border-b border-[#E6DDD1]",
                )}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {category.initial}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="cq-card-title leading-tight">
                    {category.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    {category.usageCount} hotspot sử dụng
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditCategory(category)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={`Sửa ${category.name}`}
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#FF3B30] transition hover:bg-[#FFF1EF]"
                    aria-label={`Xóa ${category.name}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}

            {filteredCategories.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-card px-5 py-10 text-center">
                <p className="cq-card-title sm:text-base">
                  Không tìm thấy danh mục
                </p>
                <p className="cq-page-subtitle mt-2">
                  Thử đổi từ khóa hoặc tạo một danh mục mới.
                </p>
              </div>
            ) : null}
          </div>

          <div
            ref={createSectionRef}
            className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
          >
            <p className="text-sm font-medium text-slate-900">
              {isEditing ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
            </p>

            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
              <Input
                ref={draftInputRef}
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="Tên danh mục..."
                className="h-12 rounded-3xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/20"
              />

              <div className="flex items-center gap-3">
                <label className="relative inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div
                    className="absolute inset-[3px] rounded-[0.8rem]"
                    style={{ backgroundColor: draftColor }}
                  />
                  <input
                    type="color"
                    value={draftColor}
                    onChange={(event) =>
                      setDraftColor(event.target.value.toUpperCase())
                    }
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Chọn màu danh mục"
                  />
                </label>

                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleSubmitCategory}
                  className="rounded-full bg-[#CF3F34] px-4 text-sm text-white shadow-sm hover:bg-[#BE372D]"
                >
                  {isEditing ? "Lưu" : "Thêm"}
                </Button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-600 sm:text-sm">
                Tên phải duy nhất trong hệ thống.
              </p>

              {isEditing ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-medium text-slate-500 transition hover:text-slate-900 sm:text-sm"
                >
                  Hủy chỉnh sửa
                </button>
              ) : null}
            </div>

            {formError ? (
              <p className="mt-2 text-xs font-medium text-[#CF3F34] sm:text-sm">
                {formError}
              </p>
            ) : null}
          </div>
        </section>
      </section>
    </div>
  );
}
