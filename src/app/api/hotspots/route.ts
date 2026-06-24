import { NextRequest } from "next/server";

import { forwardHotspotRequest } from "./proxy";

export async function GET(request: NextRequest) {
  return forwardHotspotRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return forwardHotspotRequest(request, "POST");
}
