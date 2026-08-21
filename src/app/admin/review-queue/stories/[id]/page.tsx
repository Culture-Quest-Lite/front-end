import { notFound } from "next/navigation";

import { AdminStoryDetailClient } from "./AdminStoryDetailClient";

function parseStoryDetailId(value: string) {
  const normalizedId = value.trim();

  if (!/^\d+$/.test(normalizedId)) {
    return null;
  }

  const storyId = Number(normalizedId);
  if (!Number.isInteger(storyId) || storyId <= 0) {
    return null;
  }

  return storyId;
}

export default async function AdminTagReviewStoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const storyId = parseStoryDetailId(id);

  if (!storyId) {
    notFound();
  }

  return <AdminStoryDetailClient storyId={storyId} />;
}
