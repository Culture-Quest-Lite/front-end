"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { PageLoading } from "@/components/app/page-loading";
import { CuratorPagination } from "@/components/curator/CuratorPagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { levelApi, type BackendLevelRecord } from "@/services/api";

type LevelItem = {
  backendId: number | null;
  id: string;
  name: string;
  levelNumber: number | null;
  requiredXp: number | null;
  minXp: number | null;
  maxXp: number | null;
  rewardPoints: number | null;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

const LEVELS_PER_PAGE = 8;

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function pickFirstValue(
  record: BackendLevelRecord,
  keys: readonly string[],
): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return null;
}

function pickString(
  record: BackendLevelRecord,
  keys: readonly string[],
): string | null {
  const value = pickFirstValue(record, keys);

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function pickNumber(
  record: BackendLevelRecord,
  keys: readonly string[],
): number | null {
  const value = pickFirstValue(record, keys);

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.replace(/,/g, "").trim();
    if (!normalizedValue) {
      return null;
    }

    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function mapLevelRecordToItem(
  record: BackendLevelRecord,
  index: number,
): LevelItem {
  const levelNumber = pickNumber(record, [
    "levelNumber",
    "level",
    "rank",
    "orderIndex",
    "tier",
  ]);
  const id =
    pickString(record, ["levelId", "id", "code"]) ??
    String(levelNumber ?? index + 1);
  const backendId = pickNumber(record, ["levelId", "id"]);
  const name =
    pickString(record, ["levelName", "name", "title", "label"]) ??
    (levelNumber !== null ? `Level ${levelNumber}` : `Level ${index + 1}`);

  return {
    backendId,
    id,
    name,
    levelNumber,
    requiredXp: pickNumber(record, [
      "requiredXp",
      "xpRequired",
      "experienceRequired",
      "requiredExperience",
      "pointsRequired",
      "pointRequired",
      "xp",
    ]),
    minXp: pickNumber(record, [
      "minXp",
      "minimumXp",
      "minExperience",
      "minimumExperience",
      "xpMin",
      "fromXp",
    ]),
    maxXp: pickNumber(record, [
      "maxXp",
      "maximumXp",
      "maxExperience",
      "maximumExperience",
      "xpMax",
      "toXp",
    ]),
    rewardPoints: pickNumber(record, [
      "rewardPoints",
      "bonusPoints",
      "pointsReward",
      "rewardXp",
      "bonusXp",
    ]),
    description: pickString(record, [
      "description",
      "details",
      "summary",
      "note",
    ]),
    createdAt: pickString(record, ["createdAt", "createdDate", "createdTime"]),
    updatedAt: pickString(record, [
      "updatedAt",
      "updatedDate",
      "updatedTime",
      "modifiedAt",
    ]),
  };
}

function formatNumber(value: number | null) {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatXpRange(level: LevelItem) {
  if (level.minXp !== null && level.maxXp !== null) {
    return `${formatNumber(level.minXp)} - ${formatNumber(level.maxXp)} XP`;
  }

  if (level.minXp !== null) {
    return `Từ ${formatNumber(level.minXp)} XP`;
  }

  if (level.maxXp !== null) {
    return `Đến ${formatNumber(level.maxXp)} XP`;
  }

  if (level.requiredXp !== null) {
    return `${formatNumber(level.requiredXp)} XP`;
  }

  return "-";
}

export default function CuratorLevelsPage() {
  const [levels, setLevels] = useState<LevelItem[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [openMenuLevelId, setOpenMenuLevelId] = useState<string | null>(null);
  const [pendingDeleteLevel, setPendingDeleteLevel] =
    useState<LevelItem | null>(null);
  const [deletingLevelId, setDeletingLevelId] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(searchQuery);
  const normalizedQuery = normalizeText(deferredSearch);

  useEffect(() => {
    let cancelled = false;

    async function loadLevels() {
      try {
        setIsLoadingLevels(true);
        setLoadError(null);

        const records = await levelApi.getLevels();
        if (cancelled) {
          return;
        }

        setLevels(records.map(mapLevelRecordToItem));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLevels([]);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách cấp bậc.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingLevels(false);
        }
      }
    }

    loadLevels();

    return () => {
      cancelled = true;
    };
  }, [reloadVersion]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      if (!event.target.closest("[data-level-actions]")) {
        setOpenMenuLevelId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuLevelId(null);
        setPendingDeleteLevel(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filteredLevels = levels.filter((level) => {
    if (!normalizedQuery) {
      return true;
    }

    return [
      level.name,
      level.id,
      level.description ?? "",
      level.levelNumber !== null ? String(level.levelNumber) : "",
      level.requiredXp !== null ? String(level.requiredXp) : "",
      level.minXp !== null ? String(level.minXp) : "",
      level.maxXp !== null ? String(level.maxXp) : "",
    ].some((value) => normalizeText(value).includes(normalizedQuery));
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLevels.length / LEVELS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedLevels = filteredLevels.slice(
    (safeCurrentPage - 1) * LEVELS_PER_PAGE,
    safeCurrentPage * LEVELS_PER_PAGE,
  );

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handleReload() {
    setOpenMenuLevelId(null);
    setReloadVersion((current) => current + 1);
  }

  function handlePageChange(page: number) {
    setOpenMenuLevelId(null);
    setCurrentPage(page);
  }

  function handleDeleteRequest(level: LevelItem) {
    setOpenMenuLevelId(null);
    setPendingDeleteLevel(level);
  }

  async function handleConfirmDeleteLevel() {
    if (!pendingDeleteLevel) {
      return;
    }

    if (pendingDeleteLevel.backendId === null) {
      setPendingDeleteLevel(null);
      toast.error("Cấp bậc này chưa có ID backend nên chưa thể xóa.");
      return;
    }

    setDeletingLevelId(pendingDeleteLevel.id);

    try {
      await levelApi.deleteLevel(pendingDeleteLevel.backendId);
      setLevels((current) =>
        current.filter((level) => level.id !== pendingDeleteLevel.id),
      );

      setPendingDeleteLevel(null);
      toast.success("Xóa cấp bậc thành công.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể xóa cấp bậc. Vui lòng thử lại.",
      );
    } finally {
      setDeletingLevelId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col gap-6">
      <section className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="cq-page-title">Cấp bậc thành viên</h1>
            <p className="cq-page-subtitle max-w-2xl">
              Đồng bộ dữ liệu cấp bậc từ hệ thống cấp bậc và hiển thị trực tiếp
              trong bảng quản trị.
            </p>
          </div>

          <Button
            asChild
            variant="secondary"
            size="lg"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-white shadow-sm"
          >
            <Link href="/curator/levels/create">
              <Plus className="h-4 w-4" />
              Tạo mới
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full lg:max-w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Tìm cấp bậc theo tên"
              className="h-9 rounded-full border border-slate-200 bg-white pl-9 pr-3.5 text-[13px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/20"
            />
          </div>

          <span className="text-sm text-slate-500">
            {isLoadingLevels ? "—" : `${filteredLevels.length} cấp bậc`}
          </span>
        </div>

        <section className="flex flex-1 flex-col gap-5">
          {isLoadingLevels ? (
            <PageLoading className="min-h-[320px] rounded-[1.5rem] border border-slate-200 shadow-none" />
          ) : loadError ? (
            <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-10 text-center">
              <p className="cq-card-title text-rose-700">
                Không thể tải danh sách cấp bậc
              </p>
              <p className="cq-page-subtitle mt-2 text-rose-600">{loadError}</p>
              <Button
                type="button"
                variant="secondary"
                onClick={handleReload}
                className="mt-4 rounded-full px-4 py-2 text-white"
              >
                Thử lại
              </Button>
            </div>
          ) : filteredLevels.length > 0 ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white overflow-visible">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] table-fixed border-collapse">
                <thead>
                  <tr className="bg-slate-50/90">
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Cấp bậc
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Mô tả
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Khoảng XP
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Ngày tạo
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Cập nhật
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 whitespace-nowrap">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLevels.map((level, index) => (
                    <tr
                      key={`${level.id}-${index}`}
                      className={cn(
                        "border-t border-slate-200 align-middle",
                        openMenuLevelId === level.id && "relative z-20",
                      )}
                    >
                      <td className="px-4 py-4 text-left">
                        <p className="break-words text-[0.8125rem] font-semibold text-slate-950">
                          {level.name}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-left">
                        <p className="line-clamp-2 break-words text-xs leading-5 text-slate-500 sm:text-sm">
                          {level.description ?? "Không có mô tả bổ sung."}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-left">
                        <span className="inline-flex rounded-full bg-[#FFF1F7] px-2.5 py-1 text-xs font-medium leading-5 text-[#D94A8D] ring-1 ring-[#F7DCE8]">
                          {formatXpRange(level)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-left text-xs leading-5 text-slate-500 sm:text-sm">
                        {formatDateTime(level.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-left text-xs leading-5 text-slate-500 sm:text-sm">
                        {formatDateTime(level.updatedAt)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div
                          className="relative flex justify-center overflow-visible"
                          data-level-actions
                        >
                          <button
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={openMenuLevelId === level.id}
                            onClick={() =>
                              setOpenMenuLevelId(
                                openMenuLevelId === level.id ? null : level.id,
                              )
                            }
                            className={cn(
                              "inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700",
                              openMenuLevelId === level.id && "bg-slate-100",
                            )}
                            aria-label={`Tác vụ cho ${level.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {openMenuLevelId === level.id ? (
                            <div
                              role="menu"
                              className="absolute right-0 top-[calc(100%+0.6rem)] w-44 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.4)]"
                            >
                              <Link
                                href={`/curator/levels/${level.backendId ?? level.id}`}
                                role="menuitem"
                                onClick={() => setOpenMenuLevelId(null)}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                              >
                                <Pencil className="h-4 w-4" />
                                <span>Chỉnh sửa</span>
                              </Link>

                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => handleDeleteRequest(level)}
                                className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 pt-3 pb-2.5 text-left text-sm font-medium text-red-500 transition hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Xóa cấp bậc</span>
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-card px-5 py-10 text-center">
              <p className="cq-card-title">
                Không tìm thấy cấp bậc
              </p>
              <p className="cq-page-subtitle mt-2">
                Thử đổi từ khóa tìm kiếm hoặc tải lại dữ liệu từ hệ thống.
              </p>
            </div>
          )}

          {!isLoadingLevels && !loadError && filteredLevels.length > 0 ? (
            <div className="mt-auto flex justify-end pt-6">
              <CuratorPagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          ) : null}
        </section>
      </section>

      {pendingDeleteLevel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 py-6 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => {
              if (deletingLevelId !== pendingDeleteLevel.id) {
                setPendingDeleteLevel(null);
              }
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-[22rem] rounded-[1.75rem] border border-slate-200 bg-white px-5 py-7 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:px-6 sm:py-8">
            <div className="space-y-3">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <Trash2 className="h-10 w-10" />
              </div>
              <h2 className="text-[1.125rem] font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[1.25rem]">
                Bạn có chắc muốn xóa?
              </h2>
              <p className="mx-auto max-w-[16.5rem] text-[0.8125rem] leading-5 text-slate-500 sm:text-[0.875rem]">
                Hành động này không thể hoàn tác. Cấp bậc{" "}
                <span className="font-semibold text-slate-900">
                  {pendingDeleteLevel.name}
                </span>{" "}
                sẽ bị xóa khỏi hệ thống.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setPendingDeleteLevel(null)}
                disabled={deletingLevelId === pendingDeleteLevel.id}
                className="h-11 rounded-2xl border-slate-200 bg-slate-100 text-[0.8125rem] font-semibold text-slate-600 shadow-none hover:bg-slate-200 hover:text-slate-700 sm:text-sm"
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => void handleConfirmDeleteLevel()}
                disabled={deletingLevelId === pendingDeleteLevel.id}
                className="h-11 rounded-2xl border-rose-600 bg-rose-600 text-[0.8125rem] font-semibold text-white shadow-none hover:border-rose-700 hover:bg-rose-700 sm:text-sm"
              >
                {deletingLevelId === pendingDeleteLevel.id
                  ? "Đang xóa..."
                  : "Xóa cấp bậc"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
