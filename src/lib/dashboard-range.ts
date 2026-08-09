import type {
  CheckInTrendPoint,
  UserGrowthPoint,
} from "@/services/api/admin/adminApi";

/**
 * Gom nhóm dữ liệu dashboard theo ngày/tuần/tháng/năm — HOÀN TOÀN Ở CLIENT.
 *
 * `GET /api/admin/dashboard` không nhận tham số khoảng thời gian: backend luôn
 * trả về đúng 7 điểm check-in theo NGÀY và 12 điểm người dùng mới theo THÁNG
 * (xem `AdminDashboardServiceImpl`: CHECK_IN_DAYS = 7, GROWTH_MONTHS = 12).
 * Vì vậy các hàm dưới đây chỉ gom nhóm lại phần dữ liệu đã có, không thể mở
 * rộng cửa sổ thời gian. Mỗi biểu đồ phải hiển thị kèm cửa sổ nguồn để người
 * xem không hiểu nhầm "Năm" là số liệu cả năm.
 */
export type DashboardRange = "day" | "week" | "month" | "year";

export const dashboardRangeOptions: {
  value: DashboardRange;
  label: string;
}[] = [
  { value: "day", label: "Ngày" },
  { value: "week", label: "Tuần" },
  { value: "month", label: "Tháng" },
  { value: "year", label: "Năm" },
];

export type TrendPoint = {
  /** Nhãn trục X. */
  label: string;
  /** Giá trị đã cộng dồn trong nhóm. */
  value: number;
  /** Số mốc gốc đã gộp vào nhóm — dùng cho tooltip/chú thích. */
  sourceCount: number;
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

/** Thứ Hai của tuần chứa `date`, theo chuẩn ISO. */
function startOfIsoWeek(date: Date) {
  const result = new Date(date.getTime());
  const weekday = (result.getDay() + 6) % 7; // 0 = thứ Hai
  result.setDate(result.getDate() - weekday);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Gộp giữ nguyên thứ tự xuất hiện đầu tiên của mỗi khoá — dữ liệu backend đã
 * sắp xếp tăng dần theo thời gian nên kết quả cũng giữ đúng thứ tự đó.
 */
function groupInOrder<T>(
  items: T[],
  getKey: (item: T) => string,
  getLabel: (item: T) => string,
  getValue: (item: T) => number,
): TrendPoint[] {
  const buckets = new Map<string, TrendPoint>();

  for (const item of items) {
    const key = getKey(item);
    const existing = buckets.get(key);

    if (existing) {
      existing.value += getValue(item);
      existing.sourceCount += 1;
      continue;
    }

    buckets.set(key, {
      label: getLabel(item),
      value: getValue(item),
      sourceCount: 1,
    });
  }

  return [...buckets.values()];
}

/**
 * Check-in: nguồn là 7 mốc THEO NGÀY, nên "Tuần"/"Tháng"/"Năm" chỉ là tổng của
 * 7 ngày đó chia theo mốc tương ứng (thường ra 1–2 cột).
 */
export function bucketCheckInTrend(
  points: CheckInTrendPoint[],
  range: DashboardRange,
): TrendPoint[] {
  if (range === "day") {
    return points.map((point) => ({
      label: point.d,
      value: point.v,
      sourceCount: 1,
    }));
  }

  const parsed = points.map((point) => ({
    point,
    date: new Date(point.date),
  }));

  if (range === "week") {
    return groupInOrder(
      parsed,
      (item) => startOfIsoWeek(item.date).toISOString().slice(0, 10),
      (item) => {
        const monday = startOfIsoWeek(item.date);
        return `${pad2(monday.getDate())}/${pad2(monday.getMonth() + 1)}`;
      },
      (item) => item.point.v,
    );
  }

  if (range === "month") {
    return groupInOrder(
      parsed,
      (item) => `${item.date.getFullYear()}-${item.date.getMonth()}`,
      (item) => `Thg ${item.date.getMonth() + 1}`,
      (item) => item.point.v,
    );
  }

  return groupInOrder(
    parsed,
    (item) => String(item.date.getFullYear()),
    (item) => String(item.date.getFullYear()),
    (item) => item.point.v,
  );
}

/**
 * Người dùng mới: nguồn là 12 mốc THEO THÁNG. Không thể tách nhỏ hơn tháng nên
 * "Ngày"/"Tuần" vẫn hiển thị theo tháng — dùng {@link isUserGrowthRangeExact}
 * để báo cho người xem biết.
 */
export function bucketUserGrowth(
  points: UserGrowthPoint[],
  range: DashboardRange,
): TrendPoint[] {
  if (range === "year") {
    return groupInOrder(
      points,
      (point) => String(point.year),
      (point) => String(point.year),
      (point) => point.u,
    );
  }

  return points.map((point) => ({
    label: point.m,
    value: point.u,
    sourceCount: 1,
  }));
}

/** false khi mốc yêu cầu mịn hơn dữ liệu backend trả về (tháng). */
export function isUserGrowthRangeExact(range: DashboardRange) {
  return range === "month" || range === "year";
}

export function getCheckInGranularityLabel(range: DashboardRange) {
  switch (range) {
    case "day":
      return "Theo ngày";
    case "week":
      return "Theo tuần";
    case "month":
      return "Theo tháng";
    default:
      return "Theo năm";
  }
}
