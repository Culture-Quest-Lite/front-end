import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Compass,
  MapPinned,
  PencilLine,
  Route,
  ShieldCheck,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import {
  getCuratorRouteBySlug,
  getResolvedRouteStops,
  routeStatusClasses,
} from "@/data/routes";

function InfoBadge({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/14 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MetricTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#cf3d37]" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default async function CuratorRouteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = getCuratorRouteBySlug(slug);

  if (!route) {
    notFound();
  }

  const stops = getResolvedRouteStops(route);
  const coverImage = route.coverImage || route.images[0] || stops[0]?.hotspot.image;

  if (!coverImage) {
    notFound();
  }

  const previewPositions = [
    { x: 16, y: 72 },
    { x: 39, y: 42 },
    { x: 69, y: 58 },
    { x: 84, y: 29 },
    { x: 55, y: 22 },
    { x: 26, y: 26 },
  ];

  const previewStops = stops.map((stop, index) => ({
    ...stop,
    position: previewPositions[index % previewPositions.length],
  }));

  const previewPolylinePoints = previewStops
    .map(({ position }) => `${position.x},${position.y}`)
    .join(" ");

  return (
    <div className="space-y-8">
      <section className="-mx-6 -mt-6 overflow-hidden bg-slate-950 shadow-sm">
        <div className="relative isolate">
          <img
            src={coverImage}
            alt={route.title}
            className="h-[44vh] min-h-[320px] w-full object-cover sm:h-[52vh] lg:h-[60vh]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/42 to-slate-950/18" />

          <div className="absolute inset-x-0 top-0 p-4 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3 text-white">
                <Link
                  href="/curator/routes"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur">
                  Chi tiết tuyến
                </span>
              </div>

              <Link
                href="/curator/routes/create"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <PencilLine className="h-4 w-4" />
                Chỉnh sửa
              </Link>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <InfoBadge icon={Tag} label={route.theme} />
              <InfoBadge icon={Sparkles} label={route.difficulty} />
              <InfoBadge icon={MapPinned} label={route.districtSpan} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Tổng quan tuyến
            </p>
            <h1
              className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {route.title}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {route.subtitle}
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
              {route.overview}
            </p>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${routeStatusClasses[route.status]}`}
            >
              <ShieldCheck className="h-4 w-4" />
              {route.statusLabel}
            </span>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              {route.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricTile value={`${route.hotspotCount} điểm`} label="Hotspot" />
          <MetricTile value={`${route.distanceKm} km`} label="Khoảng cách" />
          <MetricTile
            value={`${route.durationMinutes} phút`}
            label="Thời lượng"
          />
          <MetricTile value={`${route.completion}%`} label="Hoàn thành" />
          <MetricTile value={`${route.dropoff}%`} label="Bỏ giữa chừng" />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_100%)] p-5">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-[#cf3d37]" />
              <p className="text-sm font-semibold text-slate-900">
                Mạch kể chuyện
              </p>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {route.storyline}
            </p>

            <div className="mt-5 space-y-3">
              {route.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm leading-6 text-slate-700">
                      {highlight}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow
              icon={Compass}
              label="Đối tượng"
              value={route.audience}
            />
            <DetailRow
              icon={Clock3}
              label="Khung giờ đẹp"
              value={route.bestTime}
            />
            <DetailRow
              icon={MapPinned}
              label="Điểm bắt đầu"
              value={route.startPoint}
            />
            <DetailRow
              icon={MapPinned}
              label="Điểm kết thúc"
              value={route.endPoint}
            />
            <DetailRow
              icon={Sparkles}
              label="Nhịp trải nghiệm"
              value={route.pace}
            />
            <DetailRow
              icon={CalendarDays}
              label="Cập nhật"
              value={route.updatedAt}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <SectionCard
          title="Preview hành trình"
          description="Mô phỏng thứ tự checkpoint và nhịp di chuyển của route."
        >
          <div className="overflow-hidden rounded-[1.75rem] border border-[#d8d2ca] bg-[#f9f8f3] shadow-sm">
            <div className="relative h-[19rem] bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#faf8f1_42%,#f5f2ea_100%)] sm:h-[22rem]">
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.16),rgba(255,255,255,0.16)),linear-gradient(90deg,transparent_24%,rgba(230,225,215,0.35)_24%,rgba(230,225,215,0.35)_25%,transparent_25%),linear-gradient(transparent_24%,rgba(230,225,215,0.35)_24%,rgba(230,225,215,0.35)_25%,transparent_25%)] bg-[length:100%_100%,72px_72px,72px_72px]" />

              {previewStops.length > 1 ? (
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full"
                  aria-hidden="true"
                >
                  <polyline
                    points={previewPolylinePoints}
                    fill="none"
                    stroke="#cf3d37"
                    strokeWidth="0.9"
                    strokeDasharray="2.4 1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}

              {previewStops.map((stop) => (
                <div
                  key={stop.hotspot.slug}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${stop.position.x}%`,
                    top: `${stop.position.y}%`,
                  }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cf3d37] text-base font-semibold text-white shadow-[0_10px_24px_rgba(207,61,55,0.22)]">
                    {stop.index}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#e9e3da] bg-white/80 px-5 py-4">
              <div className="space-y-3">
                {stops.map((stop) => (
                  <div
                    key={stop.hotspot.slug}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#fff2ef] text-xs font-semibold text-[#cf3d37]">
                      {stop.index}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {stop.hotspot.title}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {stop.checkpoint} · {stop.dwellTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Danh sách điểm dừng"
          description="Từng hotspot trong route, theo đúng thứ tự trải nghiệm."
        >
          <div className="space-y-4">
            {stops.map((stop) => (
              <article
                key={stop.hotspot.slug}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3.5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#cf3d37] text-sm font-semibold text-white">
                    {stop.index}
                  </div>

                  <img
                    src={stop.hotspot.image}
                    alt={stop.hotspot.title}
                    className="h-20 w-20 shrink-0 rounded-[1rem] object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {stop.checkpoint}
                        </p>
                        <h3 className="mt-1 text-sm font-semibold text-slate-950">
                          <Link
                            href={`/curator/hotspot/${stop.hotspot.slug}`}
                            className="transition hover:text-[#cf3d37]"
                          >
                            {stop.hotspot.title}
                          </Link>
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {stop.hotspot.address}
                        </p>
                      </div>

                      <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        {stop.dwellTime}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {stop.note}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Hiệu suất tuyến"
          description="Theo dõi nhanh mức độ bắt đầu, hoàn thành và lưu route."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricTile value={route.starts} label="Bắt đầu" />
            <MetricTile value={route.finishes} label="Hoàn thành" />
            <MetricTile value={route.saves} label="Đã lưu" />
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span>Tỷ lệ hoàn thành</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {route.completion}%
                </span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#cd4542_0%,#e3742e_52%,#f3a80a_100%)]"
                  style={{ width: `${route.completion}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <TrendingDown className="h-4 w-4 text-amber-700" />
                  <span>Bỏ giữa chừng</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {route.dropoff}%
                </span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#f1d4a4_0%,#eca45a_100%)]"
                  style={{ width: `${route.dropoff}%` }}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Ghi chú biên tập"
          description="Thông tin quản trị giúp curator xem nhanh chất lượng route."
        >
          <div className="space-y-3">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Nhận định hiện tại
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                {route.editorialNote}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/60 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                Cần theo dõi
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                {route.moderationNote}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow
                icon={CalendarDays}
                label="Tạo ngày"
                value={route.date}
              />
              <DetailRow
                icon={PencilLine}
                label="Người phụ trách"
                value={route.author}
              />
            </div>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
