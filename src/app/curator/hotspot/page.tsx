"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function CuratorHotspotPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!session || session.role !== "curator")) {
      router.push("/");
    }
  }, [loading, router, session]);

  if (loading) {
    return <div className="p-8">Đang kiểm tra quyền truy cập...</div>;
  }

  if (!session) {
    return <div className="p-8">Bạn cần đăng nhập để truy cập trang Curator.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Curator Hotspot</h1>
      <p className="mt-3 text-zinc-600">Đây là trang dành cho Curator.</p>
    </div>
  );
}
