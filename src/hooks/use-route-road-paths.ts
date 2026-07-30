"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import {
  DEFAULT_ROUTE_VEHICLE,
  attachRoadPaths,
  getRoadPathSnapshot,
  loadRoadPath,
  subscribeRoadPaths,
  type RouteSegmentWithRoadPath,
} from "@/lib/route-directions";
import { buildRouteSegments, type RoutePoint } from "@/lib/route-geometry";
import type { GoongDirectionVehicle } from "@/services/api/goongApi";

/**
 * Tải đường đi thật (men theo đường trên bản đồ) cho từng chặng của tuyến qua
 * Goong Direction API. Kết quả được cache theo cặp toạ độ nên nhiều component
 * dùng chung dữ liệu mà chỉ phát sinh một request cho mỗi chặng.
 */
export function useRouteRoadPaths<T extends RoutePoint>(
  points: T[],
  vehicle: GoongDirectionVehicle = DEFAULT_ROUTE_VEHICLE,
) {
  const segments = useMemo(() => buildRouteSegments(points), [points]);
  const roadPathSnapshot = useSyncExternalStore(
    subscribeRoadPaths,
    getRoadPathSnapshot,
    getRoadPathSnapshot,
  );

  useEffect(() => {
    segments.forEach((segment) => {
      void loadRoadPath(segment, vehicle).catch(() => {
        // Lỗi đã được lưu vào cache và phản ánh qua snapshot.
      });
    });
  }, [segments, vehicle]);

  const roadSegments: Array<RouteSegmentWithRoadPath<T>> = useMemo(
    () => attachRoadPaths(segments, roadPathSnapshot.paths, vehicle),
    [roadPathSnapshot, segments, vehicle],
  );

  const totalDistanceMeters = useMemo(
    () =>
      roadSegments.reduce(
        (sum, segment) => sum + segment.displayDistanceMeters,
        0,
      ),
    [roadSegments],
  );

  const isLoading = useMemo(
    () =>
      roadSegments.some(
        (segment) =>
          segment.roadPath === null &&
          !roadPathSnapshot.errors[segment.roadPathKey],
      ),
    [roadPathSnapshot, roadSegments],
  );

  const error = useMemo(() => {
    const failedSegment = roadSegments.find(
      (segment) => roadPathSnapshot.errors[segment.roadPathKey],
    );

    return failedSegment
      ? roadPathSnapshot.errors[failedSegment.roadPathKey]
      : null;
  }, [roadPathSnapshot, roadSegments]);

  return {
    roadSegments,
    totalDistanceMeters,
    isLoading,
    error,
  };
}
