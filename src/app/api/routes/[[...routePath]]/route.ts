import { NextRequest } from "next/server";
import { forwardRouteRequest } from "../proxy";

type RouteParams = {
  params: Promise<{ routePath?: string[] }>;
};

async function getPathSegments(params: RouteParams["params"]) {
  const resolved = await params;
  return resolved.routePath ?? [];
}
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return forwardRouteRequest(request, "PATCH", await getPathSegments(params));
}
export async function GET(request: NextRequest, { params }: RouteParams) {
  return forwardRouteRequest(request, "GET", await getPathSegments(params));
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return forwardRouteRequest(request, "POST", await getPathSegments(params));
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return forwardRouteRequest(request, "PUT", await getPathSegments(params));
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return forwardRouteRequest(request, "DELETE", await getPathSegments(params));
}
