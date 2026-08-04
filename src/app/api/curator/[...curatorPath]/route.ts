import { NextRequest } from "next/server";

import { forwardCuratorRequest } from "../proxy";

type CuratorRouteContext = {
  params: Promise<{ curatorPath: string[] }> | { curatorPath: string[] };
};

async function resolveCuratorPath(context: CuratorRouteContext) {
  const { curatorPath } = await Promise.resolve(context.params);
  return curatorPath ?? [];
}

export async function GET(request: NextRequest, context: CuratorRouteContext) {
  return forwardCuratorRequest(request, "GET", await resolveCuratorPath(context));
}

export async function POST(request: NextRequest, context: CuratorRouteContext) {
  return forwardCuratorRequest(request, "POST", await resolveCuratorPath(context));
}

export async function PUT(request: NextRequest, context: CuratorRouteContext) {
  return forwardCuratorRequest(request, "PUT", await resolveCuratorPath(context));
}

export async function PATCH(request: NextRequest, context: CuratorRouteContext) {
  return forwardCuratorRequest(request, "PATCH", await resolveCuratorPath(context));
}

export async function DELETE(request: NextRequest, context: CuratorRouteContext) {
  return forwardCuratorRequest(request, "DELETE", await resolveCuratorPath(context));
}
