"use client";

import { useEffect, useRef } from "react";
import goongjs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";
import {
  buildRouteSegments,
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

function hasIndexedHotspotCoordinates(
  item: IndexedHotspot,
): item is IndexedHotspotWithCoordinates {
  return hasValidCoordinates(item.hotspot);
}

export function RouteHotspotMap({
  hotspots,
  selectedIds,
  focusedHotspotId,
  onToggle,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    goongjs.accessToken = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY ?? "";

    const validHotspots = hotspots
      .map((hotspot, index) => ({ hotspot, index }))
      .filter(hasIndexedHotspotCoordinates);
    const routeSegments = buildRouteSegments(hotspots);

    const center: [number, number] =
      validHotspots.length > 0
        ? [validHotspots[0].hotspot.longitude, validHotspots[0].hotspot.latitude]
        : [106.6297, 10.8231];

    const map = new goongjs.Map({
      container: containerRef.current,
      style: "https://tiles.goong.io/assets/goong_map_web.json",
      center,
      zoom: 12,
    });

    map.addControl(new goongjs.NavigationControl());

    const routeMarkers: Array<InstanceType<typeof goongjs.Marker>> = [];
    const distanceMarkers: Array<InstanceType<typeof goongjs.Marker>> = [];

    validHotspots.forEach(({ hotspot, index }) => {
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

      const marker = new goongjs.Marker(markerEl)
        .setLngLat([hotspot.longitude!, hotspot.latitude!])
        .setPopup(
          new goongjs.Popup().setHTML(`
            <strong>Điểm ${index + 1}: ${hotspot.hotspotName ?? "Hotspot"}</strong>
            <br/>
            <span>${hotspot.address ?? ""}</span>
          `)
        )
        .addTo(map);

      routeMarkers.push(marker);
    });

    routeSegments.forEach((segment) => {
      const distanceEl = document.createElement("div");
      distanceEl.className =
        "rounded-full border border-rose-200 bg-white/95 px-2 py-1 text-[10px] font-semibold text-rose-700 shadow-sm";
      distanceEl.textContent = formatDistanceMeters(segment.distanceMeters);

      const marker = new goongjs.Marker({
        element: distanceEl,
        anchor: "center",
      })
        .setLngLat([
          segment.midpoint.longitude,
          segment.midpoint.latitude,
        ])
        .addTo(map);

      distanceMarkers.push(marker);
    });

    const lineSourceId = "route-segments";
    const lineLayerId = "route-segments-line";
    const drawSegments = () => {
      if (routeSegments.length === 0) {
        return;
      }

      map.addSource(lineSourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: routeSegments.map((segment) => ({
            type: "Feature" as const,
            properties: {
              fromIndex: segment.fromIndex + 1,
              toIndex: segment.toIndex + 1,
            },
            geometry: {
              type: "LineString" as const,
              coordinates: [
                [segment.from.longitude!, segment.from.latitude!],
                [segment.to.longitude!, segment.to.latitude!],
              ],
            },
          })),
        },
      });

      map.addLayer({
        id: lineLayerId,
        type: "line",
        source: lineSourceId,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#cf3d37",
          "line-width": 4,
          "line-opacity": 0.85,
        },
      });
    };

    map.on("load", drawSegments);

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
    } else if (validHotspots.length > 1) {
      const bounds = new goongjs.LngLatBounds();

      validHotspots.forEach(({ hotspot }) => {
        bounds.extend([hotspot.longitude, hotspot.latitude]);
      });

      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: 15,
      });
    }

    return () => {
      map.off("load", drawSegments);
      routeMarkers.forEach((marker) => marker.remove());
      distanceMarkers.forEach((marker) => marker.remove());
      map.remove();
    };
  }, [focusedHotspotId, hotspots, onToggle, selectedIds]);

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
