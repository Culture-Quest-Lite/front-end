import { buttonVariants } from "@/components/ui/button";
import {
  curatorRoutes,
  routeStatusClasses,
  type CuratorRoute,
} from "@/data/routes";
import { cn } from "@/lib/utils";
import { ChevronRight, Clock3, MapPin, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";

function RouteStatusBadge({
  status,
  label,
}: {
  status: CuratorRoute["status"];
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${routeStatusClasses[status]}`}
    >
      <span className="h-2 w-2 rounded-full bg-current/75" />
      {label}
    </span>
  );
}

function RouteMetric({
  icon: Icon,
  label,
  value,
  toneClass,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  toneClass: string;
}) {
  return (
    <div className="rounded-[1.35rem] bg-[#F7F5EF] px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className={`h-4 w-4 ${toneClass}`} />
        <span className="cq-page-subtitle text-slate-500">{label}</span>
      </div>
      <p className="cq-card-title mt-1">{value}</p>
    </div>
  );
}

function RouteCard({ item }: { item: CuratorRoute }) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200/80 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="cq-section-title sm:text-[1.15rem]">
              {item.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
          </div>
          <RouteStatusBadge status={item.status} label={item.statusLabel} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2.5">
            {item.images.map((image, index) => (
              <div
                key={`${item.title}-${index}`}
                className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-sm"
              >
                <img
                  src={image}
                  alt={`${item.title} hotspot ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <span className="h-5 w-px bg-slate-200" />
          <p className="text-sm text-slate-600">{item.hotspotCount} hotspot</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <RouteMetric
            icon={MapPin}
            label="Khoảng cách"
            value={`${item.distanceKm} km`}
            toneClass="text-red-500"
          />
          <RouteMetric
            icon={Clock3}
            label="Thời lượng"
            value={`${item.durationMinutes}p`}
            toneClass="text-red-500"
          />
          <RouteMetric
            icon={TrendingUp}
            label="Hoàn thành"
            value={`${item.completion}%`}
            toneClass="text-emerald-600"
          />
        </div>

        <div className="space-y-3">
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#cd4542_0%,#e3742e_52%,#f3a80a_100%)]"
              style={{ width: `${item.completion}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <p className="text-slate-500">Bỏ giữa chừng: {item.dropoff}%</p>
            <Link
              href={`/curator/routes/${item.slug}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#e35a48] transition hover:text-[#c74735]"
            >
              Mở tuyến
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CuratorRoutesPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="cq-page-title">
              Tuyến hành trình
            </h1>
            <p className="cq-page-subtitle max-w-2xl">
              Xây dựng các tuyến khám phá di sản TP.HCM.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex w-fit items-center rounded-full border border-slate-100 bg-[#F7F5EF] p-1">
              <Link
                href="/curator/routes"
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 shadow-sm"
              >
                Danh sách
              </Link>
              <Link
                href="/curator/routes/create"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                Trình tạo tuyến
              </Link>
            </div>

            <Link
              href="/curator/routes/create"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 shadow-sm",
              )}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tuyến mới
            </Link>
          </div>
        </div>

        <div className="mt-7 grid gap-4 xl:grid-cols-2">
          {curatorRoutes.map((item) => (
            <RouteCard key={item.slug} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
