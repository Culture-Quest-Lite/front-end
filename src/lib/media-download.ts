const HOTSPOT_MEDIA_PROXY_PATH = "/api/hotspots";

export async function downloadMediaBlob(fileUrl: string) {
  const searchParams = new URLSearchParams({ mediaUrl: fileUrl });
  const response = await fetch(
    `${HOTSPOT_MEDIA_PROXY_PATH}?${searchParams.toString()}`,
    {
      cache: "no-store",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(`Media download failed with status ${response.status}`);
  }

  return response.blob();
}
