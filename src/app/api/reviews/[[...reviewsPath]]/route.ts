import { NextRequest } from "next/server";

import { forwardReviewsRequest } from "../proxy";

type ReviewsRouteContext = {
  params: Promise<{ reviewsPath?: string[] }> | { reviewsPath?: string[] };
};

async function resolveReviewsPath(context: ReviewsRouteContext) {
  const { reviewsPath } = await Promise.resolve(context.params);
  return reviewsPath ?? [];
}

export async function GET(request: NextRequest, context: ReviewsRouteContext) {
  return forwardReviewsRequest(request, "GET", await resolveReviewsPath(context));
}

export async function POST(request: NextRequest, context: ReviewsRouteContext) {
  return forwardReviewsRequest(request, "POST", await resolveReviewsPath(context));
}

export async function PUT(request: NextRequest, context: ReviewsRouteContext) {
  return forwardReviewsRequest(request, "PUT", await resolveReviewsPath(context));
}

export async function PATCH(request: NextRequest, context: ReviewsRouteContext) {
  return forwardReviewsRequest(request, "PATCH", await resolveReviewsPath(context));
}

export async function DELETE(request: NextRequest, context: ReviewsRouteContext) {
  return forwardReviewsRequest(request, "DELETE", await resolveReviewsPath(context));
}
