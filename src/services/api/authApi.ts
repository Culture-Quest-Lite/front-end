import { apiFetch } from "@/lib/api";

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface TokenData {
  id: string;
  email: string;
  name: string;
  role: "admin" | "curator" | "explorer";
  token: string;
}

type SupportedRole = TokenData["role"];

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface OAuthLoginRequest {
  code: string;
  redirectUri: string;
}

// Đăng nhập
export const authApi = {
  // Đăng nhập với username/password
  login: async (
    username: string,
    password: string
  ): Promise<LoginResponse> => {
    return apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      headers: {
        "X-Client-Type": "web",
      },
      body: { username, password },
      sameOrigin: true,
    });
  },

  // Đăng ký tài khoản
  register: async (data: RegisterRequest) => {
    return apiFetch("/api/auth/register", {
      method: "POST",
      body: data,
      sameOrigin: true,
    });
  },

  // Xác thực email bằng OTP
  verifyOtp: async (data: VerifyOtpRequest) => {
    return apiFetch("/api/auth/verify-otp", {
      method: "POST",
      body: data,
      sameOrigin: true,
    });
  },

  // Gửi lại OTP
  resendOtp: async (data: ResendOtpRequest) => {
    return apiFetch("/api/auth/resend-otp", {
      method: "POST",
      body: data,
      sameOrigin: true,
    });
  },

  // Đăng xuất
  logout: async () => {
    return apiFetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "X-Client-Type": "web",
      },
      sameOrigin: true,
    });
  },

  // Yêu cầu reset mật khẩu
  forgotPassword: async (data: ForgotPasswordRequest) => {
    return apiFetch("/api/auth/forgot-password", {
      method: "POST",
      body: data,
      sameOrigin: true,
    });
  },

  // Reset mật khẩu bằng token
  resetPassword: async (data: ResetPasswordRequest) => {
    return apiFetch("/api/auth/reset-password", {
      method: "POST",
      body: data,
      sameOrigin: true,
    });
  },

  // Đổi mật khẩu (khi đã đăng nhập)
  changePassword: async (data: ChangePasswordRequest) => {
    return apiFetch("/api/auth/change-password", {
      method: "POST",
      body: data,
      sameOrigin: true,
    });
  },

  // Đăng nhập Google OAuth2
  loginByGoogle: async (data: OAuthLoginRequest) => {
    return apiFetch("/api/auth/login-by-google", {
      method: "POST",
      headers: {
        "X-Client-Type": "web",
      },
      body: data,
      sameOrigin: true,
    });
  },

  // Đăng nhập Facebook OAuth2
  loginByFacebook: async (data: OAuthLoginRequest) => {
    return apiFetch("/api/auth/login-by-facebook", {
      method: "POST",
      headers: {
        "X-Client-Type": "web",
      },
      body: data,
      sameOrigin: true,
    });
  },
};

// Parse JWT token
export function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to parse JWT:", error);
    return null;
  }
}

// Extract user info from access token
export function extractUserFromToken(accessToken: string): Omit<TokenData, "token"> | null {
  const decoded = parseJwt(accessToken);
  if (!decoded) {
    console.error("Failed to decode token");
    return null;
  }

  const role = extractRoleFromClaims(decoded) ?? "explorer";

  const userInfo = {
    id: decoded.sub || decoded.id || "",
    email: decoded.email || "",
    name: decoded.preferred_username || decoded.name || "",
    role,
  };

  return userInfo;
}

function extractRoleFromClaims(decoded: Record<string, unknown>): SupportedRole | null {
  const claimValues: string[] = [];

  pushClaimStrings(claimValues, decoded.role);
  pushClaimStrings(claimValues, decoded.roles);
  pushClaimStrings(claimValues, decoded.authorities);
  pushClaimStrings(claimValues, decoded.groups);
  pushClaimStrings(claimValues, decoded.scope);
  pushClaimStrings(claimValues, decoded.scp);

  if (isObjectRecord(decoded.realm_access)) {
    pushClaimStrings(claimValues, decoded.realm_access.roles);
    pushClaimStrings(claimValues, decoded.realm_access.authorities);
  }

  if (isObjectRecord(decoded.resource_access)) {
    for (const resourceData of Object.values(decoded.resource_access)) {
      if (!isObjectRecord(resourceData)) {
        continue;
      }

      pushClaimStrings(claimValues, resourceData.roles);
      pushClaimStrings(claimValues, resourceData.authorities);
      pushClaimStrings(claimValues, resourceData.scope);
      pushClaimStrings(claimValues, resourceData.scp);
    }
  }

  return detectSupportedRole(claimValues);
}

function pushClaimStrings(target: string[], value: unknown) {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (trimmedValue) {
      target.push(trimmedValue);
    }
    return;
  }

  if (!Array.isArray(value)) {
    return;
  }

  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const trimmedItem = item.trim();
    if (trimmedItem) {
      target.push(trimmedItem);
    }
  }
}

function detectSupportedRole(values: string[]): SupportedRole | null {
  if (values.some((value) => matchesRole(value, "admin"))) {
    return "admin";
  }

  if (values.some((value) => matchesRole(value, "curator"))) {
    return "curator";
  }

  if (values.some((value) => matchesRole(value, "explorer"))) {
    return "explorer";
  }

  return null;
}

function matchesRole(value: string, role: SupportedRole) {
  const escapedRole = role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundaryPattern = new RegExp(
    `(?:^|[\\s,;:/._-])${escapedRole}(?:$|[\\s,;:/._-])`,
    "i"
  );

  return boundaryPattern.test(value);
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export default authApi;
