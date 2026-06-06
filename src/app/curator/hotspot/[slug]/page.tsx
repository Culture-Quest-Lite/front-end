import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Compass,
  ExternalLink,
  Eye,
  LocateFixed,
  MapPin,
  PencilLine,
  Route,
  ShieldCheck,
  Sparkles,
  Tag,
  Video,
  type LucideIcon,
} from "lucide-react";

import {
  buildGoogleMapsUrl,
  buildMapEmbedUrl,
  getHotspotBySlug,
  getHotspotProfile,
} from "@/data/hotspots";

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

export default async function HotspotDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hotspot = getHotspotBySlug(slug);

  if (!hotspot) {
    notFound();
  }

  const profile = getHotspotProfile(hotspot.slug);
  const mapEmbedUrl = buildMapEmbedUrl(hotspot.address);
  const googleMapsUrl = buildGoogleMapsUrl(hotspot.address);
  const hasVideo = Boolean(hotspot.videoUrl);

  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="-mx-6 -mt-6 overflow-hidden bg-slate-950 shadow-sm">
        <div className="relative isolate">
          <img
            src={hotspot.image}
            alt={hotspot.title}
            className="h-[44vh] min-h-[320px] w-full object-cover sm:h-[52vh] lg:h-[60vh]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/38 to-slate-950/18" />

          <div className="absolute inset-x-0 top-0 p-4 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3 text-white">
                <Link
                  href="/curator/hotspot"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur">
                  Chi tiết hotspot
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/curator/hotspot/create"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <PencilLine className="h-4 w-4" />
                  Chỉnh sửa
                </Link>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
                >
                  <ExternalLink className="h-4 w-4" />
                  Mở Google Maps
                </a>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <InfoBadge icon={Tag} label={hotspot.category} />
              <InfoBadge icon={Sparkles} label={hotspot.xp} />
              <InfoBadge icon={LocateFixed} label={hotspot.gps} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Tổng quan hotspot
            </p>
            <h1
              className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {hotspot.title}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {hotspot.subtitle}
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
              {hotspot.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${hotspot.statusStyle}`}
            >
              <ShieldCheck className="h-4 w-4" />
              {hotspot.badge}
            </span>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              {hotspot.tags.map((tag) => (
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

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MetricTile value={profile.stats.checkIns} label="Check-in 30 ngày" />
          <MetricTile value={profile.stats.saves} label="Đã lưu" />
          <MetricTile value={profile.stats.routes} label="Tuyến chứa điểm" />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Địa chỉ
                  </p>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-900">
                    {hotspot.address}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {profile.coordinates} · {profile.district}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Thời lượng tham quan
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {profile.estimatedVisit}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <Compass className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Khung giờ đẹp
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {profile.bestTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_100%)] px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-sky-600" />
              <p className="text-sm font-semibold text-slate-900">
                Tuyến liên quan
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {hotspot.relatedTopics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-100"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Nội dung trải nghiệm"
          description="Những ý chính cần thể hiện khi người dùng mở chi tiết hotspot."
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div>
              <p className="text-sm leading-7 text-slate-600">
                {profile.editorialNote}
              </p>
              <div className="mt-5 space-y-3">
                {profile.factSheet.map((fact) => (
                  <div
                    key={fact}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <Eye className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <p className="text-sm leading-6 text-slate-700">{fact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_100%)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Ghi chú biên tập
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {profile.preservationNote}
              </p>
              <div className="mt-5 rounded-2xl border border-amber-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Khả năng tiếp cận
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
                  {profile.accessibility}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Video hotspot"
          description="Xem trực tiếp video giới thiệu của hotspot ngay trong trang chi tiết."
        >
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950">
            {hasVideo && hotspot.videoUrl ? (
              <video
                controls
                playsInline
                preload="metadata"
                poster={hotspot.image}
                className="h-[320px] w-full bg-black object-cover lg:h-[520px]"
              >
                <source src={hotspot.videoUrl} type="video/mp4" />
                Trình duyệt của bạn chưa hỗ trợ phát video.
              </video>
            ) : (
              <div className="relative h-[320px] lg:h-[520px]">
                <img
                  src={hotspot.image}
                  alt={`${hotspot.title} cover`}
                  className="h-full w-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-slate-950/10" />
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white">
                  <div className="max-w-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/12 backdrop-blur">
                      <Video className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-base font-semibold">
                      Hotspot này chưa có video giới thiệu
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Thông tin biên tập"
          description="Tổng hợp trạng thái quản trị và lịch sử cập nhật chính."
        >
          <div className="space-y-3">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Người phụ trách
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {hotspot.author}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-sky-600" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Tạo ngày
                  </p>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {hotspot.date}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-amber-600" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Cập nhật gần nhất
                  </p>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {profile.lastUpdated}
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Trạng thái hiện tại
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${hotspot.statusStyle}`}
                >
                  {hotspot.status}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  {hotspot.gps}
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Bản đồ & vị trí"
          description="Kiểm tra nhanh định vị và mở hotspot ngoài Google Maps."
        >
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100">
              {mapEmbedUrl ? (
                <iframe
                  title={`Bản đồ ${hotspot.title}`}
                  src={mapEmbedUrl}
                  loading="lazy"
                  className="h-[320px] w-full border-0"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
                  Chưa có dữ liệu vị trí.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Toạ độ
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {profile.coordinates}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Khu vực
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {profile.district}
                </p>
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <ExternalLink className="h-4 w-4" />
                Mở định vị ngoài Google Maps
              </a>
            </div>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
