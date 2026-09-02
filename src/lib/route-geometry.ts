export type RoutePoint = {
  hotspotId?: number;
  hotspotName?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type RouteSegmentPoint<T extends RoutePoint = RoutePoint> = T & {
  latitude: number;
  longitude: number;
};

export type RouteSegment<T extends RoutePoint = RoutePoint> = {
  from: RouteSegmentPoint<T>;
  to: RouteSegmentPoint<T>;
  fromIndex: number;
  toIndex: number;
  distanceMeters: number;
  midpoint: {
    latitude: number;
    longitude: number;
  };
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function hasValidCoordinates<T extends RoutePoint>(
  point: T,
): point is T & { latitude: number; longitude: number } {
  return (
    typeof point.latitude === "number" &&
    Number.isFinite(point.latitude) &&
    typeof point.longitude === "number" &&
    Number.isFinite(point.longitude)
  );
}

export function calculateDistanceMeters(
  from: RoutePoint,
  to: RoutePoint,
): number | null {
  if (!hasValidCoordinates(from) || !hasValidCoordinates(to)) {
    return null;
  }

  const earthRadiusMeters = 6_371_000;
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const latitudeFrom = toRadians(from.latitude);
  const latitudeTo = toRadians(to.latitude);

  const haversine =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(latitudeFrom) *
      Math.cos(latitudeTo) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  const angularDistance =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusMeters * angularDistance;
}

export function buildRouteSegments<T extends RoutePoint>(
  points: T[],
): Array<RouteSegment<T>> {
  const segments: Array<RouteSegment<T>> = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    const distanceMeters = calculateDistanceMeters(from, to);

    if (
      distanceMeters === null ||
      !hasValidCoordinates(from) ||
      !hasValidCoordinates(to)
    ) {
      continue;
    }

    segments.push({
      from,
      to,
      fromIndex: index,
      toIndex: index + 1,
      distanceMeters,
      midpoint: {
        latitude: (from.latitude + to.latitude) / 2,
        longitude: (from.longitude + to.longitude) / 2,
      },
    });
  }

  return segments;
}

export function formatDistanceMeters(distanceMeters: number) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Math.round(distanceMeters))} m`;
}

export function formatDistanceKilometers(distanceKilometers: number) {
  return `${new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits:
      distanceKilometers > 0 && distanceKilometers < 10 ? 1 : 0,
    maximumFractionDigits: 2,
  }).format(distanceKilometers)} km`;
}
