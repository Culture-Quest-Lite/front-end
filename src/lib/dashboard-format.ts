/**
 * Helper định dạng dùng chung cho dashboard Admin và Curator.
 *
 * Backend trả `changePercent`/`completionRate`/`averageRating` là `null` khi
 * KHÔNG tính được (mẫu số bằng 0), khác hẳn với giá trị 0. Các hàm dưới đây
 * giữ đúng phân biệt đó thay vì `?? 0` — hiển thị "+0%" khi thực ra không có
 * dữ liệu nền để so sánh là sai lệch.
 */

const numberFormatter = new Intl.NumberFormat("vi-VN");

export function formatCount(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return numberFormatter.format(value);
}

/**
 * Phần trăm THAY ĐỔI, có dấu để thấy tăng/giảm.
 * VD: 12.5 -> "+12,5%", -3 -> "-3%", null -> null.
 */
export function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${numberFormatter.format(value)}%`;
}

/**
 * Phần trăm TỈ LỆ (VD tỉ lệ hoàn thành tuyến) — không có dấu, vì "+45%" cho
 * một tỉ lệ sẽ bị hiểu nhầm thành mức tăng trưởng.
 */
export function formatRate(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${numberFormatter.format(value)}%`;
}

/**
 * Dòng phụ của StatCard. Khi không so sánh được thì nói rõ lý do thay vì
 * bịa ra "+0%".
 */
export function formatChangeLabel(
  percent: number | null | undefined,
  comparedTo: string,
  fallback = "Chưa đủ dữ liệu so sánh",
) {
  const formatted = formatPercent(percent);
  return formatted ? `${formatted} ${comparedTo}` : fallback;
}

export function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${numberFormatter.format(value)} ₫`;
}

/** Rút gọn tiền cho StatCard: 12.500.000 -> "12,5 Tr". */
export function formatCompactCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  if (Math.abs(value) >= 1_000_000_000) {
    return `${numberFormatter.format(Math.round(value / 100_000_000) / 10)} Tỷ`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${numberFormatter.format(Math.round(value / 100_000) / 10)} Tr`;
  }
  return formatCurrency(value);
}

export function formatRating(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return numberFormatter.format(value);
}
