import { NextRequest } from "next/server";

import { forwardStoriesRequest } from "../proxy";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ storiesPath: string[] }> },
) {
  const { storiesPath } = await context.params;
  return forwardStoriesRequest(request, "GET", storiesPath);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ storiesPath: string[] }> },
) {
  const { storiesPath } = await context.params;
  return forwardStoriesRequest(request, "DELETE", storiesPath);
}
