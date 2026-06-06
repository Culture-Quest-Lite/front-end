import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Palette, Tag } from "lucide-react";

import { getHotspotProfile, hotspotItems } from "@/data/hotspots";

type TagMeta = {
  slug: string;
  name: string;
  hotspotTag: string;
  color: string;
  description: string;
};

const tagCatalog: TagMeta[] = [
  {
    slug: "lich-su",
    name: "Lịch sử",
    hotspotTag: "#lichsu",
    color: "#C84E14",
    description:
      "Nhóm thẻ dành cho các hotspot gắn với dấu mốc, bối cảnh và lớp ký ức lịch sử của đô thị.",
  },
  {
    slug: "kien-truc",
    name: "Kiến trúc",
    hotspotTag: "#kientruc",
    color: "#7C3AED",
    description:
      "Thẻ dùng để gom các hotspot nổi bật về công trình, hình khối, vật liệu và giá trị kiến trúc.",
  },
  {
    slug: "di-san",
    name: "Di sản",
    hotspotTag: "#disan",
    color: "#0F9D74",
    description:
      "Nhóm nội dung ưu tiên các điểm có giá trị lưu giữ ký ức đô thị, văn hóa và bảo tồn di sản.",
  },
  {
    slug: "chien-tranh",
    name: "Chiến tranh",
    hotspotTag: "#chientranh",
    color: "#A72222",
    description:
      "Thẻ dành cho các hotspot liên quan đến chiến tranh, ký ức xung đột và tư liệu lịch sử chuyên đề.",
  },
  {
    slug: "van-hoa",
    name: "Văn hóa",
    hotspotTag: "#vanhoa",
    color: "#F59E0B",
    description:
      "Nhóm thẻ cho các hotspot nhấn mạnh đời sống văn hóa, sinh hoạt cộng đồng và trải nghiệm đô thị.",
  },
];

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
      <div className="flex items-center justify-between gap-4">
        <span className="cq-label">
          {label}
        </span>
        <div className="cq-card-title text-right">
          {value}
        </div>
      </div>
    </div>
  );
}

function withHexAlpha(color: string, alpha: string) {
  const normalized = color.trim().toUpperCase();

  if (/^#[0-9A-F]{6}$/i.test(normalized)) {
    return `${normalized}${alpha}`;
  }

  return color;
}

function formatTagChipLabel(name: string) {
  return `# ${name.trim().toLowerCase()}`;
}

function parseDateValue(value: string) {
  const [day, month, year] = value.split("/").map(Number);

  if (!day || !month || !year) {
    return 0;
  }

  return new Date(year, month - 1, day).getTime();
}

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag =
    tagCatalog.find(
      (item) => item.slug === slug || item.hotspotTag.slice(1) === slug,
    ) ?? null;

  if (!tag) {
    notFound();
  }

  const hotspotsUsingTag = hotspotItems.filter((hotspot) =>
    hotspot.tags.includes(tag.hotspotTag),
  );
  const publishedCount = hotspotsUsingTag.filter(
    (hotspot) => hotspot.status === "Đã xuất bản",
  ).length;
  const relatedCategories = Array.from(
    new Set(hotspotsUsingTag.map((hotspot) => hotspot.category)),
  );
  const relatedDistricts = Array.from(
    new Set(
      hotspotsUsingTag
        .map((hotspot) => getHotspotProfile(hotspot.slug)?.district)
        .filter((district): district is string => Boolean(district)),
    ),
  );
  const latestUpdated =
    hotspotsUsingTag
      .map((hotspot) => getHotspotProfile(hotspot.slug)?.lastUpdated ?? hotspot.date)
      .sort((left, right) => parseDateValue(right) - parseDateValue(left))[0] ??
    "Chưa có cập nhật";
  const chipBg = withHexAlpha(tag.color, "14");
  const chipBorder = withHexAlpha(tag.color, "4D");

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
          <h1 className="cq-page-title">
            Chi tiết thẻ
          </h1>
          <p className="cq-page-subtitle">
            Thông tin thẻ và các hotspot đang sử dụng.
          </p>
        </div>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="cq-kicker">
              Tổng quan thẻ
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
                style={{
                  color: tag.color,
                  backgroundColor: chipBg,
                  borderColor: chipBorder,
                }}
              >
                <Tag className="h-4 w-4" />
                <span>{formatTagChipLabel(tag.name)}</span>
              </div>
              <h2
                className="cq-detail-title"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {tag.name}
              </h2>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Những hotspot đang dùng cùng nhóm nội dung này.
            </p>
          </div>

          <Link
            href="/curator/tags"
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Đóng
          </Link>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="grid gap-3">
            <DetailRow label="ID" value={tag.slug} />
            <DetailRow label="Mã thẻ" value={tag.hotspotTag} />
            <DetailRow
              label="Màu chủ đạo"
              value={
                <span className="inline-flex items-center gap-3">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span>{tag.color}</span>
                </span>
              }
            />
            <DetailRow label="Số hotspot" value={hotspotsUsingTag.length} />
            <DetailRow
              label="Đã xuất bản"
              value={`${publishedCount} hotspot`}
            />
            <DetailRow label="Cập nhật" value={latestUpdated} />
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <p className="cq-label">
              Mô tả
            </p>
            <p className="cq-body-copy mt-3">
              {tag.description}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-[#cf3d37]" />
                  <p className="cq-label">
                    Danh mục liên quan
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {relatedCategories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#cf3d37]" />
                  <p className="cq-label">
                    Khu vực xuất hiện
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {relatedDistricts.map((district) => (
                    <span
                      key={district}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {district}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="cq-section-title">
              Hotspot đang sử dụng thẻ
            </h2>
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
                      <p className="cq-label">
                        {hotspot.category}
                      </p>
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

                  <p className="cq-card-copy mt-3">
                    {hotspot.address}
                  </p>

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
