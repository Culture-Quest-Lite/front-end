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
    const response = await fetch(`/api/users/${userId}`, {
      method: "GET",
      credentials: "include",
      headers: {
        accept: "application/json",
      },
    });
    const responseText = await response.text();

    if (!response.ok) {
      return null;
    }

    return safeParseUser(responseText);
  },
};

function safeParseUser(value: string) {
  try {
    return JSON.parse(value) as BackendUser;
  } catch {
    return null;
  }
}
