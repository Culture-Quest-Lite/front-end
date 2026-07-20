import { NextRequest } from "next/server";

import { forwardAdminRequest } from "../proxy";

type AdminRouteContext = {
  params: Promise<{ adminPath: string[] }> | { adminPath: string[] };
};

async function resolveAdminPath(context: AdminRouteContext) {
  const { adminPath } = await Promise.resolve(context.params);
  return adminPath ?? [];
}

export async function GET(request: NextRequest, context: AdminRouteContext) {
  return forwardAdminRequest(request, "GET", await resolveAdminPath(context));
}

export async function POST(request: NextRequest, context: AdminRouteContext) {
  return forwardAdminRequest(request, "POST", await resolveAdminPath(context));
}

export async function PUT(request: NextRequest, context: AdminRouteContext) {
  return forwardAdminRequest(request, "PUT", await resolveAdminPath(context));
}

export async function PATCH(request: NextRequest, context: AdminRouteContext) {
  return forwardAdminRequest(request, "PATCH", await resolveAdminPath(context));
}

export async function DELETE(request: NextRequest, context: AdminRouteContext) {
  return forwardAdminRequest(request, "DELETE", await resolveAdminPath(context));
}
