"use client";

import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "curator";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  void requiredRole;

  return <>{children}</>;
}
