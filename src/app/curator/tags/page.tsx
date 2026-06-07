"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { Eye, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TagItem = {
  id: string;
  name: string;
  usageCount: number;
  color: string;
};

const initialTags: TagItem[] = [
  {
    id: "lich-su",
    name: "Lịch sử",
    usageCount: 42,
    color: "#C84E14",
  },
  {
    id: "kien-truc",
    name: "Kiến trúc",
    usageCount: 31,
    color: "#7C3AED",
  },
  {
    id: "di-san",
    name: "Di sản",
    usageCount: 25,
    color: "#0F9D74",
  },
  {
    id: "chien-tranh",
    name: "Chiến tranh",
    usageCount: 12,
    color: "#A72222",
  },
  {
    id: "van-hoa",
    name: "Văn hóa",
    usageCount: 38,
    color: "#F59E0B",
  },
];

const tagColorPalette = ["#C84E14", "#7C3AED", "#0F9D74", "#A72222", "#F59E0B"];

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildTagId(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildChipLabel(name: string) {
  return `# ${name.trim().toLowerCase()}`;
}

function buildStatsLabel(name: string) {
  return `#${name.trim().toLowerCase().replace(/\s+/g, "")}`;
}

function withHexAlpha(color: string, alpha: string) {
  const normalized = color.trim().toUpperCase();

  if (/^#[0-9A-F]{6}$/.test(normalized)) {
    return `${normalized}${alpha}`;
  }

  return color;
}

function getTagColorState(color: string) {
  return {
    chipBg: withHexAlpha(color, "14"),
    chipBorder: withHexAlpha(color, "4D"),
  };
}

function getTagDetailHref(tagId: string) {
  return `/curator/tags/${tagId}`;
}

export default function CuratorTagsPage() {
  const [tags, setTags] = useState(initialTags);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuTagId, setOpenMenuTagId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formUsageCount, setFormUsageCount] = useState("0");
  const [formColor, setFormColor] = useState(tagColorPalette[0]);
  const [formError, setFormError] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(searchQuery);
  const normalizedQuery = normalizeText(deferredSearch);
  const filteredTags = tags.filter((tag) => {
    if (!normalizedQuery) {
      return true;
    }

    return normalizeText(tag.name).includes(normalizedQuery);
  });
  const maxTagCount = Math.max(...filteredTags.map((tag) => tag.usageCount), 1);
  const isEditing = editingTagId !== null;
  const pendingDeleteTag =
    pendingDeleteId === null
      ? null
      : (tags.find((tag) => tag.id === pendingDeleteId) ?? null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      if (!event.target.closest("[data-tag-actions]")) {
        setOpenMenuTagId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuTagId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function resetForm() {
    setFormName("");
    setFormUsageCount("0");
    setFormColor(tagColorPalette[tags.length % tagColorPalette.length]);
    setEditingTagId(null);
    setFormError(null);
  }

  function openCreateModal() {
    resetForm();
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    resetForm();
  }

  function handleEditTag(tag: TagItem) {
    setEditingTagId(tag.id);
    setFormName(tag.name);
    setFormUsageCount(String(tag.usageCount));
    setFormColor(tag.color);
    setFormError(null);
    setIsEditorOpen(true);
  }

  function handleSubmitTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = formName.trim();

    if (!trimmedName) {
      setFormError("Tên thẻ không được để trống.");
      return;
    }

    const usageCount = Number(formUsageCount);

    if (!Number.isInteger(usageCount) || usageCount < 0) {
      setFormError("Số lượt sử dụng phải là số nguyên từ 0 trở lên.");
      return;
    }

    const duplicate = tags.some(
      (tag) =>
        tag.id !== editingTagId &&
        normalizeText(tag.name) === normalizeText(trimmedName),
    );

    if (duplicate) {
      setFormError("Tên thẻ phải duy nhất trong hệ thống.");
      return;
    }

    const normalizedColor = formColor.toUpperCase();
    setFormError(null);

    if (editingTagId) {
      setTags((current) =>
        current.map((tag) =>
          tag.id === editingTagId
            ? {
                ...tag,
                name: trimmedName,
                usageCount,
                color: normalizedColor,
              }
            : tag,
        ),
      );
      closeEditor();
      return;
    }

    const nextIdBase = buildTagId(trimmedName) || `the-${tags.length + 1}`;
    let nextId = nextIdBase;
    let suffix = 2;

    while (tags.some((tag) => tag.id === nextId)) {
      nextId = `${nextIdBase}-${suffix}`;
      suffix += 1;
    }

    setTags((current) => [
      ...current,
      {
        id: nextId,
        name: trimmedName,
        usageCount,
        color: normalizedColor,
      },
    ]);
    closeEditor();
  }

  function handleDeleteRequest(tagId: string) {
    setOpenMenuTagId(null);
    setPendingDeleteId(tagId);
  }

  function handleConfirmDelete() {
    if (!pendingDeleteId) {
      return;
    }

    setTags((current) => current.filter((tag) => tag.id !== pendingDeleteId));

    if (editingTagId === pendingDeleteId) {
      closeEditor();
    }

    setPendingDeleteId(null);
  }

  return (
    <>
      <div className="space-y-6">
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h1 className="cq-page-title">Thẻ</h1>
              <p className="cq-page-subtitle max-w-2xl">
                Quản lý gắn thẻ nội dung di sản.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#CF3F34] px-4 py-2 text-white shadow-sm hover:bg-[#BE372D]"
            >
              <Plus className="h-4 w-4" />
              Tạo mới
            </Button>
          </div>

          <section className="rounded-[1.75rem] border border-slate-200/80 bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <h2 className="cq-section-title">
                Thẻ ({tags.length})
              </h2>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-[240px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Tìm thẻ phù hợp"
                    className="h-11 rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/20"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                  Thẻ mới
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <h3 className="cq-card-title">
                  Thẻ đang dùng
                </h3>

                <div className="mt-4 flex flex-wrap gap-3">
                  {filteredTags.map((tag) => {
                    const colorState = getTagColorState(tag.color);

                    return (
                      <Link
                        key={tag.id}
                        href={getTagDetailHref(tag.id)}
                        className="inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-xs font-medium transition hover:opacity-85 sm:text-sm"
                        style={{
                          color: tag.color,
                          backgroundColor: colorState.chipBg,
                          borderColor: colorState.chipBorder,
                        }}
                      >
                        <span>{buildChipLabel(tag.name)}</span>
                        <span className="text-sm opacity-75">
                          {tag.usageCount}
                        </span>
                      </Link>
                    );
                  })}

                  {filteredTags.length === 0 ? (
                    <p className="cq-page-subtitle">
                      Không có thẻ nào khớp với từ khóa hiện tại.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <h3 className="cq-card-title">
                  Thống kê sử dụng
                </h3>

                <div className="mt-4 space-y-4">
                  {filteredTags.map((tag) => (
                    <div
                      key={`${tag.id}-stats`}
                      className="grid grid-cols-[minmax(0,128px)_minmax(0,1fr)_40px] items-center gap-4"
                    >
                      <span className="text-xs text-slate-800 sm:text-sm">
                        {buildStatsLabel(tag.name)}
                      </span>

                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(tag.usageCount / maxTagCount) * 100}%`,
                            backgroundColor: tag.color,
                          }}
                        />
                      </div>

                      <span className="text-right text-xs text-slate-500 sm:text-sm">
                        {tag.usageCount}
                      </span>
                    </div>
                  ))}

                  {filteredTags.length === 0 ? (
                    <p className="cq-page-subtitle">
                      Chưa có dữ liệu để hiển thị thống kê.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="cq-card-title">
                    Quản lý thẻ
                  </h3>
                  <p className="cq-page-subtitle mt-1 text-xs sm:text-sm">
                    Tạo, chỉnh sửa và xóa thẻ trực tiếp trên cùng một trang.
                  </p>
                </div>

                <span className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600 shadow-sm sm:text-sm">
                  {filteredTags.length} kết quả
                </span>
              </div>

              <div className="mt-4">
                {filteredTags.map((tag, index) => {
                  const colorState = getTagColorState(tag.color);

                  return (
                    <div
                      key={`${tag.id}-row`}
                      className={cn(
                        "relative flex flex-col gap-4 py-4 lg:flex-row lg:items-center",
                        index !== filteredTags.length - 1 &&
                          "border-b border-[#E6DDD1]",
                        openMenuTagId === tag.id && "z-20",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            href={getTagDetailHref(tag.id)}
                            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:text-sm"
                            style={{
                              color: tag.color,
                              backgroundColor: colorState.chipBg,
                              borderColor: colorState.chipBorder,
                            }}
                          >
                            {buildChipLabel(tag.name)}
                          </Link>

                          <Link
                            href={getTagDetailHref(tag.id)}
                            className="cq-card-title transition hover:text-[#cf3d37]"
                          >
                            {tag.name}
                          </Link>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 sm:text-sm">
                          <span>{buildStatsLabel(tag.name)}</span>
                          <span>{tag.usageCount} hotspot sử dụng</span>
                        </div>
                      </div>

                      <div
                        className="relative self-end lg:self-auto"
                        data-tag-actions
                      >
                        <button
                          type="button"
                          aria-haspopup="menu"
                          aria-expanded={openMenuTagId === tag.id}
                          onClick={() =>
                            setOpenMenuTagId(
                              openMenuTagId === tag.id ? null : tag.id,
                            )
                          }
                          className={cn(
                            "inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-700",
                            openMenuTagId === tag.id && "bg-white",
                          )}
                          aria-label={`Tác vụ cho ${tag.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {openMenuTagId === tag.id ? (
                          <div
                            role="menu"
                            className="absolute right-0 top-[calc(100%+0.6rem)] w-40 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.4)]"
                          >
                            <Link
                              href={getTagDetailHref(tag.id)}
                              role="menuitem"
                              onClick={() => setOpenMenuTagId(null)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              <Eye className="h-4 w-4" />
                              <span>Xem</span>
                            </Link>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuTagId(null);
                                handleEditTag(tag);
                              }}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              <Pencil className="h-4 w-4" />
                              <span>Sửa</span>
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => handleDeleteRequest(tag.id)}
                              className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 pt-3 pb-2.5 text-left text-sm font-medium text-red-500 transition hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {filteredTags.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                    <p className="cq-card-title sm:text-base">
                      Không tìm thấy thẻ
                    </p>
                    <p className="cq-page-subtitle mt-2">
                      Thử đổi từ khóa hoặc tạo một thẻ mới.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </section>
      </div>

      {isEditorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 py-6 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={closeEditor}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <button
              type="button"
              onClick={closeEditor}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Đóng modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-2 pr-10">
              <h2 className="cq-modal-title">
                {isEditing ? "Chỉnh sửa thẻ" : "Tạo thẻ mới"}
              </h2>
              <p className="cq-page-subtitle">
                Điền thông tin cơ bản để tạo thẻ nội dung cho hotspot.
              </p>
            </div>

            <form onSubmit={handleSubmitTag} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Tên thẻ
                </label>
                <Input
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  placeholder="Ví dụ: Lịch sử kháng chiến"
                  className="h-12 rounded-3xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/20"
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">
                    Số lượt sử dụng
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={formUsageCount}
                    onChange={(event) => setFormUsageCount(event.target.value)}
                    className="h-12 rounded-3xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">
                    Màu chủ đạo
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div
                        className="absolute inset-[3px] rounded-[0.8rem]"
                        style={{ backgroundColor: formColor }}
                      />
                      <input
                        type="color"
                        value={formColor}
                        onChange={(event) =>
                          setFormColor(event.target.value.toUpperCase())
                        }
                        className="absolute inset-0 cursor-pointer opacity-0"
                        aria-label="Chọn màu thẻ"
                      />
                    </label>

                    <Input
                      value={formColor}
                      onChange={(event) =>
                        setFormColor(event.target.value.toUpperCase())
                      }
                      className="h-12 rounded-3xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">
                  Xem trước thẻ
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
                    style={{
                      color: formColor,
                      backgroundColor: getTagColorState(formColor).chipBg,
                      borderColor: getTagColorState(formColor).chipBorder,
                    }}
                  >
                    <span>{buildChipLabel(formName || "Thẻ mới")}</span>
                    <span className="opacity-75">
                      {Number(formUsageCount) >= 0 ? formUsageCount : "0"}
                    </span>
                  </div>

                  <span className="cq-page-subtitle">
                    {buildStatsLabel(formName || "Thẻ mới")}
                  </span>
                </div>
              </div>

              {formError ? (
                <p className="text-sm font-medium text-[#CF3F34]">
                  {formError}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={closeEditor}
                  className="rounded-full px-5 text-sm shadow-sm"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  className="rounded-full bg-[#CF3F34] px-5 text-sm text-white shadow-sm hover:bg-[#BE372D]"
                >
                  {isEditing ? "Lưu thay đổi" : "Tạo thẻ"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {pendingDeleteTag ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 py-6 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setPendingDeleteId(null)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <button
              type="button"
              onClick={() => setPendingDeleteId(null)}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Đóng xác nhận xóa"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-2 pr-10">
              <h2 className="cq-modal-title">Xóa thẻ</h2>
              <p className="cq-page-subtitle">
                Thẻ{" "}
                <span className="font-semibold text-slate-900">
                  {pendingDeleteTag.name}
                </span>{" "}
                sẽ bị xóa khỏi danh sách hiện tại.
              </p>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-[#F3D1CD] bg-[#FFF6F5] p-4 text-sm text-slate-600">
              Hành động này không thể hoàn tác. Hãy kiểm tra lại trước khi xóa.
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setPendingDeleteId(null)}
                className="rounded-full px-5 text-sm shadow-sm"
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleConfirmDelete}
                className="rounded-full bg-[#CF3F34] px-5 text-sm text-white shadow-sm hover:bg-[#BE372D]"
              >
                Xóa thẻ
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
