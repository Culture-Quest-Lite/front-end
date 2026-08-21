import { notFound } from "next/navigation";

import { parseTagDetailId } from "@/lib/tags";

import { AdminTagDetailClient } from "./AdminTagDetailClient";

export default async function AdminTagReviewTagDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tagId = parseTagDetailId(id);

  if (!tagId) {
    notFound();
  }

  return <AdminTagDetailClient tagId={tagId} />;
}
