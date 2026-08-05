"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { TagIdentityChip } from "@/components/curator/TagIdentityChip";
import {
  formatTagDateTime,
  formatTagStatus,
  getTagStatusTone,
  getTagColor,
  type TagRecord,
} from "@/lib/tags";
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="cq-label">{label}</p>
      <p className="text-sm font-normal leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 text-slate-700">
        <div className="flex items-center gap-3">
          <Link
            href="/curator/tags"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-2.5 w-2.5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
              Chi tiết thẻ
            </h1>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground sm:text-xs">
              Xem thông tin chi tiết và các câu chuyện được phân loại theo thẻ
              này.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TagDetailClient({ tagId }: { tagId: number }) {
  const [backendTag, setBackendTag] = useState<TagRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTagDetail() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const tag = await loadTagDetailOnce(tagId);

        if (cancelled) {
          return;
        }

        setBackendTag(tag);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setBackendTag(null);
        setLoadError(
          error instanceof Error ? error.message : "Không thể tải dữ liệu thẻ.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTagDetail();

    return () => {
      cancelled = true;
    };
  }, [tagId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader />

        <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-sm sm:px-6">
          <p className="cq-card-title">Đang tải chi tiết thẻ</p>
          <p className="cq-page-subtitle mt-2">Đang lấy dữ liệu</p>
        </section>
      </div>
    );
  }

  if (!backendTag) {
    return (
      <div className="space-y-6">
        <PageHeader />

        <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-sm sm:px-6">
          <p className="cq-card-title">
            Không tải được chi tiết thẻ
          </p>
          <p className="cq-page-subtitle mt-2">
            Kiểm tra lại phản hồi từ máy chủ hoặc thử tải lại trang.
          </p>
          {loadError ? (
            <p className="mt-3 text-sm font-medium text-[#CF3F34]">
              {loadError}
            </p>
          ) : null}
          <div className="mt-5">
            <Link
              href="/curator/tags"
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 text-sm font-medium text-slate-700 transition hover:bg-white"
            >
              Quay lại danh sách thẻ
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const tagColor = getTagColor(backendTag.tagId - 1);
  const createdAtLabel = formatTagDateTime(backendTag.createdAt);
  const updatedAtLabel = formatTagDateTime(backendTag.updatedAt);

  return (
    <div className="space-y-6">
      <PageHeader />

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-yellow-900">
            Tổng quan thẻ
          </p>
          <div className="mt-4">
            <TagIdentityChip
              name={backendTag.tagName}
              imageUrl={backendTag.imageUrl}
              accentColor={tagColor}
              className="w-fit pr-4"
              avatarClassName="h-10 w-10"
              labelClassName="text-sm"
            />
          </div>
        </div>

        <div className="mt-6 border-t border-dashed border-slate-200 pt-6">
          <div className="grid max-w-5xl gap-x-5 gap-y-4 px-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-6">
            <DetailItem
              label="Số tuyến"
              value={String(backendTag.routeCount)}
            />
            <DetailItem
              label="Số địa điểm"
              value={String(backendTag.hotspotCount)}
            />
            <DetailItem
              label="Số câu chuyện"
              value={String(backendTag.storyCount)}
            />
            <DetailItem label="Ngày tạo" value={createdAtLabel} />
            <DetailItem label="Cập nhật thẻ" value={updatedAtLabel} />
            <div className="space-y-1">
              <p className="cq-label">Trạng thái</p>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getTagStatusTone(backendTag.tagStatus)}`}
              >
                {formatTagStatus(backendTag.tagStatus)}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
