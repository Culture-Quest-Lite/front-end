"use client";

import { useCallback, useState } from "react";
import { mockLogin, saveAuthSession, type LoginCredentials } from "@/lib/auth";

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const login = useCallback(async ({ email, password }: LoginCredentials) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await mockLogin({ email, password });
      saveAuthSession(result);
      setSuccess("Đăng nhập thành công. Đang chuyển hướng...\n");
      return result;
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
