import { AdminLayout } from "@/components/admin/AdminLayout";
import type { ReactNode } from "react";

export default function AdminLayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
