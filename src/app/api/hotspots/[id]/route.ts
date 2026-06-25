import { NextRequest } from "next/server";

import { forwardHotspotRequest } from "../proxy";

type HotspotRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

async function resolveHotspotPath(context: HotspotRouteContext) {
  const { id } = await Promise.resolve(context.params);
  return [id];
}

export async function GET(request: NextRequest, context: HotspotRouteContext) {
  return forwardHotspotRequest(request, "GET", await resolveHotspotPath(context));
}

export async function POST(request: NextRequest, context: HotspotRouteContext) {
  return forwardHotspotRequest(request, "POST", await resolveHotspotPath(context));
}

export async function PUT(request: NextRequest, context: HotspotRouteContext) {
  return forwardHotspotRequest(request, "PUT", await resolveHotspotPath(context));
}

export async function DELETE(request: NextRequest, context: HotspotRouteContext) {
  return forwardHotspotRequest(request, "DELETE", await resolveHotspotPath(context));
}
