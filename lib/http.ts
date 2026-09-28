import { NextRequest, NextResponse } from "next/server";
import { adminCookie, isAdminSession } from "./auth";

export const error = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
export const requireAdmin = (request: NextRequest) => isAdminSession(request.cookies.get(adminCookie)?.value);
export const validOrigin = (request: NextRequest) => {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return ["http:", "https:"].includes(url.protocol) && url.host === request.headers.get("host");
  } catch {
    return false;
  }
};

export async function readJson(request: NextRequest): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("JSON 요청만 사용할 수 있습니다.");
  try { return await request.json(); }
  catch { throw new Error("JSON 형식을 확인해 주세요."); }
}
