import { NextRequest } from "next/server";

import { forwardStoriesRequest } from "./proxy";

export async function GET(request: NextRequest) {
  return forwardStoriesRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return forwardStoriesRequest(request, "POST");
}

export async function PUT(request: NextRequest) {
  return forwardStoriesRequest(request, "PUT");
}

export async function DELETE(request: NextRequest) {
  return forwardStoriesRequest(request, "DELETE");
}
