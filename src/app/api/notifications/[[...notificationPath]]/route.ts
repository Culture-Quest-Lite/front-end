import { NextRequest, NextResponse } from "next/server";

const BASE = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
const COOKIE = "culture-quest-access-token";

type Context = { params: Promise<{ notificationPath?: string[] }> | { notificationPath?: string[] } };

async function forward(request: NextRequest, method: "GET" | "PATCH" | "POST", context: Context) {
  const { notificationPath = [] } = await Promise.resolve(context.params);
  const path = notificationPath.length ? `/${notificationPath.join("/")}` : "";
  const headers = new Headers({ accept: "application/json" });
  const auth = request.headers.get("authorization");
  const token = request.cookies.get(COOKIE)?.value;
  if (auth) headers.set("authorization", auth);
  else if (token) headers.set("authorization", `Bearer ${token}`);

  // Forward Content-Type so backend can parse JSON body correctly
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  // Forward request body for POST / PATCH
  let body: string | null = null;
  if (method !== "GET") {
    const text = await request.text();
    if (text) body = text;
  }

  const response = await fetch(`${BASE}/api/notifications${path}${request.nextUrl.search}`, {
    method,
    headers,
    body,
    cache: "no-store",
  });
  const result = new NextResponse(await response.text(), { status: response.status });
  const respContentType = response.headers.get("content-type");
  if (respContentType) result.headers.set("content-type", respContentType);
  result.headers.set("cache-control", "no-store");
  return result;
}

export async function GET(request: NextRequest, context: Context) { return forward(request, "GET", context); }
export async function PATCH(request: NextRequest, context: Context) { return forward(request, "PATCH", context); }

export async function POST(request: NextRequest, context: Context) { return forward(request, "POST", context); }
