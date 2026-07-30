"use client";

import { useEffect, useRef, useState } from "react";
import goongjs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";
import { useRouteRoadPaths } from "@/hooks/use-route-road-paths";
import {
  getRoadPathCoordinates,
  getRoadPathMidpoint,
} from "@/lib/route-directions";
import {
  formatDistanceMeters,
  hasValidCoordinates,
} from "@/lib/route-geometry";
import type { BackendHotspot } from "@/services/api";

type Props = {
  hotspots: BackendHotspot[];
  selectedIds: number[];
  focusedHotspotId?: number | null;
  onToggle: (hotspotId: number) => void;
  className?: string;
};

type IndexedHotspot = {
  hotspot: BackendHotspot;
  index: number;
};

type IndexedHotspotWithCoordinates = {
  hotspot: BackendHotspot & { latitude: number; longitude: number };
  index: number;
};

const DEFAULT_CENTER: [number, number] = [106.6297, 10.8231];
const ROUTE_SOURCE_ID = "route-segments";
const ROUTE_LINE_LAYER_ID = "route-segments-line";
const ROUTE_LINE_CASING_LAYER_ID = "route-segments-line-casing";
const ROUTE_LINE_FALLBACK_LAYER_ID = "route-segments-line-fallback";
const ROUTE_LINE_ARROW_LAYER_ID = "route-segments-line-arrow";

function hasIndexedHotspotCoordinates(
  item: IndexedHotspot,
): item is IndexedHotspotWithCoordinates {
  return hasValidCoordinates(item.hotspot);
}

function getValidHotspots(hotspots: BackendHotspot[]) {
  return hotspots
    .map((hotspot, index) => ({ hotspot, index }))
    .filter(hasIndexedHotspotCoordinates);
}

