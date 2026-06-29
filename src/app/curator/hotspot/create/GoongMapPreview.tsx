"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, MapPin } from "lucide-react";

const GOONG_MAP_JS_URL =
  "https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.js";
const GOONG_MAP_CSS_URL =
  "https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.css";
const GOONG_MAP_STYLE_URL = "https://tiles.goong.io/assets/goong_map_web.json";
const GOONG_MAPTILES_KEY =
  process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY?.trim() ||
  process.env.NEXT_PUBLIC_GOONG_API_KEY?.trim() ||
  "";

let goongJsLoader: Promise<GoongJsGlobal> | null = null;

type Coordinate = {
  latitude: number;
  longitude: number;
};

type GoongMapPreviewProps = {
  address: string;
  latitude: string;
  longitude: string;
  onCoordinateChange?: (next: { latitude: string; longitude: string }) => void;
};

type GoongJsGlobal = {
  accessToken: string;
  Map: new (options: {
    container: HTMLElement;
    style: string;
    center: [number, number];
    zoom: number;
    attributionControl?: boolean;
  }) => GoongMapInstance;
  Marker: new (options?: {
    color?: string;
    draggable?: boolean;
    scale?: number;
  }) => GoongMarkerInstance;
  NavigationControl: new (options?: {
    showCompass?: boolean;
    showZoom?: boolean;
    visualizePitch?: boolean;
  }) => unknown;
};

type GoongMapInstance = {
  addControl: (control: unknown, position?: string) => void;
  flyTo: (options: {
    center: [number, number];
    zoom?: number;
    essential?: boolean;
  }) => void;
  on: (event: string, handler: (event?: unknown) => void) => void;
  remove: () => void;
  resize: () => void;
};

type GoongMarkerInstance = {
  addTo: (map: GoongMapInstance) => GoongMarkerInstance;
  getLngLat: () => { lng: number; lat: number };
  on?: (event: string, handler: () => void) => void;
  remove?: () => void;
  setLngLat: (lngLat: [number, number]) => GoongMarkerInstance;
};

declare global {
  interface Window {
    goongjs?: GoongJsGlobal;
  }
}

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
    <div className="mt-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">
            Xem trước trên bản đồ Goong
          </p>
        </div>

        {coordinates ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
            <MapPin className="h-3.5 w-3.5 text-[#CF3F34]" />
            {formatCoordinateValue(coordinates.latitude)},{" "}
            {formatCoordinateValue(coordinates.longitude)}
          </span>
        ) : null}
      </div>

      {coordinates ? (
        <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">
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

function ensureGoongCss() {
  if (
    document.head.querySelector('link[data-goong-map-css="true"]') instanceof
    HTMLLinkElement
  ) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = GOONG_MAP_CSS_URL;
  link.dataset.goongMapCss = "true";
  document.head.appendChild(link);
}

async function loadGoongJs() {
  if (typeof window === "undefined") {
    throw new Error("Map View chỉ khả dụng trên trình duyệt.");
  }

  if (window.goongjs) {
    ensureGoongCss();
    return window.goongjs;
  }

  if (!goongJsLoader) {
    goongJsLoader = new Promise<GoongJsGlobal>((resolve, reject) => {
      ensureGoongCss();

      const existingScript = document.head.querySelector(
        'script[data-goong-map-script="true"]',
      );

      if (existingScript instanceof HTMLScriptElement) {
        existingScript.addEventListener(
          "load",
          () => {
            if (window.goongjs) {
              resolve(window.goongjs);
              return;
            }

            reject(
              new Error("Goong JS đã tải xong nhưng không khởi tạo được."),
            );
          },
          { once: true },
        );
        existingScript.addEventListener(
          "error",
          () => {
            reject(new Error("Không thể tải Goong JS từ CDN."));
          },
          { once: true },
        );

        return;
      }

      const script = document.createElement("script");
      script.src = GOONG_MAP_JS_URL;
      script.async = true;
      script.dataset.goongMapScript = "true";
      script.addEventListener("load", () => {
        if (window.goongjs) {
          resolve(window.goongjs);
          return;
        }

        reject(new Error("Goong JS đã tải xong nhưng không khởi tạo được."));
      });
      script.addEventListener("error", () => {
        reject(new Error("Không thể tải Goong JS từ CDN."));
      });
      document.head.appendChild(script);
    }).catch((error) => {
      goongJsLoader = null;
      throw error;
    });
  }

  return goongJsLoader;
}

function parseCoordinatePair(latitude: string, longitude: string) {
  const parsedLatitude = Number.parseFloat(latitude);
  const parsedLongitude = Number.parseFloat(longitude);

  if (
    !Number.isFinite(parsedLatitude) ||
    !Number.isFinite(parsedLongitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return null;
  }

  return {
    latitude: parsedLatitude,
    longitude: parsedLongitude,
  } satisfies Coordinate;
}

function formatCoordinateValue(value: number) {
  return value.toFixed(6).replace(/\.?0+$/, "");
}
