import { apiFetch } from "@/lib/api";

const CHECK_IN_RADIUS_PATH = "/api/configs/check-in-radius";

export interface CheckInRadiusConfig {
  minRadius: number;
  maxRadius: number;
  defaultRadius: number;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface UpdateCheckInRadiusPayload {
  minRadius: number;
  maxRadius: number;
  defaultRadius: number;
}

export const configApi = {
  getCheckInRadius: async () => {
    return apiFetch<CheckInRadiusConfig>(CHECK_IN_RADIUS_PATH, {
      method: "GET",
      sameOrigin: true,
    });
  },

  updateCheckInRadius: async (payload: UpdateCheckInRadiusPayload) => {
    return apiFetch<CheckInRadiusConfig>(CHECK_IN_RADIUS_PATH, {
      method: "PUT",
      body: payload,
      sameOrigin: true,
    });
  },
};

export default configApi;
