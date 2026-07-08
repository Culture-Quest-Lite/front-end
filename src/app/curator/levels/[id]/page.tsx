import { notFound } from "next/navigation";

import { LevelEditorForm } from "../LevelEditorForm";

function parseLevelId(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default async function EditLevelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const levelId = parseLevelId(id);

  if (!levelId) {
    notFound();
  }

  return <LevelEditorForm mode="edit" levelId={levelId} />;
}
