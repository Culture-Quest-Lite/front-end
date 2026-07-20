"use client";

import { useCallback, useState } from "react";
import {
  createSessionFromToken,
  saveAccessToken,
} from "@/lib/auth";
import { loginUser, type LoginCredentials } from "@/lib/api";

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const login = useCallback(async ({ username, password }: LoginCredentials) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await loginUser({ username, password });
      saveAccessToken(response.accessToken, response.expiresIn);

      const session = createSessionFromToken(response.accessToken);
      if (!session) {
        throw new Error("Không thể xử lý thông tin người dùng.");
      }

      setSuccess("Đăng nhập thành công. Đang chuyển hướng...\n");
      return session;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Không thể kết nối đến API";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, loading, error, success } as const;
}
