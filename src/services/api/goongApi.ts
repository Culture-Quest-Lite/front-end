import { decodePolyline } from "@/lib/polyline";

const GOONG_API_BASE_URL = "https://rsapi.goong.io";

const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_API_KEY ?? "";

type GoongAutocompleteResponse = {
  predictions?: Array<{
    place_id?: string;
    description?: string;
    structured_formatting?: {
      main_text?: string;
      secondary_text?: string;
    };
  }>;
  status?: string;
  error_message?: string;
};

type GoongPlaceDetailResponse = {
  result?: {
    place_id?: string;
    formatted_address?: string;
    name?: string;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  };
  status?: string;
  error_message?: string;
};

export interface GoongPlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface GoongAutocompleteResult {
  predictions: GoongPlaceSuggestion[];
}

export interface GoongPlaceDetail {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

type GoongDirectionResponse = {
  routes?: Array<{
    overview_polyline?: {
      points?: string;
    };
    legs?: Array<{
      distance?: {
        value?: number;
      };
      duration?: {
        value?: number;
      };
      steps?: Array<{
        polyline?: {
          points?: string;
        };
      }>;
    }>;
  }>;
  status?: string;
  error_message?: string;
};

export type GoongDirectionVehicle = "car" | "bike" | "taxi" | "truck" | "hd";

export interface GoongDirectionPoint {
  latitude: number;
  longitude: number;
}

export interface GoongDirectionResult {
  /** Toạ độ men theo đường thật, dạng [longitude, latitude]. */
  coordinates: Array<[number, number]>;
  distanceMeters: number | null;
  durationSeconds: number | null;
}

export const goongApi = {
  searchPlaces: async (input: string): Promise<GoongAutocompleteResult> => {
    const response = await fetchGoong<GoongAutocompleteResponse>(
      "/Place/AutoComplete",
      { input },
    );

    if (response.status && response.status !== "OK") {
      throw new Error(
        response.error_message?.trim() ||
          `Goong trả về trạng thái ${response.status}.`,
      );
    }

    const predictions = Array.isArray(response.predictions)
      ? response.predictions
          .filter(
            (prediction) =>
              typeof prediction.place_id === "string" &&
              prediction.place_id.trim() &&
              typeof prediction.description === "string" &&
              prediction.description.trim(),
          )
          .slice(0, 6)
          .map((prediction) => ({
            placeId: prediction.place_id!.trim(),
            description: prediction.description!.trim(),
            mainText:
              prediction.structured_formatting?.main_text?.trim() ||
              prediction.description!.trim(),
            secondaryText:
              prediction.structured_formatting?.secondary_text?.trim() || "",
          }))
      : [];

    return { predictions };
  },

  getPlaceDetail: async (placeId: string): Promise<GoongPlaceDetail> => {
    const response = await fetchGoong<GoongPlaceDetailResponse>(
      "/Place/Detail",
      { place_id: placeId },
    );

    if (response.status && response.status !== "OK") {
      throw new Error(
        response.error_message?.trim() ||
          `Goong trả về trạng thái ${response.status}.`,
      );
    }

    const resolvedPlaceId = response.result?.place_id?.trim() ?? "";
    const address = response.result?.formatted_address?.trim() ?? "";
    const latitude = response.result?.geometry?.location?.lat;
    const longitude = response.result?.geometry?.location?.lng;

    if (
      !resolvedPlaceId ||
      !address ||
      typeof latitude !== "number" ||
      !Number.isFinite(latitude) ||
      typeof longitude !== "number" ||
      !Number.isFinite(longitude)
    ) {
      throw new Error(
        "Goong không trả về đủ địa chỉ hoặc tọa độ cho địa điểm đã chọn.",
      );
    }

    return {
      placeId: resolvedPlaceId,
      name: response.result?.name?.trim() ?? address,
      address,
      latitude,
      longitude,
    };
  },

  getDirections: async ({
    origin,
    destination,
    vehicle = "car",
  }: {
    origin: GoongDirectionPoint;
    destination: GoongDirectionPoint;
    vehicle?: GoongDirectionVehicle;
  }): Promise<GoongDirectionResult> => {
    const response = await fetchGoong<GoongDirectionResponse>("/Direction", {
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      vehicle,
    });

    if (response.status && response.status !== "OK") {
      throw new Error(
        response.error_message?.trim() ||
          `Goong trả về trạng thái ${response.status}.`,
      );
    }

    const route = response.routes?.[0];

    if (!route) {
      throw new Error("Goong không tìm được lộ trình giữa hai địa điểm này.");
    }

    const legs = route.legs ?? [];
    const stepCoordinates = legs.flatMap((leg) =>
      (leg.steps ?? []).flatMap((step) =>
        decodePolyline(step.polyline?.points ?? ""),
      ),
    );
    const coordinates =
      stepCoordinates.length > 1
        ? stepCoordinates
        : decodePolyline(route.overview_polyline?.points ?? "");

    if (coordinates.length < 2) {
      throw new Error("Goong không trả về hình dạng đường đi cho lộ trình.");
    }

    const distanceMeters = sumLegValues(
      legs.map((leg) => leg.distance?.value),
    );
    const durationSeconds = sumLegValues(
      legs.map((leg) => leg.duration?.value),
    );

    return {
      coordinates,
      distanceMeters,
      durationSeconds,
    };
  },
};

function sumLegValues(values: Array<number | undefined>) {
  const numericValues = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );

  if (numericValues.length === 0) {
    return null;
  }

  return numericValues.reduce((sum, value) => sum + value, 0);
}

async function fetchGoong<T>(path: string, searchParams: Record<string, string>) {
  const apiKey = GOONG_API_KEY.trim();
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GOONG_API_KEY chưa được cấu hình.");
  }

  const url = new URL(path, GOONG_API_BASE_URL);
  for (const [key, value] of Object.entries(searchParams)) {
    if (value.trim()) {
      url.searchParams.set(key, value);
    }
  }
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  const responseText = await response.text();
  const responseBody = safeParseJson(responseText);

  if (!response.ok) {
    throw new Error(
      extractGoongErrorMessage(responseBody) || "Không thể kết nối Goong.",
    );
  }

  return responseBody as T;
}

function extractGoongErrorMessage(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybeError = value as {
    error_message?: unknown;
    status?: unknown;
  };

  if (
    typeof maybeError.error_message === "string" &&
    maybeError.error_message.trim()
  ) {
    return maybeError.error_message;
  }

  if (
    typeof maybeError.status === "string" &&
    maybeError.status.trim() &&
    maybeError.status !== "OK"
  ) {
    return `Goong trả về trạng thái ${maybeError.status}.`;
  }

  return null;
}

function safeParseJson(value: string) {
  try {
    return value ? (JSON.parse(value) as unknown) : null;
  } catch {
    return null;
  }
}
