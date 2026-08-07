"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, MapPin, Pencil, Radius, Trash2, Undo2 } from "lucide-react";

import {
  circleToGeoJson,
  formatRadiusLabel,
  isPointInPolygon,
  parseGeoJsonToVertices,
  verticesToGeoJson,
  type GeoPosition,
} from "@/lib/geo";

import {
  GOONG_MAPTILES_KEY,
  GOONG_MAP_STYLE_URL,
  formatCoordinateValue,
  loadGoongJs,
  parseCoordinatePair,
  type GoongMapInstance,
  type GoongMarkerInstance,
} from "./goong-loader";

export const MIN_CHECK_IN_RADIUS = 20;
export const MAX_CHECK_IN_RADIUS = 5000;
export const DEFAULT_CHECK_IN_RADIUS = 50;

export type CheckInZoneMode = "radius" | "polygon";

type CheckInZoneEditorProps = {
  latitude: string;
  longitude: string;
  mode: CheckInZoneMode;
  checkInRadius: string;
  boundaryGeoJson: string;
  onModeChange: (mode: CheckInZoneMode) => void;
  onRadiusChange: (radius: string) => void;
  onBoundaryChange: (boundaryGeoJson: string) => void;
};

const ZONE_SOURCE_ID = "check-in-zone";
const ZONE_FILL_LAYER_ID = "check-in-zone-fill";
const ZONE_LINE_LAYER_ID = "check-in-zone-line";

const EMPTY_FEATURE_COLLECTION = {
  type: "FeatureCollection" as const,
  features: [] as unknown[],
};

