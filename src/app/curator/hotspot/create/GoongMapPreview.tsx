"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, MapPin } from "lucide-react";

// Loader, hằng số CDN và type dùng chung với CheckInZoneEditor để Goong JS chỉ
// được tải một lần và Window.goongjs chỉ có một khai báo type duy nhất.
import {
  GOONG_MAPTILES_KEY,
  GOONG_MAP_STYLE_URL,
  formatCoordinateValue,
  loadGoongJs,
  parseCoordinatePair,
  type GoongMapInstance,
  type GoongMarkerInstance,
} from "./goong-loader";

type GoongMapPreviewProps = {
  address: string;
  latitude: string;
  longitude: string;
  onCoordinateChange?: (next: { latitude: string; longitude: string }) => void;
};

export function GoongMapPreview({
  address,
  latitude,
  longitude,
  onCoordinateChange,
}: GoongMapPreviewProps) {
  const coordinates = useMemo(
    () => parseCoordinatePair(latitude, longitude),
    [latitude, longitude],
  );
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoongMapInstance | null>(null);
  const markerRef = useRef<GoongMarkerInstance | null>(null);
  const [rawIsLoadingMap, setRawIsLoadingMap] = useState(false);
  const [rawMapError, setRawMapError] = useState<string | null>(null);
  const isLoadingMap = coordinates ? rawIsLoadingMap : false;
  const mapError = !coordinates
    ? null
    : !GOONG_MAPTILES_KEY
      ? "Chưa có khóa Goong Map View. Hãy cấu hình NEXT_PUBLIC_GOONG_MAPTILES_KEY để hiển thị bản đồ."
      : rawMapError;

  useEffect(() => {
    return () => {
      markerRef.current?.remove?.();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!coordinates) {
      markerRef.current?.remove?.();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      return;
    }

    if (!GOONG_MAPTILES_KEY) {
      return;
    }

    if (!mapContainerRef.current) {
      return;
    }

    const currentCoordinates = coordinates;
    let isDisposed = false;

    async function initOrUpdateMap() {
      try {
        setRawIsLoadingMap(true);
        setRawMapError(null);
        const goongjs = await loadGoongJs();

        if (isDisposed || !mapContainerRef.current) {
          return;
        }

        goongjs.accessToken = GOONG_MAPTILES_KEY;

        if (!mapRef.current) {
          const map = new goongjs.Map({
            container: mapContainerRef.current,
            style: GOONG_MAP_STYLE_URL,
            center: [currentCoordinates.longitude, currentCoordinates.latitude],
            zoom: 15,
            attributionControl: false,
          });

          const marker = new goongjs.Marker({
            color: "#CF3F34",
            draggable: typeof onCoordinateChange === "function",
            scale: 1.05,
          })
            .setLngLat([
              currentCoordinates.longitude,
              currentCoordinates.latitude,
            ])
            .addTo(map);

          map.addControl(
            new goongjs.NavigationControl({
              showCompass: true,
              showZoom: true,
              visualizePitch: true,
            }),
            "top-right",
          );

          map.on("load", () => {
            if (isDisposed) {
              return;
            }

            setRawIsLoadingMap(false);
            setRawMapError(null);
            window.setTimeout(() => {
              map.resize();
            }, 0);
          });

          map.on("error", () => {
            if (isDisposed) {
              return;
            }

            setRawIsLoadingMap(false);
            setRawMapError(
              "Không thể tải bản đồ Goong. Nếu tài khoản Goong của bạn dùng maptiles key riêng, hãy cấu hình NEXT_PUBLIC_GOONG_MAPTILES_KEY.",
            );
          });

          if (typeof onCoordinateChange === "function" && marker.on) {
            marker.on("dragend", () => {
              const nextPosition = marker.getLngLat();
              onCoordinateChange({
                latitude: formatCoordinateValue(nextPosition.lat),
                longitude: formatCoordinateValue(nextPosition.lng),
              });
            });
          }

          mapRef.current = map;
          markerRef.current = marker;
          return;
        }

        markerRef.current?.setLngLat([
          currentCoordinates.longitude,
          currentCoordinates.latitude,
        ]);
        mapRef.current.flyTo({
          center: [currentCoordinates.longitude, currentCoordinates.latitude],
          zoom: 15,
          essential: true,
        });
        mapRef.current.resize();
        setRawIsLoadingMap(false);
        setRawMapError(null);
      } catch (error) {
        if (isDisposed) {
          return;
        }

        setRawIsLoadingMap(false);
        setRawMapError(
          error instanceof Error
            ? error.message
            : "Không thể tải Map View từ Goong.",
        );
      }
    }

    void initOrUpdateMap();

    return () => {
      isDisposed = true;
    };
  }, [coordinates, onCoordinateChange]);

  return (
    <div className="mt-4 min-w-0 max-w-full rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-slate-900">
            Xem trước trên bản đồ Goong
          </p>
        </div>

        {coordinates ? (
          <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
            <MapPin className="h-3.5 w-3.5 text-[#CF3F34]" />
            {formatCoordinateValue(coordinates.latitude)},{" "}
            {formatCoordinateValue(coordinates.longitude)}
          </span>
        ) : null}
      </div>

      {coordinates ? (
        <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="break-words text-xs font-medium text-slate-500">
              {address.trim() || "Vị trí từ tọa độ hiện tại"}
            </p>
          </div>

          <div className="relative h-[320px] w-full bg-slate-100">
            <div ref={mapContainerRef} className="h-full w-full" />

            {isLoadingMap ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Đang tải bản đồ Goong...
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
          <p className="text-sm font-medium text-slate-700">
            Chưa có tọa độ để xem bản đồ
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Chọn một gợi ý từ Goong hoặc nhập tay vĩ độ và kinh độ để hiển thị
            vị trí trên bản đồ.
          </p>
        </div>
      )}

      {mapError ? (
        <p className="mt-3 text-xs font-medium text-rose-700">{mapError}</p>
      ) : null}
    </div>
  );
}
