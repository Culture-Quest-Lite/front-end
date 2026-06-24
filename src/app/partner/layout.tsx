import { PartnerLayout } from "@/components/partner/PartnerLayout";
import type { ReactNode } from "react";

export default function PartnerLayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <PartnerLayout>{children}</PartnerLayout>;
}   