import { NextRequest, NextResponse } from "next/server";
import { adminCookie, cookieOptions } from "@/lib/auth";
import { error, validOrigin } from "@/lib/http";

export async function POST(request: NextRequest) {
  if (!validOrigin(request)) return error("허용되지 않은 요청입니다.", 403);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie, "", { ...cookieOptions(request), maxAge: 0 });
  return response;
}
