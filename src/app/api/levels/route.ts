import { NextRequest } from "next/server";

import { forwardLevelRequest } from "./proxy";

export async function GET(request: NextRequest) {
  return forwardLevelRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return forwardLevelRequest(request, "POST");
}
