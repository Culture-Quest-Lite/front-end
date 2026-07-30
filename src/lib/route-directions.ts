import {
  goongApi,
  type GoongDirectionVehicle,
} from "@/services/api/goongApi";

import type { RoutePoint, RouteSegment } from "@/lib/route-geometry";

export const DEFAULT_ROUTE_VEHICLE: GoongDirectionVehicle = "car";

export type RouteRoadPath = {
  /** Toạ độ men theo đường thật, dạng [longitude, latitude]. */
  coordinates: Array<[number, number]>;
  distanceMeters: number | null;
  durationSeconds: number | null;
};

export type RouteSegmentWithRoadPath<T extends RoutePoint = RoutePoint> =
  RouteSegment<T> & {
    roadPathKey: string;
    /** Đường đi thật lấy từ Goong Direction, null khi chưa tải được. */
    roadPath: RouteRoadPath | null;
    /** Quãng đường ưu tiên theo đường thật, fallback về đường chim bay. */
    displayDistanceMeters: number;
  };

export type RouteRoadPathSnapshot = {
  paths: Readonly<Record<string, RouteRoadPath>>;
  errors: Readonly<Record<string, string>>;
};

/**
 * Cache đường đi theo cặp toạ độ, chia sẻ giữa mọi component. Snapshot được
 * đọc qua useSyncExternalStore nên React chỉ render lại khi cache thay đổi.
 */
const pendingRoadPaths = new Map<string, Promise<RouteRoadPath>>();
const roadPathListeners = new Set<() => void>();

let roadPathSnapshot: RouteRoadPathSnapshot = { paths: {}, errors: {} };

export function subscribeRoadPaths(listener: () => void) {
  roadPathListeners.add(listener);

  return () => {
    roadPathListeners.delete(listener);
  };
}

export function getRoadPathSnapshot() {
  return roadPathSnapshot;
}

function publishRoadPathSnapshot(next: RouteRoadPathSnapshot) {
  roadPathSnapshot = next;
  roadPathListeners.forEach((listener) => listener());
}

function storeRoadPath(key: string, roadPath: RouteRoadPath) {
  const nextErrors = { ...roadPathSnapshot.errors };
  delete nextErrors[key];

  publishRoadPathSnapshot({
    paths: { ...roadPathSnapshot.paths, [key]: roadPath },
    errors: nextErrors,
  });
}

function storeRoadPathError(key: string, message: string) {
  publishRoadPathSnapshot({
    paths: roadPathSnapshot.paths,
    errors: { ...roadPathSnapshot.errors, [key]: message },
  });
}

function roundCoordinate(value: number) {
  return value.toFixed(6);
}

export function buildRoadPathKey<T extends RoutePoint>(
  segment: RouteSegment<T>,
  vehicle: GoongDirectionVehicle = DEFAULT_ROUTE_VEHICLE,
) {
  const from = `${roundCoordinate(segment.from.latitude)},${roundCoordinate(
    segment.from.longitude,
  )}`;
  const to = `${roundCoordinate(segment.to.latitude)},${roundCoordinate(
    segment.to.longitude,
  )}`;

  return `${vehicle}:${from}>${to}`;
}

function getCachedRoadPath(key: string) {
  return roadPathSnapshot.paths[key] ?? null;
}

/**
 * Gọi Goong Direction cho một chặng. Kết quả (hoặc lỗi) được đẩy vào cache
 * dùng chung; các lần gọi trùng chặng sẽ chờ cùng một request.
 */
export function loadRoadPath<T extends RoutePoint>(
  segment: RouteSegment<T>,
  vehicle: GoongDirectionVehicle = DEFAULT_ROUTE_VEHICLE,
) {
  const key = buildRoadPathKey(segment, vehicle);
  const cachedPath = getCachedRoadPath(key);

  if (cachedPath) {
    return Promise.resolve(cachedPath);
  }

  const pendingRequest = pendingRoadPaths.get(key);

  if (pendingRequest) {
    return pendingRequest;
  }

  const request = goongApi
    .getDirections({
      origin: {
        latitude: segment.from.latitude,
        longitude: segment.from.longitude,
      },
      destination: {
        latitude: segment.to.latitude,
        longitude: segment.to.longitude,
      },
      vehicle,
    })
    .then((result) => {
      const roadPath: RouteRoadPath = {
        coordinates: result.coordinates,
        distanceMeters: result.distanceMeters,
        durationSeconds: result.durationSeconds,
      };

      pendingRoadPaths.delete(key);
      storeRoadPath(key, roadPath);
      return roadPath;
    })
    .catch((error: unknown) => {
      pendingRoadPaths.delete(key);
      storeRoadPathError(
        key,
        error instanceof Error
          ? error.message
          : "Không thể tải đường đi theo bản đồ.",
      );
      throw error;
    });

  pendingRoadPaths.set(key, request);
  return request;
}

export function attachRoadPaths<T extends RoutePoint>(
  segments: Array<RouteSegment<T>>,
  roadPathsByKey: Record<string, RouteRoadPath>,
  vehicle: GoongDirectionVehicle = DEFAULT_ROUTE_VEHICLE,
): Array<RouteSegmentWithRoadPath<T>> {
  return segments.map((segment) => {
    const roadPathKey = buildRoadPathKey(segment, vehicle);
    const roadPath = roadPathsByKey[roadPathKey] ?? null;

    return {
      ...segment,
      roadPathKey,
      roadPath,
      displayDistanceMeters:
        roadPath?.distanceMeters != null
          ? roadPath.distanceMeters
          : segment.distanceMeters,
    };
  });
}

/** Toạ độ để vẽ: ưu tiên đường thật, fallback đường thẳng khi chưa có dữ liệu. */
export function getRoadPathCoordinates<T extends RoutePoint>(
  segment: RouteSegmentWithRoadPath<T>,
): Array<[number, number]> {
  if (segment.roadPath && segment.roadPath.coordinates.length > 1) {
    return segment.roadPath.coordinates;
  }

  return [
    [segment.from.longitude, segment.from.latitude],
    [segment.to.longitude, segment.to.latitude],
  ];
}

/** Điểm giữa của đường đi thật, dùng để đặt nhãn khoảng cách trên bản đồ. */
export function getRoadPathMidpoint<T extends RoutePoint>(
  segment: RouteSegmentWithRoadPath<T>,
) {
  const coordinates = segment.roadPath?.coordinates;

  if (!coordinates || coordinates.length < 2) {
    return {
      longitude: segment.midpoint.longitude,
      latitude: segment.midpoint.latitude,
    };
  }

  const [longitude, latitude] = coordinates[Math.floor(coordinates.length / 2)];

  return { longitude, latitude };
}
