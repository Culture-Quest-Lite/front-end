import { NextRequest } from "next/server";

import { forwardUserRequest } from "../proxy";

type UserRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

async function resolveUserPath(context: UserRouteContext) {
  const { id } = await Promise.resolve(context.params);
  return [id];
}

export async function GET(request: NextRequest, context: UserRouteContext) {
  return forwardUserRequest(request, "GET", await resolveUserPath(context));
}
