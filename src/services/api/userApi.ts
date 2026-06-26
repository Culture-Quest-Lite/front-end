export interface BackendUser {
  userId: number;
  username?: string;
  email?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  backgroundUrl?: string | null;
  totalXp?: number;
  totalPoints?: number;
  autoPlayAudio?: boolean;
  isPremium?: boolean;
  status?: string;
  levelName?: string;
  role?: string;
  createdAt?: string;
  totalFollowers?: number;
  totalFollowing?: number;
  totalPosts?: number;
}

export const userApi = {
  getUserById: async (userId: number) => {
    const controller = new AbortController();
    const TIMEOUT_MS = 3000; // abort slow profile requests after 3s
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const start = Date.now();
      const response = await fetch(`/api/users/${userId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - start;
      const responseText = await response.text();

      if (!response.ok) {
        console.debug(`[userApi] getUserById ${userId} failed`, {
          status: response.status,
          duration,
        });
        return null;
      }

      console.debug(`[userApi] getUserById ${userId} success`, { duration });
      return safeParseUser(responseText);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        console.warn(
          `[userApi] getUserById ${userId} timed out after ${TIMEOUT_MS}ms`,
        );
        return null;
      }

      console.error(`[userApi] getUserById ${userId} error`, error);
      return null;
    }
  },
};

function safeParseUser(value: string) {
  try {
    return JSON.parse(value) as BackendUser;
  } catch {
    return null;
  }
}