export function RouteHotspotMap({
  hotspots,
  selectedIds,
  focusedHotspotId,
  onToggle,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<ReturnType<typeof createMap> | null>(null);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const { roadSegments } = useRouteRoadPaths(hotspots);

  const [initialCenter] = useState<[number, number]>(() => {
    const firstValidHotspot = getValidHotspots(hotspots)[0];

    return firstValidHotspot
      ? [
          firstValidHotspot.hotspot.longitude,
          firstValidHotspot.hotspot.latitude,
        ]
      : DEFAULT_CENTER;
  });

  // Khởi tạo bản đồ một lần để các cập nhật marker/đường đi không dựng lại map.
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    goongjs.accessToken = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY ?? "";

    const map = createMap(containerRef.current, initialCenter);
    mapRef.current = map;
    map.addControl(new goongjs.NavigationControl());

    const handleStyleLoad = () => setIsStyleLoaded(true);
    map.on("load", handleStyleLoad);

    return () => {
      map.off("load", handleStyleLoad);
      setIsStyleLoaded(false);
      mapRef.current = null;
      map.remove();
    };
  }, [initialCenter]);

  // Marker số thứ tự của từng địa điểm trong tuyến.
  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const markers = getValidHotspots(hotspots).map(({ hotspot, index }) => {
      const isSelected = selectedIds.includes(hotspot.hotspotId);
      const markerEl = document.createElement("button");
      markerEl.type = "button";
      markerEl.innerText = String(index + 1);
      markerEl.className =
        "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[12px] font-bold text-white shadow-lg";
      markerEl.style.backgroundColor =
        hotspot.hotspotId === focusedHotspotId
          ? "#b42318"
          : isSelected
            ? "#cf3d37"
            : "#64748b";

      markerEl.onclick = () => onToggle(hotspot.hotspotId);

      return new goongjs.Marker(markerEl)
        .setLngLat([hotspot.longitude, hotspot.latitude])
        .setPopup(
          new goongjs.Popup().setHTML(`
            <strong>Điểm ${index + 1}: ${hotspot.hotspotName ?? "Hotspot"}</strong>
            <br/>
            <span>${hotspot.address ?? ""}</span>
          `),
        )
        .addTo(map);
    });

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [focusedHotspotId, hotspots, onToggle, selectedIds]);

  // Nhãn khoảng cách đặt trên đường đi thật của từng chặng.
  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const markers = roadSegments.map((segment) => {
      const distanceEl = document.createElement("div");
      distanceEl.className =
        "rounded-full border border-rose-200 bg-white/95 px-2 py-1 text-[10px] font-semibold text-rose-700 shadow-sm";
      distanceEl.textContent = formatDistanceMeters(
        segment.displayDistanceMeters,
      );

      const midpoint = getRoadPathMidpoint(segment);

      return new goongjs.Marker({
        element: distanceEl,
        anchor: "center",
      })
        .setLngLat([midpoint.longitude, midpoint.latitude])
        .addTo(map);
    });

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [roadSegments]);

  // Vẽ đường đi men theo đường thật; khi chưa có dữ liệu Direction thì tạm nối thẳng.
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isStyleLoaded) {
      return;
    }

    const routeData = {
      type: "FeatureCollection" as const,
      features: roadSegments.map((segment) => ({
        type: "Feature" as const,
        properties: {
          fromIndex: segment.fromIndex + 1,
          toIndex: segment.toIndex + 1,
          isRoadPath: segment.roadPath !== null,
        },
        geometry: {
          type: "LineString" as const,
          coordinates: getRoadPathCoordinates(segment),
        },
      })),
    };

    const existingSource = map.getSource(ROUTE_SOURCE_ID);

    if (existingSource) {
      existingSource.setData(routeData);
      return;
    }

    map.addSource(ROUTE_SOURCE_ID, {
      type: "geojson",
      data: routeData,
    });

    map.addLayer({
      id: ROUTE_LINE_CASING_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      filter: ["==", ["get", "isRoadPath"], true],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#ffffff",
        "line-width": 9,
        "line-opacity": 0.9,
      },
    });

    map.addLayer({
      id: ROUTE_LINE_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      filter: ["==", ["get", "isRoadPath"], true],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#cf3d37",
        "line-width": 5,
        "line-opacity": 0.9,
      },
    });

    // Chặng chưa tải được đường thật tạm vẽ nét đứt để phân biệt.
    map.addLayer({
      id: ROUTE_LINE_FALLBACK_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      filter: ["==", ["get", "isRoadPath"], false],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#cf3d37",
        "line-width": 3,
        "line-opacity": 0.6,
        "line-dasharray": [2, 1.5],
      },
    });

    // Mũi chỉ hướng đi chạy dọc theo đường, đi từ điểm trước tới điểm sau.
    map.addLayer({
      id: ROUTE_LINE_ARROW_LAYER_ID,
      type: "symbol",
      source: ROUTE_SOURCE_ID,
      layout: {
        "symbol-placement": "line",
        "symbol-spacing": 70,
        "text-field": ">",
        "text-font": ["Roboto Medium"],
        "text-size": 14,
        "text-keep-upright": false,
        "text-rotation-alignment": "map",
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "#8f2018",
        "text-halo-width": 1.2,
      },
    });
  }, [isStyleLoaded, roadSegments]);

  // Camera: bay tới điểm đang chọn, hoặc gói toàn tuyến vào khung nhìn.
  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const validHotspots = getValidHotspots(hotspots);

    if (focusedHotspotId != null) {
      const focusHotspot = validHotspots.find(
        ({ hotspot }) => hotspot.hotspotId === focusedHotspotId,
      );

      if (focusHotspot) {
        map.flyTo({
          center: [
            focusHotspot.hotspot.longitude,
            focusHotspot.hotspot.latitude,
          ],
          zoom: 15,
          speed: 1.2,
        });
      }

      return;
    }

    if (validHotspots.length > 1) {
      const bounds = new goongjs.LngLatBounds();

      validHotspots.forEach(({ hotspot }) => {
        bounds.extend([hotspot.longitude, hotspot.latitude]);
      });

      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: 15,
      });
    }
  }, [focusedHotspotId, hotspots]);

  return (
    <div
      ref={containerRef}
      className={
        className ??
        "h-[420px] w-full overflow-hidden rounded-[1.5rem] border border-slate-200"
      }
    />
  );
}

function createMap(container: HTMLDivElement, center: [number, number]) {
  return new goongjs.Map({
    container,
    style: "https://tiles.goong.io/assets/goong_map_web.json",
    center,
    zoom: 12,
  });
}
