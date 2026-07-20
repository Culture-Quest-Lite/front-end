import { NextRequest } from "next/server";

import { forwardLevelRequest } from "../proxy";

type LevelRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: LevelRouteContext) {
  const { id } = await context.params;
  return forwardLevelRequest(request, "GET", [id]);
}

export async function PUT(request: NextRequest, context: LevelRouteContext) {
  const { id } = await context.params;
  return forwardLevelRequest(request, "PUT", [id]);
}

export async function DELETE(request: NextRequest, context: LevelRouteContext) {
  const { id } = await context.params;
  return forwardLevelRequest(request, "DELETE", [id]);
}
