import { NextRequest } from "next/server";
import { forwardRouteRequest } from "./proxy";

export async function GET(request: NextRequest) {
  return forwardRouteRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return forwardRouteRequest(request, "POST");
}
