"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  LocateFixed,
  MapPin,
  Search,
  Send,
  Save,
  Video,
} from "lucide-react";

const hotspotCategories = ["Kiến trúc", "Lịch sử", "Văn hoá", "Bảo tàng"];
const tags = ["#lichsu", "#kientruc", "#disan", "#vanhoa"];
const relatedTopics = [
  "Sài Gòn 100 năm kiến trúc",
  "Hành trình 30/4",
  "Củ Chi - Lòng đất bất khuất",
];

const defaultAddress = "2 Công xã Paris, Bến Nghé, Quận 1, TP.HCM";
const suggestedAddresses = [
  "Dinh Độc Lập, Quận 1, TP.HCM",
  "Nhà thờ Đức Bà Sài Gòn, Quận 1, TP.HCM",
  "Bảo tàng Chứng tích Chiến tranh, Quận 3, TP.HCM",
];

export default function Page() {
  const [address, setAddress] = useState(defaultAddress);
  const [selectedAddress, setSelectedAddress] = useState(defaultAddress);

  const normalizedSelectedAddress = selectedAddress.trim();
  const hasSelectedAddress = normalizedSelectedAddress.length > 0;
  const mapEmbedUrl = hasSelectedAddress
    ? `https://www.google.com/maps?q=${encodeURIComponent(normalizedSelectedAddress)}&z=16&output=embed`
    : "";
  const googleMapsUrl = hasSelectedAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalizedSelectedAddress)}`
    : "";

  function handleMapSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedAddress = address.trim();

    if (!normalizedAddress) {
      return;
    }

    setSelectedAddress(normalizedAddress);
  }

  function handleSuggestedAddress(nextAddress: string) {
    setAddress(nextAddress);
    setSelectedAddress(nextAddress);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-slate-700">
          <Link
            href="/curator/hotspot"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="cq-page-title">
              Tạo Hotspot mới
            </h1>
            <p className="cq-page-subtitle">
              Nhập thông tin chi tiết và phương tiện.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-full px-4">
            <Save className="mr-2 h-4 w-4" />
            Lưu nháp
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full text-white"
          >
            <Send className="mr-2 h-4 w-4" />
            Gửi duyệt
          </Button>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 md:grid-cols-[1.8fr_1fr]">
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="cq-section-title">
                Thông tin cơ bản
              </h2>
              <div className="mt-5 grid gap-4">
                <div>
                  <label className="cq-label mb-2 block">
                    Tên hotspot
                  </label>
                  <Input
                    defaultValue="Bưu điện Trung tâm Sài Gòn"
                    className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="cq-label mb-2 block">
                    Địa chỉ
                  </label>
                  <Input
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Địa chỉ này sẽ dùng để định vị hotspot trên bản đồ.
                  </p>
                </div>
                <div>
                  <label className="cq-label mb-2 block">
                    Mô tả
                  </label>
                  <textarea
                    className="h-24 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    defaultValue="Công trình kiến trúc thuộc địa Pháp tiêu biểu, được hoàn thành năm 1891 bởi kiến trúc sư Alfred Foulhoux..."
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="cq-label mb-2 block">
                      Danh mục
                    </label>
                    <select className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
                      {hotspotCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="cq-label mb-2 block">
                      XP thưởng
                    </label>
                    <Input
                      defaultValue="100"
                      className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="cq-label mb-2 block">
                    Thẻ
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="cq-label mb-2 block">
                    Tuyến liên quan
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {relatedTopics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="cq-section-title">
                Phương tiện
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                  <ImagePlus className="mx-auto mb-3 h-6 w-6" />
                  <p className="text-sm font-medium">Ảnh bìa</p>
                  <p className="text-xs text-slate-400">
                    JPG, PNG · tối đa 5 MB
                  </p>
                </div>
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                  <Video className="mx-auto mb-3 h-6 w-6" />
                  <p className="text-sm font-medium">Video giới thiệu</p>
                  <p className="text-xs text-slate-400">MP4 · tối đa 50 MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="cq-card-title">
                    Vị trí bản đồ
                  </p>
                  <p className="text-xs text-slate-500">
                    Nhập địa chỉ để tìm nhanh vị trí trên map.
                  </p>
                </div>
                <MapPin className="h-4 w-4 text-emerald-600" />
              </div>

              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                <form onSubmit={handleMapSearch} className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Tìm địa chỉ..."
                      className="h-11 rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="submit"
                      className="hidden"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {suggestedAddresses.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleSuggestedAddress(item)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </form>

                <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                  {hasSelectedAddress ? (
                    <iframe
                      title="Map preview"
                      src={mapEmbedUrl}
                      className="h-64 w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-white text-center text-slate-400">
                      <div className="space-y-2 px-6">
                        <MapPin className="mx-auto h-10 w-10" />
                        <p className="text-sm font-medium text-slate-500">
                          Nhập địa chỉ để hiển thị vị trí trên bản đồ.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-emerald-900">
                      Địa chỉ đang liên kết với bản đồ
                    </p>
                    <p className="text-sm text-emerald-800">
                      {hasSelectedAddress
                        ? normalizedSelectedAddress
                        : "Chưa có địa chỉ được chọn."}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-emerald-800">
                      <span className="inline-flex items-center gap-1.5">
                        <LocateFixed className="h-3.5 w-3.5" />
                        Hệ thống sẽ tự suy ra toạ độ khi lưu hotspot
                      </span>
                      {hasSelectedAddress ? (
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 underline underline-offset-2"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Mở Google Maps
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
