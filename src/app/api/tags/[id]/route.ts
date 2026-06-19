import { NextRequest } from "next/server";

import { forwardTagRequest } from "../proxy";

export async function GET(request: NextRequest) {
  return forwardTagRequest(request, "GET");
}

export async function PUT(request: NextRequest) {
  return forwardTagRequest(request, "PUT");
}

export async function DELETE(request: NextRequest) {
  return forwardTagRequest(request, "DELETE");
}
