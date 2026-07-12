"use client";

import { useEffect, useRef } from "react";
import goongjs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";
import type { BackendHotspot } from "@/services/api";

type Props = {
  hotspots: BackendHotspot[];
  selectedIds: number[];
  focusedHotspotId?: number | null;
  onToggle: (hotspotId: number) => void;
};

export function RouteHotspotMap({
  hotspots,
  selectedIds,
  focusedHotspotId,
  onToggle,
}: Props) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    goongjs.accessToken = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY ?? "";

    const validHotspots = hotspots.filter(
      (h) =>
        typeof h.latitude === "number" &&
        typeof h.longitude === "number"
    );

    const center: [number, number] =
      validHotspots.length > 0
        ? [validHotspots[0].longitude!, validHotspots[0].latitude!]
        : [106.6297, 10.8231];

    const map = new goongjs.Map({
      container: containerRef.current,
      style: "https://tiles.goong.io/assets/goong_map_web.json",
      center,
      zoom: 12,
    });

    map.addControl(new goongjs.NavigationControl());

    validHotspots.forEach((hotspot) => {
      const isSelected = selectedIds.includes(hotspot.hotspotId);

      const markerEl = document.createElement("button");
      markerEl.type = "button";
      markerEl.innerText = isSelected ? "✓" : "●";
      markerEl.className =
        "h-8 w-8 rounded-full border-2 border-white bg-red-600 text-white text-sm font-bold shadow-lg";

      markerEl.onclick = () => onToggle(hotspot.hotspotId);

      new goongjs.Marker(markerEl)
        .setLngLat([hotspot.longitude!, hotspot.latitude!])
        .setPopup(
          new goongjs.Popup().setHTML(`
            <strong>${hotspot.hotspotName ?? "Hotspot"}</strong>
            <br/>
            <span>${hotspot.address ?? ""}</span>
          `)
        )
        .addTo(map);
    });

    if (focusedHotspotId != null) {
      const focusHotspot = validHotspots.find(
        (hotspot) => hotspot.hotspotId === focusedHotspotId,
      );

      if (focusHotspot) {
        map.flyTo({
          center: [focusHotspot.longitude!, focusHotspot.latitude!],
          zoom: 15,
          speed: 1.2,
        });
      }
    } else if (validHotspots.length > 1) {
      const bounds = new goongjs.LngLatBounds();

      validHotspots.forEach((h) => {
        bounds.extend([h.longitude!, h.latitude!]);
      });

      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: 15,
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [hotspots, selectedIds, onToggle]);

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full overflow-hidden rounded-[1.5rem] border border-slate-200"
    />
  );
}