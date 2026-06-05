import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, Clock3, MapPin, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";

type RouteStatus = "published" | "pending" | "draft";

type RouteItem = {
  title: string;
  subtitle: string;
  status: RouteStatus;
  statusLabel: string;
  hotspotCount: number;
  distanceKm: number;
  durationMinutes: number;
  completion: number;
  dropoff: number;
  images: string[];
};

const routeItems: RouteItem[] = [
  {
    title: "Sài Gòn 100 năm kiến trúc",
    subtitle: "Chủ đề văn hoá · Dễ",
    status: "published",
    statusLabel: "Đã xuất bản",
    hotspotCount: 3,
    distanceKm: 2.4,
    durationMinutes: 95,
    completion: 78,
    dropoff: 12,
    images: [
      "https://i.pinimg.com/1200x/79/b4/a5/79b4a581d8f37e56d3a5c152a1e9a4c0.jpg",
      "https://i.pinimg.com/1200x/bb/60/0a/bb600aeb686197a007961a91b2035f37.jpg",
      "https://i.pinimg.com/736x/3c/a8/e5/3ca8e5490a9f40f4aecf98b3c6e3da21.jpg",
    ],
  },
  {
    title: "Hành trình 30/4",
    subtitle: "Dòng thời gian lịch sử · Vừa",
    status: "published",
    statusLabel: "Đã xuất bản",
    hotspotCount: 3,
    distanceKm: 3.1,
    durationMinutes: 120,
    completion: 64,
    dropoff: 22,
    images: [
      "https://i.pinimg.com/736x/3c/a8/e5/3ca8e5490a9f40f4aecf98b3c6e3da21.jpg",
      "https://i.pinimg.com/736x/aa/5c/eb/aa5cebb1ed4837b3bb3c8d8044889f0c.jpg",
      "https://i.pinimg.com/1200x/79/b4/a5/79b4a581d8f37e56d3a5c152a1e9a4c0.jpg",
    ],
  },
  {
    title: "Củ Chi - Lòng đất bất khuất",
    subtitle: "Hành trình nhân vật · Khó",
    status: "pending",
    statusLabel: "Chờ duyệt",
    hotspotCount: 2,
    distanceKm: 38,
    durationMinutes: 420,
    completion: 0,
    dropoff: 0,
    images: [
      "https://i.pinimg.com/736x/f9/c9/d5/f9c9d53ab1360359d2742937442387a1.jpg",
      "https://i.pinimg.com/736x/aa/5c/eb/aa5cebb1ed4837b3bb3c8d8044889f0c.jpg",
    ],
  },
  {
    title: "Tâm linh Sài Gòn",
    subtitle: "Tối ưu địa lý · Dễ",
    status: "draft",
    statusLabel: "Bản nháp",
    hotspotCount: 2,
    distanceKm: 1.8,
    durationMinutes: 70,
    completion: 0,
    dropoff: 0,
    images: [
      "https://i.pinimg.com/1200x/6a/a0/64/6aa0646cf8b48aeca2f96c25168efaee.jpg",
      "https://i.pinimg.com/1200x/bb/60/0a/bb600aeb686197a007961a91b2035f37.jpg",
    ],
  },
];

const statusClasses: Record<RouteStatus, string> = {
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  draft: "border-slate-200 bg-slate-100 text-slate-600",
};

function RouteStatusBadge({
  status,
  label,
}: {
  status: RouteStatus;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${statusClasses[status]}`}
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
        <span>{label}</span>
      </div>
      <p className="mt-1 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function RouteCard({ item }: { item: RouteItem }) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200/80 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[1.05rem] font-semibold text-slate-900 sm:text-[1.15rem]">
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
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#e35a48] transition hover:text-[#c74735]"
            >
              Mở tuyến
              <ChevronRight className="h-4 w-4" />
            </button>
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
            <h1 className="text-3xl font-semibold text-foreground">
              Tuyến hành trình
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Xây dựng các tuyến khám phá di sản TP.HCM.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex w-fit items-center rounded-full border border-slate-100 bg-[#F7F5EF] p-1">
              <button
                type="button"
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 shadow-sm"
              >
                Danh sách
              </button>
              <button
                type="button"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                Trình tạo tuyến
              </button>
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
          {routeItems.map((item) => (
            <RouteCard key={item.title} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
