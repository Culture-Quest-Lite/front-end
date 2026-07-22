import { NextRequest } from "next/server";

import { forwardHotspotRequest, proxyHotspotMediaRequest } from "./proxy";

export async function GET(request: NextRequest) {
  const mediaUrl = request.nextUrl.searchParams.get("mediaUrl");

  if (mediaUrl) {
    return proxyHotspotMediaRequest(request, mediaUrl);
  }

  return forwardHotspotRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return forwardHotspotRequest(request, "POST");
}
