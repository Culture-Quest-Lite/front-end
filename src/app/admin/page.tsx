"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function AdminPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!session || session.role !== "admin")) {
      router.push("/");
    }
  }, [loading, router, session]);

  if (loading) {
    return <div className="cq-page-subtitle p-8">Đang kiểm tra quyền truy cập...</div>;
  }

  if (!session) {
    return <div className="cq-page-subtitle p-8">Bạn cần đăng nhập để truy cập trang Admin.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="cq-page-title">Admin Dashboard</h1>
      <p className="cq-page-subtitle mt-3 text-zinc-600">Xin chào, {session.name}</p>
      <p className="cq-page-subtitle mt-2 text-zinc-500">Email: {session.email}</p>
      <p className="cq-card-copy mt-4 text-zinc-700">Bạn đang xem giao diện dành riêng cho role <strong>Admin</strong>.</p>
    </div>
  );
}
