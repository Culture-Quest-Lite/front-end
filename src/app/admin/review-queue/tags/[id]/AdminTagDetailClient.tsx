"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { PageLoading } from "@/components/app/page-loading";
import { TabTitleMarker } from "@/components/app/TabTitleMarker";
import {
  formatTagDateTime,
  formatTagStatus,
  getTagInitials,
  getTagStatusTone,
  type TagRecord,
} from "@/lib/tags";
import { cn } from "@/lib/utils";
import { tagApi } from "@/services/api";

const pendingTagDetailRequests = new Map<number, Promise<TagRecord>>();

function loadTagDetailOnce(tagId: number) {
  const existingRequest = pendingTagDetailRequests.get(tagId);

  if (existingRequest) {
    return existingRequest;
  }

  const request = tagApi.getTagById(tagId).finally(() => {
    pendingTagDetailRequests.delete(tagId);
  });

  pendingTagDetailRequests.set(tagId, request);
  return request;
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-700">{value}</p>
    </div>
  );
}

export function AdminTagDetailClient({ tagId }: { tagId: number }) {
  const [tag, setTag] = useState<TagRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTag() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await loadTagDetailOnce(tagId);

        if (cancelled) {
          return;
        }

        setTag(response);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setTag(null);
        setLoadError(
          error instanceof Error ? error.message : "Không thể tải chi tiết thẻ.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTag();

    return () => {
      cancelled = true;
    };
  }, [tagId]);

  if (isLoading) {
    return <PageLoading className="min-h-[320px]" />;
  }

  return (
    <div className="space-y-5 pb-5 pt-2">
      <TabTitleMarker title={tag?.tagName || "Chi tiết thẻ"} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-slate-700">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/review-queue"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-2.5 w-2.5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold tracking-[-0.03em] text-slate-900 sm:text-xl">
                Chi tiết thẻ
              </h1>
              <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:text-[13px]">
                Thông tin chi tiết của thẻ trong khu vực kiểm duyệt quản trị.
              </p>
            </div>
          </div>
        </div>
      </div>

      {!tag ? (
        <section className="cq-admin-panel px-5 py-10 text-center">
          <p className="text-sm font-semibold text-slate-800">
            Không tải được chi tiết thẻ
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {loadError || "Dữ liệu thẻ hiện không khả dụng."}
          </p>
        </section>
      ) : (
        <section className="cq-admin-panel overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-3.5">
                {tag.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tag.imageUrl}
                    alt={tag.tagName}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#FFF1F7,_#FFF7ED)] text-sm font-semibold text-slate-700 ring-1 ring-[#F7DCE8]">
                    {getTagInitials(tag.tagName)}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                    Thẻ văn hóa
                  </p>
                  <h1 className="mt-1 line-clamp-2 text-base font-semibold text-slate-900">
                    {tag.tagName}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 justify-start sm:justify-end">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                    getTagStatusTone(tag.tagStatus),
                  )}
                >
                  {formatTagStatus(tag.tagStatus)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 xl:grid-cols-3">
            <DetailCard
              label="Số tuyến"
              value={String(tag.routeCount ?? 0)}
            />
            <DetailCard
              label="Số địa điểm"
              value={String(tag.hotspotCount ?? 0)}
            />
            <DetailCard
              label="Số câu chuyện"
              value={String(tag.storyCount ?? 0)}
            />
            <DetailCard
              label="Thời gian tạo"
              value={formatTagDateTime(tag.createdAt)}
            />
            <DetailCard
              label="Cập nhật gần nhất"
              value={formatTagDateTime(tag.updatedAt)}
            />
            <DetailCard
              label="Lý do từ chối"
              value={tag.rejectReason?.trim() || "Chưa có"}
            />
          </div>

          <div className="border-t border-slate-100 px-5 py-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Đánh giá văn hóa
            </h2>
            <p className="mt-2 text-xs leading-6 text-slate-600">
              {tag.cultureReason?.trim() ||
                "Backend chưa trả về lý do đánh giá văn hóa cho thẻ này."}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
