import { notFound } from "next/navigation";

import { renderHotspotDetailPage } from "../../hotspot/[slug]/page";
import { HotspotDetailNetworkSync } from "./HotspotDetailNetworkSync";

export default async function HotspotDetailByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hotspotId = parseHotspotId(id);

  if (!hotspotId) {
    notFound();
  }

  const detailPage = await renderHotspotDetailPage({ hotspotId });

  return (
    <>
      <HotspotDetailNetworkSync hotspotId={hotspotId} />
      {detailPage}
    </>
  );
}

function parseHotspotId(value: string) {
  const hotspotId = Number(value.trim());

  if (!Number.isInteger(hotspotId) || hotspotId <= 0) {
    return null;
  }

  return hotspotId;
}
