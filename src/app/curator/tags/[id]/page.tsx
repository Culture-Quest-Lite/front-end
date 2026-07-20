import { notFound } from "next/navigation";

import { parseTagDetailId } from "@/lib/tags";

import { TagDetailClient } from "./TagDetailClient";

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tagId = parseTagDetailId(id);

  if (!tagId) {
    notFound();
  }

  return <TagDetailClient tagId={tagId} />;
}
