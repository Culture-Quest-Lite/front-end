import { NextRequest } from "next/server";

import { forwardPostsRequest } from "../proxy";

type PostsRouteContext = {
  params: Promise<{ postsPath?: string[] }> | { postsPath?: string[] };
};

async function resolvePostsPath(context: PostsRouteContext) {
  const { postsPath } = await Promise.resolve(context.params);
  return postsPath ?? [];
}

export async function GET(request: NextRequest, context: PostsRouteContext) {
  return forwardPostsRequest(request, "GET", await resolvePostsPath(context));
}

export async function POST(request: NextRequest, context: PostsRouteContext) {
  return forwardPostsRequest(request, "POST", await resolvePostsPath(context));
}

export async function PUT(request: NextRequest, context: PostsRouteContext) {
  return forwardPostsRequest(request, "PUT", await resolvePostsPath(context));
}

export async function DELETE(request: NextRequest, context: PostsRouteContext) {
  return forwardPostsRequest(request, "DELETE", await resolvePostsPath(context));
}
