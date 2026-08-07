/**
 * Helper hình học cho vùng check-in của hotspot.
 *
 * Dự án không cài @turf/turf nên các phép toán ở đây tự viết. Toạ độ theo thứ tự
 * GeoJSON là [longitude, latitude] — ngược với cách người ta hay đọc "lat, lng".
 */

export type GeoPosition = [number, number];

export type GeoJsonPolygon = {
  type: "Polygon";
  coordinates: GeoPosition[][];
};

export type GeoJsonFeature = {
  type: "Feature";
  geometry: GeoJsonPolygon;
  properties: Record<string, unknown>;
};

const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Xấp xỉ vòng tròn bán kính r bằng đa giác đều để vẽ lên bản đồ.
 * Chia độ dịch theo kinh tuyến cho cos(vĩ độ) vì các kinh tuyến hội tụ về hai cực.
 */
export function circleToGeoJson(
  center: { latitude: number; longitude: number },
  radiusMeters: number,
  steps = 64,
): GeoJsonFeature {
  const latitudeRadians = (center.latitude * Math.PI) / 180;
  const latitudeDeltaPerMeter = 180 / (Math.PI * EARTH_RADIUS_METERS);
  const longitudeDeltaPerMeter =
    latitudeDeltaPerMeter / Math.max(Math.cos(latitudeRadians), 1e-6);

  const ring: GeoPosition[] = [];
  for (let step = 0; step < steps; step += 1) {
    const angle = (step / steps) * 2 * Math.PI;
    ring.push([
      center.longitude + radiusMeters * Math.cos(angle) * longitudeDeltaPerMeter,
      center.latitude + radiusMeters * Math.sin(angle) * latitudeDeltaPerMeter,
    ]);
  }
  // GeoJSON yêu cầu vòng khép kín: điểm cuối trùng điểm đầu.
  if (ring.length > 0) {
    ring.push(ring[0]);
  }

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [ring] },
    properties: {},
  };
}

/** Khép kín danh sách đỉnh người dùng vẽ thành một GeoJSON Polygon hợp lệ. */
export function verticesToGeoJson(vertices: GeoPosition[]): GeoJsonFeature | null {
  if (vertices.length < 3) {
    return null;
  }

  const ring = [...vertices];
  const [firstLng, firstLat] = ring[0];
  const [lastLng, lastLat] = ring[ring.length - 1];
  if (firstLng !== lastLng || firstLat !== lastLat) {
    ring.push([firstLng, firstLat]);
  }

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [ring] },
    properties: {},
  };
}

/**
 * Đọc lại danh sách đỉnh từ chuỗi GeoJSON đã lưu (dùng khi mở form sửa hotspot).
 * Chấp nhận cả Feature lẫn Polygon trần vì backend trả ST_AsGeoJSON (Polygon trần).
 */
export function parseGeoJsonToVertices(raw: string | null | undefined): GeoPosition[] {
  if (!raw || !raw.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as
      | GeoJsonFeature
      | GeoJsonPolygon
      | { type?: string; geometry?: GeoJsonPolygon };

    const geometry =
      "coordinates" in parsed
        ? (parsed as GeoJsonPolygon)
        : ((parsed as GeoJsonFeature).geometry ?? null);

    if (!geometry || geometry.type !== "Polygon" || !Array.isArray(geometry.coordinates)) {
      return [];
    }

    const ring = geometry.coordinates[0];
    if (!Array.isArray(ring) || ring.length < 4) {
      return [];
    }

    // Bỏ điểm khép kín cuối cùng để người dùng chỉnh sửa cho tự nhiên.
    const vertices = ring
      .filter((position): position is GeoPosition =>
        Array.isArray(position) &&
        position.length >= 2 &&
        Number.isFinite(position[0]) &&
        Number.isFinite(position[1]),
      )
      .map((position) => [position[0], position[1]] as GeoPosition);

    if (vertices.length < 4) {
      return vertices;
    }

    const [firstLng, firstLat] = vertices[0];
    const [lastLng, lastLat] = vertices[vertices.length - 1];
    if (firstLng === lastLng && firstLat === lastLat) {
      vertices.pop();
    }
    return vertices;
  } catch {
    return [];
  }
}

/**
 * Ray casting: điểm có nằm trong đa giác không.
 * Dùng để chặn sớm ở client trước khi backend trả 400 vì tâm ngoài ranh giới.
 */
export function isPointInPolygon(
  point: { latitude: number; longitude: number },
  vertices: GeoPosition[],
): boolean {
  if (vertices.length < 3) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i, i += 1) {
    const [lngI, latI] = vertices[i];
    const [lngJ, latJ] = vertices[j];

    const straddlesRay = latI > point.latitude !== latJ > point.latitude;
    if (!straddlesRay) {
      continue;
    }

    const intersectLng =
      ((lngJ - lngI) * (point.latitude - latI)) / (latJ - latI) + lngI;
    if (point.longitude < intersectLng) {
      inside = !inside;
    }
  }

  return inside;
}

export function formatRadiusLabel(radiusMeters: number): string {
  if (radiusMeters >= 1000) {
    return `${(radiusMeters / 1000).toFixed(1).replace(/\.0$/, "")} km`;
  }
  return `${Math.round(radiusMeters)} m`;
}
