"use client";

/**
 * Loader dùng chung cho Goong JS (tải từ CDN, không dùng bản npm).
 *
 * Tách ra khỏi GoongMapPreview để CheckInZoneEditor dùng lại cùng một singleton —
 * nếu mỗi component tự giữ promise riêng thì script sẽ bị tải hai lần.
 */

export const GOONG_MAP_JS_URL =
  "https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.js";
export const GOONG_MAP_CSS_URL =
  "https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.css";
export const GOONG_MAP_STYLE_URL =
  "https://tiles.goong.io/assets/goong_map_web.json";

export const GOONG_MAPTILES_KEY =
  process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY?.trim() ||
  process.env.NEXT_PUBLIC_GOONG_API_KEY?.trim() ||
  "";

export type GoongLngLat = { lng: number; lat: number };

export type GoongMapInstance = {
  addControl: (control: unknown, position?: string) => void;
  addLayer: (layer: Record<string, unknown>) => void;
  addSource: (id: string, source: Record<string, unknown>) => void;
  flyTo: (options: { center: [number, number]; zoom?: number; essential?: boolean }) => void;
  fitBounds: (
    bounds: [[number, number], [number, number]],
    options?: { padding?: number; duration?: number; maxZoom?: number },
  ) => void;
  getLayer: (id: string) => unknown;
  getSource: (id: string) => { setData: (data: unknown) => void } | undefined;
  isStyleLoaded?: () => boolean;
  off: (event: string, handler: (event?: unknown) => void) => void;
  on: (event: string, handler: (event?: unknown) => void) => void;
  remove: () => void;
  removeLayer: (id: string) => void;
  removeSource: (id: string) => void;
  resize: () => void;
  getCanvas?: () => HTMLCanvasElement;
};

export type GoongMarkerInstance = {
  addTo: (map: GoongMapInstance) => GoongMarkerInstance;
  getLngLat: () => GoongLngLat;
  on?: (event: string, handler: () => void) => void;
  remove?: () => void;
  setLngLat: (lngLat: [number, number]) => GoongMarkerInstance;
};

export type GoongJsGlobal = {
  accessToken: string;
  Map: new (options: {
    container: HTMLElement;
    style: string;
    center: [number, number];
    zoom: number;
    attributionControl?: boolean;
  }) => GoongMapInstance;
  Marker: new (options?: {
    color?: string;
    draggable?: boolean;
    scale?: number;
    element?: HTMLElement;
  }) => GoongMarkerInstance;
  NavigationControl: new (options?: {
    showCompass?: boolean;
    showZoom?: boolean;
    visualizePitch?: boolean;
  }) => unknown;
};

declare global {
  interface Window {
    goongjs?: GoongJsGlobal;
  }
}

let goongJsLoader: Promise<GoongJsGlobal> | null = null;

function ensureGoongCss() {
  if (
    document.head.querySelector('link[data-goong-map-css="true"]') instanceof
    HTMLLinkElement
  ) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = GOONG_MAP_CSS_URL;
  link.dataset.goongMapCss = "true";
  document.head.appendChild(link);
}

export async function loadGoongJs(): Promise<GoongJsGlobal> {
  if (typeof window === "undefined") {
    throw new Error("Map View chỉ khả dụng trên trình duyệt.");
  }

  if (window.goongjs) {
    ensureGoongCss();
    return window.goongjs;
  }

  if (!goongJsLoader) {
    goongJsLoader = new Promise<GoongJsGlobal>((resolve, reject) => {
      ensureGoongCss();

      const existingScript = document.head.querySelector(
        'script[data-goong-map-script="true"]',
      );

      if (existingScript instanceof HTMLScriptElement) {
        existingScript.addEventListener(
          "load",
          () => {
            if (window.goongjs) {
              resolve(window.goongjs);
              return;
            }
            reject(new Error("Goong JS đã tải xong nhưng không khởi tạo được."));
          },
          { once: true },
        );
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Không thể tải Goong JS từ CDN.")),
          { once: true },
        );
        return;
      }

      const script = document.createElement("script");
      script.src = GOONG_MAP_JS_URL;
      script.async = true;
      script.dataset.goongMapScript = "true";
      script.addEventListener("load", () => {
        if (window.goongjs) {
          resolve(window.goongjs);
          return;
        }
        reject(new Error("Goong JS đã tải xong nhưng không khởi tạo được."));
      });
      script.addEventListener("error", () => {
        reject(new Error("Không thể tải Goong JS từ CDN."));
      });
      document.head.appendChild(script);
    }).catch((error) => {
      goongJsLoader = null;
      throw error;
    });
  }

  return goongJsLoader;
}

export function parseCoordinatePair(latitude: string, longitude: string) {
  const parsedLatitude = Number.parseFloat(latitude);
  const parsedLongitude = Number.parseFloat(longitude);

  if (
    !Number.isFinite(parsedLatitude) ||
    !Number.isFinite(parsedLongitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return null;
  }

  return { latitude: parsedLatitude, longitude: parsedLongitude };
}

export function formatCoordinateValue(value: number) {
  return value.toFixed(6).replace(/\.?0+$/, "");
}
