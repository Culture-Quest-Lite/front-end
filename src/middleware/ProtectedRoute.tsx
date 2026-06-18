"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "curator";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();

  // Tạm thời comment phân quyền để test
  // useEffect(() => {
  //   const session = getAuthSession();
  //
  //   // Không authenticated - redirect to login
  //   if (!session) {
  //     router.push("/");
  //     return;
  //   }
  //
  //   // Tạm thời bỏ phân quyền - chỉ cần check có session
  // }, [router]);

  return <>{children}</>;
}
