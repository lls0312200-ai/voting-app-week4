import { NextRequest, NextResponse } from "next/server";
import { adminCookie, cookieOptions, makeSession, verifyPassword } from "@/lib/auth";
import { error, readJson, validOrigin } from "@/lib/http";

export async function POST(request: NextRequest) {
  if (!validOrigin(request)) return error("허용되지 않은 요청입니다.", 403);
  try {
    const body = await readJson(request) as { password?: unknown };
    if (!verifyPassword(body?.password)) return error("비밀번호가 올바르지 않습니다.", 401);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminCookie, makeSession(), { ...cookieOptions(request), maxAge: 86400 });
    return response;
  } catch (cause) {
    return error(cause instanceof Error ? cause.message : "로그인할 수 없습니다.", 503);
  }
}
