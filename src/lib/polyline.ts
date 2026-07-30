/**
 * Decode một chuỗi encoded polyline (chuẩn Google/Goong) thành danh sách toạ độ
 * theo thứ tự [longitude, latitude] để dùng trực tiếp cho GeoJSON.
 */
export function decodePolyline(
  encoded: string,
  precision = 5,
): Array<[number, number]> {
  if (!encoded) {
    return [];
  }

  const factor = 10 ** precision;
  const coordinates: Array<[number, number]> = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let byte = 0;
    let shift = 0;
    let result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index <= encoded.length);

    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    byte = 0;
    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index <= encoded.length);

    longitude += result & 1 ? ~(result >> 1) : result >> 1;

    const decodedLongitude = longitude / factor;
    const decodedLatitude = latitude / factor;

    if (
      Number.isFinite(decodedLongitude) &&
      Number.isFinite(decodedLatitude) &&
      Math.abs(decodedLongitude) <= 180 &&
      Math.abs(decodedLatitude) <= 90
    ) {
      coordinates.push([decodedLongitude, decodedLatitude]);
    }
  }

  return coordinates;
}
