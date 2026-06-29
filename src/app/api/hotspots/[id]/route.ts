import { NextRequest } from "next/server";

import { forwardHotspotRequest } from "../proxy";

type HotspotRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

async function resolveHotspotPath(
  request: NextRequest,
  context: HotspotRouteContext,
) {
  const { id } = await Promise.resolve(context.params);
  const subresource = request.headers.get("x-hotspot-subresource");

  if (subresource?.trim().toLowerCase() === "status") {
    return [id, "status"];
  }

  return [id];
}

export async function GET(request: NextRequest, context: HotspotRouteContext) {
  return forwardHotspotRequest(
    request,
    "GET",
    await resolveHotspotPath(request, context),
  );
}

export async function POST(request: NextRequest, context: HotspotRouteContext) {
  return forwardHotspotRequest(
    request,
    "POST",
    await resolveHotspotPath(request, context),
  );
}

export async function PUT(request: NextRequest, context: HotspotRouteContext) {
  return forwardHotspotRequest(
    request,
    "PUT",
    await resolveHotspotPath(request, context),
  );
}

export async function DELETE(request: NextRequest, context: HotspotRouteContext) {
  return forwardHotspotRequest(
    request,
    "DELETE",
    await resolveHotspotPath(request, context),
  );
}
