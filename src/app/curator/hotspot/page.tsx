import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, MoreHorizontal, Plus, Search } from "lucide-react";

const hotspotItems = [
  {
    title: "Dinh Độc Lập",
    subtitle: "Di tích lịch sử · Quận 1",
    author: "Lan Anh",
    date: "19/5/2025",
    xp: "120 XP",
    status: "Đã xuất bản",
    statusStyle: "bg-emerald-600/95 text-white",
    badge: "Đã xuất bản",
    gps: "GPS OK",
    image:
      "https://i.pinimg.com/736x/3c/a8/e5/3ca8e5490a9f40f4aecf98b3c6e3da21.jpg",
    tags: ["#lichsu", "#kientruc", "#disan"],
  },
  {
    title: "Nhà thờ Đức Bà Sài Gòn",
    subtitle: "Kiến trúc tôn giáo · Quận 1",
    author: "Minh Quân",
    date: "20/5/2025",
    xp: "100 XP",
    status: "Đã xuất bản",
    statusStyle: "bg-emerald-500/10 text-emerald-700",
    badge: "Đã xuất bản",
    gps: "GPS OK",
    image:
      "https://i.pinimg.com/1200x/bb/60/0a/bb600aeb686197a007961a91b2035f37.jpg",
    tags: ["#kientruc", "#vanhoa"],
  },
  {
    title: "Bưu điện Trung tâm",
    subtitle: "Kiến trúc · Quận 1",
    author: "Lan Anh",
    date: "21/5/2025",
    xp: "90 XP",
    status: "Chờ duyệt",
    statusStyle: "bg-amber-500/95 text-slate-900",
    badge: "Chờ duyệt",
    gps: "GPS OK",
    image:
      "https://i.pinimg.com/1200x/79/b4/a5/79b4a581d8f37e56d3a5c152a1e9a4c0.jpg",
    tags: ["#kientruc", "#disan"],
  },
  {
    title: "Bảo tàng Chứng tích Chiến tranh",
    subtitle: "Bảo tàng · Quận 3",
    author: "Thu Hà",
    date: "21/5/2025",
    xp: "150 XP",
    status: "Chờ duyệt",
    statusStyle: "bg-amber-500/95 text-slate-900",
    badge: "Chờ duyệt",
    gps: "GPS OK",
    image:
      "https://i.pinimg.com/736x/aa/5c/eb/aa5cebb1ed4837b3bb3c8d8044889f0c.jpg",
    tags: ["#chientranh", "#lichsu"],
  },
  {
    title: "Chợ Bến Thành",
    subtitle: "Di sản văn hóa · Quận 1",
    author: "Hữu Phước",
    date: "22/5/2025",
    xp: "80 XP",
    status: "Bản nháp",
    statusStyle: "bg-slate-500/95 text-white",
    badge: "Bản nháp",
    gps: "GPS sai",
    image:
      "https://i.pinimg.com/736x/e2/a1/8d/e2a18d5e2cdf73778c0e34299ab42a0a.jpg",
    tags: ["#vanhoa", "#disan"],
  },
  {
    title: "Địa đạo Củ Chi",
    subtitle: "Di tích lịch sử · Huyện Củ Chi",
    author: "Thu Hà",
    date: "12/5/2025",
    xp: "200 XP",
    status: "Đã xuất bản",
    statusStyle: "bg-emerald-500/10 text-emerald-700",
    badge: "Đã xuất bản",
    gps: "GPS OK",
    image:
      "https://i.pinimg.com/736x/f9/c9/d5/f9c9d53ab1360359d2742937442387a1.jpg",
    tags: ["#chientranh", "#lichsu"],
  },
  {
    title: "Chùa Vĩnh Nghiêm",
    subtitle: "Kiến trúc tôn giáo · Quận 3",
    author: "Minh Quân",
    date: "18/5/2025",
    xp: "90 XP",
    status: "Bị từ chối",
    statusStyle: "bg-red-600/95 text-white",
    badge: "Bị từ chối",
    gps: "GPS OK",
    image:
      "https://i.pinimg.com/1200x/6a/a0/64/6aa0646cf8b48aeca2f96c25168efaee.jpg",
    tags: ["#vanhoa", "#kientruc"],
  },
  {
    title: "Phố đi bộ Nguyễn Huệ",
    subtitle: "Không gian công cộng · Quận 1",
    author: "Hữu Phước",
    date: "30/4/2025",
    xp: "60 XP",
    status: "Đã lưu trữ",
    statusStyle: "bg-slate-500/95 text-white",
    badge: "Đã lưu trữ",
    gps: "GPS OK",
    image:
      "https://i.pinimg.com/1200x/ac/38/46/ac3846610b7bd4f3bb2d2873fac300d6.jpg",
    tags: ["#vanhoa"],
  },
];

const statusGroups = [
  { label: "Tất cả", count: 8, active: true },
  { label: "Chờ duyệt", count: 2, active: false },
  { label: "Đã xuất bản", count: 3, active: false },
  { label: "Bản nháp", count: 1, active: false },
  { label: "Từ chối", count: 1, active: false },
];

const tagColorClasses = [
  "border-red-200 bg-red-50 text-red-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-amber-200 bg-amber-50 text-amber-700",
  "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
];

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            {/* <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">
              Quản lý Hotspot
            </div> */}
            <div>
              <h1 className="text-3xl font-semibold text-foreground">
                Quản lý Hotspot
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Tạo, chỉnh sửa và phát hành các điểm di sản văn hóa TP.HCM.
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="secondary"
            size="lg"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 shadow-sm"
          >
            <Link href="/curator/hotspot/create">
              <Plus className="h-4 w-4" />
              Tạo Hotspot
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] ">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm địa chỉ..."
              className="h-11 rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <select className="h-10 rounded-lg border-0 bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring/50 shadow-sm">
              <option>Mọi trạng thái</option>
              <option>Đã xuất bản</option>
              <option>Chờ duyệt</option>
            </select>
            <select className="h-10 rounded-lg border-0 bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring/50 shadow-sm">
              <option>Mọi danh mục</option>
              <option>Kiến trúc</option>
              <option>Lịch sử</option>
            </select>
          </div>

          <Button
            variant="outline"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border-0 shadow-sm"
          >
            <Filter className="h-4 w-4" />
            Bộ lọc nâng cao
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 ">
          {statusGroups.map((item) => (
            <button
              key={item.label}
              className={`rounded-full shadow-sm border-0 px-4 py-2 text-sm font-medium transition ${item.active ? "bg-foreground text-amber-400" : "bg-white text-slate-700 hover:bg-slate-100"}`}
            >
              {item.label}
              <span className="ml-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2">
        {hotspotItems.map((item) => (
          <article
            key={item.title}
            className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-card border border-slate-200/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="relative h-40 overflow-hidden bg-slate-100">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div
                className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold shadow-lg ring-1 ring-white/30 backdrop-blur-sm ${item.statusStyle}`}
              >
                {item.badge}
              </div>
              <div className="absolute right-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                {item.gps}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <h2 className="text-base font-semibold line-clamp-1">
                  {item.title}
                </h2>
                <p className="text-xs text-white/80 line-clamp-1">
                  {item.subtitle}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                      {item.author.charAt(0)}
                    </span>
                    <span className="text-xs font-medium text-slate-900">
                      {item.author}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {item.xp}
                  </span>
                  <button className="rounded-full bg-white/90 p-1 text-slate-600 transition hover:bg-slate-100">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag, index) => (
                  <span
                    key={tag}
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold shadow-sm ${tagColorClasses[index % tagColorClasses.length]}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
