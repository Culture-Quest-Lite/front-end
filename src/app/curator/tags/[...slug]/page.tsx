import Link from "next/link";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Tag } from "lucide-react";

import { hotspotItems } from "@/data/hotspots";
import {
  buildTagChipLabel,
  buildTagToken,
  formatTagDateTime,
  formatTagStatus,
  getTagStatusTone,
  getTagColor,
  getTagColorState,
  parseTagDetailId,
  type TagRecord,
} from "@/lib/tags";

const BACKEND_API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

const ACCESS_TOKEN_COOKIE_KEY = "culture-quest-access-token";

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
      <div className="flex items-center justify-between gap-4">
        <span className="cq-label">{label}</span>
        <div className="cq-card-title text-right">{value}</div>
      </div>
    </div>
  );
}

async function getTagFromBackend(tagId: number) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_KEY)?.value;

  if (!accessToken) {
    return null;
  }

  const response = await fetch(`${BACKEND_API_BASE_URL}/api/tags/${tagId}`, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as TagRecord;
}

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  if (slug.length < 1 || slug.length > 2) {
    notFound();
  }

  const tagId = parseTagDetailId(slug[0] ?? "");

  if (!tagId) {
    notFound();
  }

  const backendTag = await getTagFromBackend(tagId);

  if (!backendTag) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-slate-700">
          <Link
            href="/curator/tags"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="cq-page-title">Chi tiết thẻ</h1>
            <p className="cq-page-subtitle">
              Không thể tải dữ liệu thẻ từ API chi tiết.
            </p>
          </div>
        </div>

        <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-sm sm:px-6">
          <p className="cq-card-title sm:text-base">
            Không tải được chi tiết thẻ
          </p>
          <p className="cq-page-subtitle mt-2">
            Kiểm tra lại đăng nhập hoặc phản hồi từ API `GET /api/tags/{"{id}"}
            `.
          </p>
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

  const hotspotTag = `#${buildTagToken(backendTag.tagName)}`;
  const tagColor = getTagColor(backendTag.tagId - 1);
  const colorState = getTagColorState(tagColor);
  const createdAtLabel = formatTagDateTime(backendTag.createdAt);
  const updatedAtLabel = formatTagDateTime(backendTag.updatedAt);

  const hotspotsUsingTag = hotspotItems.filter((hotspot) =>
    hotspot.tags.some(
      (tag) => buildTagToken(tag) === buildTagToken(backendTag.tagName),
    ),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-slate-700">
        <Link
          href="/curator/tags"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="cq-page-title">Chi tiết thẻ</h1>
          <p className="cq-page-subtitle">
            Thông tin thẻ và các hotspot đang sử dụng.
          </p>
        </div>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="cq-kicker">Tổng quan thẻ</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
                style={{
                  color: tagColor,
                  backgroundColor: colorState.chipBg,
                  borderColor: colorState.chipBorder,
                }}
              >
                <Tag className="h-4 w-4" />
                <span>{buildTagChipLabel(backendTag.tagName)}</span>
              </div>
              <h2
                className="cq-detail-title"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {backendTag.tagName}
              </h2>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Những hotspot đang dùng cùng nhóm nội dung này.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DetailRow label="Mã thẻ" value={hotspotTag} />
          <DetailRow
            label="Trạng thái"
            value={
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${getTagStatusTone(backendTag.tagStatus)}`}
              >
                {formatTagStatus(backendTag.tagStatus)}
              </span>
            }
          />
          <DetailRow
            label="Màu chủ đạo"
            value={
              <span className="inline-flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: tagColor }}
                />
                <span>{tagColor}</span>
              </span>
            }
          />
          <DetailRow label="Số hotspot" value={hotspotsUsingTag.length} />
          <DetailRow label="Cập nhật tag" value={updatedAtLabel} />
          <DetailRow label="Ngày tạo" value={createdAtLabel} />
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="cq-section-title">Hotspot đang sử dụng thẻ</h2>
            <p className="cq-page-subtitle">
              Hiển thị thông tin cơ bản. Bấm vào từng hotspot để mở trang chi
              tiết.
            </p>
          </div>

          <span className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-600">
            {hotspotsUsingTag.length} hotspot
          </span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {hotspotsUsingTag.map((hotspot) => (
            <Link
              key={hotspot.slug}
              href={`/curator/hotspot/${hotspot.slug}`}
              className="group rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3.5 transition hover:border-slate-300 hover:bg-white"
            >
              <article className="flex items-start gap-3">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1rem]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={hotspot.image}
                    alt={hotspot.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="cq-label">{hotspot.category}</p>
                      <h3 className="cq-card-title mt-1 transition group-hover:text-[#cf3d37]">
                        {hotspot.title}
                      </h3>
                      <p className="cq-page-subtitle mt-1">
                        {hotspot.subtitle}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${hotspot.statusStyle}`}
                    >
                      {hotspot.badge}
                    </span>
                  </div>

                  <p className="cq-card-copy mt-3">{hotspot.address}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                      {hotspot.author}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {hotspot.date}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {hotspotsUsingTag.length === 0 ? (
          <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <p className="cq-card-title sm:text-base">
              Chưa có hotspot nào dùng thẻ này
            </p>
            <p className="cq-page-subtitle mt-2">
              Khi có hotspot được gắn thẻ, chúng sẽ hiển thị ở đây.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
