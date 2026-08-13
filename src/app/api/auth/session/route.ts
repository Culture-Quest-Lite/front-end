import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE_KEY,
  extractUserFromToken,
} from "@/lib/access-control";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_KEY)?.value;
  const session = accessToken ? extractUserFromToken(accessToken) : null;

  return NextResponse.json(
    { session },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
