import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  ACCESS_TOKEN_COOKIE_KEY,
  extractUserFromToken,
  getRedirectPathForRole,
} from "@/lib/access-control";
import type { ReactNode } from "react";

export default async function AdminLayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_KEY)?.value;

  if (!accessToken) {
    redirect("/");
  }

  const session = extractUserFromToken(accessToken);

  if (!session) {
    redirect("/");
  }

  if (session.role !== "admin") {
    redirect(getRedirectPathForRole(session.role) ?? "/");
  }

  return (
    <AdminLayout>{children}</AdminLayout>
  );
}
