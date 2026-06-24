"use client";

import { useEffect, useRef } from "react";

import { hotspotApi } from "@/services/api";

export function HotspotDetailNetworkSync({ hotspotId }: { hotspotId: number }) {
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (hasRequestedRef.current) {
      return;
    }

    hasRequestedRef.current = true;

    void hotspotApi.getHotspotById(hotspotId).catch((error) => {
      console.error("Failed to sync hotspot detail on client", error);
    });
  }, [hotspotId]);

  return null;
}
