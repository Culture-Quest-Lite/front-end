import { apiFetch } from "@/lib/api";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface TokenData {
  id: string;
  email: string;
  name: string;
  role: "admin" | "curator";
  token: string;
  refreshToken?: string;
}

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
  login: async (username: string, password: string): Promise<LoginResponse> => {
    return apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: { username, password },
    });
  },

  // Đăng ký tài khoản
  register: async (data: RegisterRequest) => {
    return apiFetch("/api/auth/register", {
      method: "POST",
      body: data,
    });
  },

  // Xác thực email bằng OTP
  verifyOtp: async (data: VerifyOtpRequest) => {
    return apiFetch("/api/auth/verify-otp", {
      method: "POST",
      body: data,
    });
  },

  // Gửi lại OTP
  resendOtp: async (data: ResendOtpRequest) => {
    return apiFetch("/api/auth/resend-otp", {
      method: "POST",
      body: data,
    });
  },

  // Đăng xuất
  logout: async () => {
    return apiFetch("/api/auth/logout", {
      method: "POST",
    });
  },

  // Yêu cầu reset mật khẩu
  forgotPassword: async (data: ForgotPasswordRequest) => {
    return apiFetch("/api/auth/forgot-password", {
      method: "POST",
      body: data,
    });
  },

  // Reset mật khẩu bằng token
  resetPassword: async (data: ResetPasswordRequest) => {
    return apiFetch("/api/auth/reset-password", {
      method: "POST",
      body: data,
    });
  },

  // Đổi mật khẩu (khi đã đăng nhập)
  changePassword: async (data: ChangePasswordRequest) => {
    return apiFetch("/api/auth/change-password", {
      method: "POST",
      body: data,
    });
  },

  // Đăng nhập Google OAuth2
  loginByGoogle: async (data: OAuthLoginRequest) => {
    return apiFetch("/api/auth/login-by-google", {
      method: "POST",
      body: data,
    });
  },

  // Đăng nhập Facebook OAuth2
  loginByFacebook: async (data: OAuthLoginRequest) => {
    return apiFetch("/api/auth/login-by-facebook", {
      method: "POST",
      body: data,
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
export function extractUserFromToken(accessToken: string): Omit<TokenData, "token" | "refreshToken"> | null {
  const decoded = parseJwt(accessToken);
  if (!decoded) {
    console.error("Failed to decode token");
    return null;
  }

  // Kiểm tra role từ nhiều nơi có thể có
  let role: "admin" | "curator" = "curator"; // default role
  
  // Kiểm tra realm_access.roles (Keycloak format)
  if (decoded.realm_access?.roles && Array.isArray(decoded.realm_access.roles)) {
    if (decoded.realm_access.roles.includes("admin") || decoded.realm_access.roles.includes("ADMIN")) {
      role = "admin";
    } else if (decoded.realm_access.roles.includes("curator") || decoded.realm_access.roles.includes("CURATOR")) {
      role = "curator";
    }
  }
  
  // Kiểm tra resource_access (alternative Keycloak format)
  if (decoded.resource_access && typeof decoded.resource_access === "object") {
    for (const [resourceName, resourceData] of Object.entries(decoded.resource_access)) {
      if (resourceData && typeof resourceData === "object" && "roles" in resourceData) {
        const resourceRoles = (resourceData as any).roles;
        if (Array.isArray(resourceRoles)) {
          if (resourceRoles.includes("admin") || resourceRoles.includes("ADMIN")) {
            role = "admin";
            break;
          }
        }
      }
    }
  }
  
  // Kiểm tra role field trực tiếp
  if (decoded.role) {
    const decodedRole = String(decoded.role).toLowerCase();
    if (decodedRole === "admin") {
      role = "admin";
    } else if (decodedRole === "curator") {
      role = "curator";
    }
  }

  const userInfo = {
    id: decoded.sub || decoded.id || "",
    email: decoded.email || "",
    name: decoded.preferred_username || decoded.name || "",
    role,
  };

  console.debug("Extracted user from token:", { ...userInfo, token: "***" });
  return userInfo;
}

export default authApi;
