"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/use-login";
import { sampleAccounts } from "@/lib/auth";

export default function LoginPage() {
  const { login, loading, error, success } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const result = await login({ email, password });
      if (result.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/curator");
      }
    } catch {
      // Error state đã được hiển thị bởi useLogin
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8 dark:bg-black">
      <main className="w-full max-w-md rounded-3xl bg-white px-8 py-10 shadow-xl shadow-zinc-200/30 dark:bg-zinc-950 dark:shadow-none">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">Đăng nhập</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Sử dụng email và mật khẩu để truy cập màn hình tương ứng với role.
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="password">
              Mật khẩu
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              {success}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>

        <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          <div className="font-semibold">Tài khoản mẫu</div>
          <ul className="mt-2 space-y-2">
            {sampleAccounts.map((account) => (
              <li key={account.email}>
                <span className="font-medium">{account.email}</span> / <span>{account.password}</span> → <span className="capitalize">{account.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