export function CheckInZoneEditor({
  latitude,
  longitude,
  mode,
  checkInRadius,
  boundaryGeoJson,
  onModeChange,
  onRadiusChange,
  onBoundaryChange,
}: CheckInZoneEditorProps) {
  const coordinates = useMemo(
    () => parseCoordinatePair(latitude, longitude),
    [latitude, longitude],
  );

  const parsedRadius = useMemo(() => {
    const value = Number.parseInt(checkInRadius, 10);
    return Number.isFinite(value) ? value : DEFAULT_CHECK_IN_RADIUS;
  }, [checkInRadius]);

  // Đỉnh polygon giữ ở state của component nhưng nguồn sự thật là chuỗi GeoJSON
  // trong form state — nhờ vậy vùng đã vẽ không mất khi map bị unmount lúc toạ độ
  // tạm thời không hợp lệ (ô địa chỉ xoá lat/lng khi người dùng gõ lại).
  const [vertices, setVertices] = useState<GeoPosition[]>(() =>
    parseGeoJsonToVertices(boundaryGeoJson),
  );
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoongMapInstance | null>(null);
  const centerMarkerRef = useRef<GoongMarkerInstance | null>(null);
  const vertexMarkersRef = useRef<GoongMarkerInstance[]>([]);
  const isStyleReadyRef = useRef(false);
  // Tâm đã được đưa vào khung nhìn lần gần nhất. Chỉ flyTo khi giá trị này đổi,
  // nếu không mỗi lần thêm đỉnh / kéo slider map sẽ bị kéo về zoom mặc định.
  const lastCenteredRef = useRef<string | null>(null);

  // Giữ giá trị mới nhất cho các handler đã gắn vào map (map chỉ khởi tạo một lần).
  const modeRef = useRef(mode);
  const verticesRef = useRef(vertices);
  const commitVerticesRef = useRef<(next: GeoPosition[]) => void>(() => {});
  modeRef.current = mode;
  verticesRef.current = vertices;

  // Chuỗi GeoJSON bên ngoài đổi (mở form sửa, reset form) -> đồng bộ lại đỉnh.
  useEffect(() => {
    const nextVertices = parseGeoJsonToVertices(boundaryGeoJson);
    setVertices((current) => {
      if (JSON.stringify(current) === JSON.stringify(nextVertices)) {
        return current;
      }
      return nextVertices;
    });
  }, [boundaryGeoJson]);

  const commitVertices = useCallback(
    (nextVertices: GeoPosition[]) => {
      setVertices(nextVertices);
      const feature = verticesToGeoJson(nextVertices);
      onBoundaryChange(feature ? JSON.stringify(feature.geometry) : "");
    },
    [onBoundaryChange],
  );

  const zoneData = useMemo(() => {
    if (mode === "polygon") {
      const feature = verticesToGeoJson(vertices);
      return feature ?? EMPTY_FEATURE_COLLECTION;
    }
    if (!coordinates) {
      return EMPTY_FEATURE_COLLECTION;
    }
    return circleToGeoJson(coordinates, parsedRadius);
  }, [mode, vertices, coordinates, parsedRadius]);

  // Khởi tạo / cập nhật map
  useEffect(() => {
    if (!coordinates || !GOONG_MAPTILES_KEY || !mapContainerRef.current) {
      return;
    }

    let isDisposed = false;
    const center = coordinates;

    async function initMap() {
      try {
        setIsLoadingMap(true);
        setMapError(null);
        const goongjs = await loadGoongJs();
        if (isDisposed || !mapContainerRef.current) {
          return;
        }

        goongjs.accessToken = GOONG_MAPTILES_KEY;

        if (!mapRef.current) {
          const map = new goongjs.Map({
            container: mapContainerRef.current,
            style: GOONG_MAP_STYLE_URL,
            center: [center.longitude, center.latitude],
            zoom: 14,
            attributionControl: false,
          });

          map.addControl(
            new goongjs.NavigationControl({ showCompass: false, showZoom: true }),
            "top-right",
          );

          const centerMarker = new goongjs.Marker({ color: "#CF3F34", scale: 1 })
            .setLngLat([center.longitude, center.latitude])
            .addTo(map);

          map.on("load", () => {
            if (isDisposed) {
              return;
            }
            isStyleReadyRef.current = true;

            map.addSource(ZONE_SOURCE_ID, {
              type: "geojson",
              data: EMPTY_FEATURE_COLLECTION,
            });
            map.addLayer({
              id: ZONE_FILL_LAYER_ID,
              type: "fill",
              source: ZONE_SOURCE_ID,
              paint: { "fill-color": "#CF3F34", "fill-opacity": 0.15 },
            });
            map.addLayer({
              id: ZONE_LINE_LAYER_ID,
              type: "line",
              source: ZONE_SOURCE_ID,
              layout: { "line-cap": "round", "line-join": "round" },
              paint: { "line-color": "#CF3F34", "line-width": 2 },
            });

            setIsLoadingMap(false);
            window.setTimeout(() => map.resize(), 0);
          });

          map.on("error", () => {
            if (isDisposed) {
              return;
            }
            setIsLoadingMap(false);
            setMapError(
              "Không thể tải bản đồ Goong. Kiểm tra NEXT_PUBLIC_GOONG_MAPTILES_KEY.",
            );
          });

          // Click thêm đỉnh — chỉ nhận khi đang ở chế độ vẽ.
          map.on("click", (event?: unknown) => {
            if (modeRef.current !== "polygon") {
              return;
            }
            const lngLat = (event as { lngLat?: { lng: number; lat: number } })?.lngLat;
            if (!lngLat) {
              return;
            }
            commitVertices([...verticesRef.current, [lngLat.lng, lngLat.lat]]);
          });

          mapRef.current = map;
          centerMarkerRef.current = centerMarker;
          return;
        }

        centerMarkerRef.current?.setLngLat([center.longitude, center.latitude]);
        mapRef.current.flyTo({
          center: [center.longitude, center.latitude],
          zoom: 14,
          essential: true,
        });
        mapRef.current.resize();
        setIsLoadingMap(false);
      } catch (error) {
        if (isDisposed) {
          return;
        }
        setIsLoadingMap(false);
        setMapError(
          error instanceof Error ? error.message : "Không thể tải Map View từ Goong.",
        );
      }
    }

    void initMap();
    return () => {
      isDisposed = true;
    };
  }, [coordinates, commitVertices]);

  // Dọn map khi component unmount
  useEffect(() => {
    return () => {
      vertexMarkersRef.current.forEach((marker) => marker.remove?.());
      vertexMarkersRef.current = [];
      centerMarkerRef.current?.remove?.();
      centerMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      isStyleReadyRef.current = false;
    };
  }, []);

  // Vẽ lại vùng khi bán kính / đỉnh / chế độ đổi
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isStyleReadyRef.current) {
      return;
    }
    // setData thay vì addSource lại, theo đúng pattern của components/map/map.tsx
    map.getSource(ZONE_SOURCE_ID)?.setData(zoneData);
  }, [zoneData, isLoadingMap]);

  // Marker kéo thả cho từng đỉnh polygon
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isStyleReadyRef.current) {
      return;
    }

    vertexMarkersRef.current.forEach((marker) => marker.remove?.());
    vertexMarkersRef.current = [];

    if (mode !== "polygon") {
      return;
    }

    void loadGoongJs().then((goongjs) => {
      if (!mapRef.current) {
        return;
      }

      verticesRef.current.forEach((vertex, index) => {
        const element = document.createElement("div");
        element.style.cssText =
          "width:14px;height:14px;border-radius:9999px;background:#fff;border:3px solid #CF3F34;cursor:grab;box-shadow:0 1px 4px rgba(0,0,0,.3)";
        element.title = `Đỉnh ${index + 1} — kéo để chỉnh`;

        const marker = new goongjs.Marker({ element, draggable: true })
          .setLngLat(vertex)
          .addTo(mapRef.current!);

        marker.on?.("dragend", () => {
          const position = marker.getLngLat();
          const next = [...verticesRef.current];
          next[index] = [position.lng, position.lat];
          commitVertices(next);
        });

        vertexMarkersRef.current.push(marker);
      });
    });
  }, [mode, vertices, commitVertices, isLoadingMap]);

  const centerOutsidePolygon =
    mode === "polygon" &&
    vertices.length >= 3 &&
    coordinates !== null &&
    !isPointInPolygon(coordinates, vertices);

  const handleRadiusInput = (rawValue: string) => {
    if (rawValue === "") {
      onRadiusChange("");
      return;
    }
    const value = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(value)) {
      return;
    }
    onRadiusChange(String(value));
  };

  return (
    <div className="mt-4 min-w-0 max-w-full rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-slate-900">Vùng check-in</p>
          <p className="text-xs leading-5 text-slate-500">
            Người dùng phải ở trong vùng này mới check-in được. Khu du lịch rộng nên
            tăng bán kính, hoặc vẽ hẳn ranh giới nếu khu có hình thù bất thường.
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

      <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() => onModeChange("radius")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            mode === "radius"
              ? "bg-[#CF3F34] text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Radius className="h-3.5 w-3.5" />
          Bán kính
        </button>
        <button
          type="button"
          onClick={() => onModeChange("polygon")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            mode === "polygon"
              ? "bg-[#CF3F34] text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Pencil className="h-3.5 w-3.5" />
          Vẽ ranh giới
        </button>
      </div>

      {mode === "radius" ? (
        <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="checkInRadius"
              className="text-xs font-semibold text-slate-700"
            >
              Phạm vi check-in
            </label>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {formatRadiusLabel(parsedRadius)}
            </span>
          </div>

          <input
            id="checkInRadius"
            type="range"
            min={MIN_CHECK_IN_RADIUS}
            max={MAX_CHECK_IN_RADIUS}
            step={10}
            value={parsedRadius}
            onChange={(event) => handleRadiusInput(event.target.value)}
            className="mt-3 w-full accent-[#CF3F34]"
          />

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{MIN_CHECK_IN_RADIUS}m</span>
            <span>{MAX_CHECK_IN_RADIUS}m</span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={MIN_CHECK_IN_RADIUS}
              max={MAX_CHECK_IN_RADIUS}
              value={checkInRadius}
              onChange={(event) => handleRadiusInput(event.target.value)}
              className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#CF3F34]"
            />
            <span className="text-xs text-slate-500">mét</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <p className="text-xs leading-5 text-slate-600">
            Bấm lên bản đồ để thêm đỉnh, kéo đỉnh để chỉnh. Cần ít nhất 3 đỉnh và
            toạ độ hotspot phải nằm trong ranh giới.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {vertices.length} đỉnh
            </span>
            <button
              type="button"
              onClick={() => commitVertices(vertices.slice(0, -1))}
              disabled={vertices.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Xoá đỉnh cuối
            </button>
            <button
              type="button"
              onClick={() => commitVertices([])}
              disabled={vertices.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xoá tất cả
            </button>
          </div>

          {vertices.length > 0 && vertices.length < 3 ? (
            <p className="mt-3 text-xs font-medium text-amber-700">
              Cần thêm {3 - vertices.length} đỉnh nữa để tạo thành một vùng khép kín.
            </p>
          ) : null}

          {centerOutsidePolygon ? (
            <p className="mt-3 text-xs font-medium text-rose-700">
              Toạ độ hotspot đang nằm ngoài ranh giới đã vẽ. Hãy chỉnh lại ranh giới
              hoặc di chuyển toạ độ vào bên trong.
            </p>
          ) : null}
        </div>
      )}

      {coordinates ? (
        <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
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
            Chưa có tọa độ để cấu hình vùng check-in
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Chọn địa chỉ hoặc nhập vĩ độ / kinh độ trước. Vùng đã vẽ vẫn được giữ lại.
          </p>
        </div>
      )}

      {mapError ? (
        <p className="mt-3 text-xs font-medium text-rose-700">{mapError}</p>
      ) : null}
    </div>
  );
}
