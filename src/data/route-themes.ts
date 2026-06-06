export type RouteThemeStatus = "active" | "draft" | "archived";

export type RouteTheme = {
  id: string;
  title: string;
  description: string;
  visualKey?: string;
  accentColor?: string;
  createdAt?: string;
  distance: string;
  duration: string;
  distanceOffsetKm: number;
  durationOffsetMinutes: number;
  status: RouteThemeStatus;
  statusLabel: string;
  routeCount: number;
  curator: string;
  lastUpdated: string;
  insight: string;
};

export const ROUTE_THEME_STORAGE_KEY = "culturequest:curator-route-themes";
export const ROUTE_THEME_STORAGE_EVENT =
  "culturequest:curator-route-themes-change";

export const routeThemeStatusOptions: Array<{
  value: RouteThemeStatus;
  label: string;
}> = [
  { value: "active", label: "Đang dùng" },
  { value: "draft", label: "Bản nháp" },
  { value: "archived", label: "Lưu trữ" },
];

export const routeThemeStatusClasses: Record<RouteThemeStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft: "border-amber-200 bg-amber-50 text-amber-800",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
};

export const curatorRouteThemes: RouteTheme[] = [
  {
    id: "timeline",
    title: "Dòng thời gian lịch sử",
    description: "Logic sắp xếp tự động dựa trên dòng thời gian lịch sử.",
    distance: "~3.1 km",
    duration: "~120 phút",
    distanceOffsetKm: 0.8,
    durationOffsetMinutes: 30,
    status: "active",
    statusLabel: "Đang dùng",
    routeCount: 4,
    curator: "Thu Hà",
    lastUpdated: "26/5/2025",
    insight: "Phù hợp các tuyến cần nhịp kể chuyện theo mốc sự kiện.",
  },
  {
    id: "geo",
    title: "Tối ưu địa lý",
    description: "Logic sắp xếp tự động dựa trên tối ưu địa lý.",
    distance: "~2.2 km",
    duration: "~95 phút",
    distanceOffsetKm: 0.4,
    durationOffsetMinutes: 18,
    status: "active",
    statusLabel: "Đang dùng",
    routeCount: 3,
    curator: "Lan Anh",
    lastUpdated: "24/5/2025",
    insight: "Giảm quãng di chuyển, phù hợp route đi bộ ngắn trong nội đô.",
  },
  {
    id: "culture",
    title: "Chủ đề văn hoá",
    description: "Logic sắp xếp tự động dựa trên chủ đề văn hoá.",
    distance: "~2.8 km",
    duration: "~110 phút",
    distanceOffsetKm: 0.55,
    durationOffsetMinutes: 24,
    status: "active",
    statusLabel: "Đang dùng",
    routeCount: 5,
    curator: "Minh Quân",
    lastUpdated: "25/5/2025",
    insight: "Hợp với tuyến kết nối kiến trúc, tín ngưỡng và nhịp sống đô thị.",
  },
  {
    id: "character",
    title: "Hành trình nhân vật",
    description: "Logic sắp xếp tự động dựa trên hành trình nhân vật.",
    distance: "~4.0 km",
    duration: "~145 phút",
    distanceOffsetKm: 1.05,
    durationOffsetMinutes: 38,
    status: "draft",
    statusLabel: "Bản nháp",
    routeCount: 2,
    curator: "Thu Hà",
    lastUpdated: "22/5/2025",
    insight: "Mạnh khi muốn gom các hotspot quanh một nhân vật hoặc vai trò lịch sử.",
  },
  {
    id: "story",
    title: "Chuỗi câu chuyện",
    description: "Logic sắp xếp tự động dựa trên chuỗi câu chuyện.",
    distance: "~3.5 km",
    duration: "~130 phút",
    distanceOffsetKm: 0.9,
    durationOffsetMinutes: 28,
    status: "archived",
    statusLabel: "Lưu trữ",
    routeCount: 1,
    curator: "Hữu Phước",
    lastUpdated: "18/5/2025",
    insight: "Phù hợp tuyến giàu chất kể nhưng cần biên tập nội dung kỹ hơn.",
  },
];
let cachedStoredRouteThemesSnapshot = curatorRouteThemes;
let cachedStoredRouteThemesRaw: string | null | undefined;

export function getRouteThemeStatusLabel(status: RouteThemeStatus) {
  return (
    routeThemeStatusOptions.find((option) => option.value === status)?.label ??
    "Bản nháp"
  );
}

export function buildRouteThemeId(title: string) {
  const normalized = title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || `theme-${Date.now()}`;
}

function isRouteThemeStatus(value: unknown): value is RouteThemeStatus {
  return value === "active" || value === "draft" || value === "archived";
}

function isRouteTheme(value: unknown): value is RouteTheme {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RouteTheme>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    (candidate.visualKey === undefined || typeof candidate.visualKey === "string") &&
    (candidate.accentColor === undefined ||
      typeof candidate.accentColor === "string") &&
    (candidate.createdAt === undefined || typeof candidate.createdAt === "string") &&
    typeof candidate.distance === "string" &&
    typeof candidate.duration === "string" &&
    typeof candidate.distanceOffsetKm === "number" &&
    typeof candidate.durationOffsetMinutes === "number" &&
    isRouteThemeStatus(candidate.status) &&
    typeof candidate.statusLabel === "string" &&
    typeof candidate.routeCount === "number" &&
    typeof candidate.curator === "string" &&
    typeof candidate.lastUpdated === "string" &&
    typeof candidate.insight === "string"
  );
}

export function sanitizeRouteThemes(input: unknown) {
  if (!Array.isArray(input)) {
    return curatorRouteThemes;
  }

  const themes = input.filter(isRouteTheme).map((theme) => ({
    ...theme,
    statusLabel: getRouteThemeStatusLabel(theme.status),
  }));

  return themes.length > 0 ? themes : curatorRouteThemes;
}

export function readStoredRouteThemes() {
  if (typeof window === "undefined") {
    return curatorRouteThemes;
  }

  const raw = window.localStorage.getItem(ROUTE_THEME_STORAGE_KEY);

  if (!raw) {
    return curatorRouteThemes;
  }

  try {
    return sanitizeRouteThemes(JSON.parse(raw));
  } catch {
    return curatorRouteThemes;
  }
}

export function getStoredRouteThemesSnapshot() {
  if (typeof window === "undefined") {
    return curatorRouteThemes;
  }

  const raw = window.localStorage.getItem(ROUTE_THEME_STORAGE_KEY);

  if (raw === cachedStoredRouteThemesRaw) {
    return cachedStoredRouteThemesSnapshot;
  }

  cachedStoredRouteThemesRaw = raw;

  try {
    cachedStoredRouteThemesSnapshot = raw
      ? sanitizeRouteThemes(JSON.parse(raw))
      : curatorRouteThemes;
  } catch {
    cachedStoredRouteThemesSnapshot = curatorRouteThemes;
  }

  return cachedStoredRouteThemesSnapshot;
}

export function subscribeStoredRouteThemes(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== ROUTE_THEME_STORAGE_KEY) {
      return;
    }

    onStoreChange();
  };

  const handleLocalChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(ROUTE_THEME_STORAGE_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(ROUTE_THEME_STORAGE_EVENT, handleLocalChange);
  };
}

export function writeStoredRouteThemes(themes: RouteTheme[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    ROUTE_THEME_STORAGE_KEY,
    JSON.stringify(
      themes.map((theme) => ({
        ...theme,
        statusLabel: getRouteThemeStatusLabel(theme.status),
      })),
    ),
  );

  window.dispatchEvent(new Event(ROUTE_THEME_STORAGE_EVENT));
}
