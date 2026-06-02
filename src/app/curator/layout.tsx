// app/curator/layout.tsx

import { CuratorLayout } from "@/components/curator/CuratorLayout";
import type { ReactNode } from "react";

export default function CuratorLayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <CuratorLayout>{children}</CuratorLayout>;
}
