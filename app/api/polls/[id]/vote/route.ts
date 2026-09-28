import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { voterCookie, cookieOptions } from "@/lib/auth";
import { error, readJson, validOrigin } from "@/lib/http";
import { castVote, isUuid } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  if (!validOrigin(request)) return error("허용되지 않은 요청입니다.", 403);
  const { id } = await params;
  if (!isUuid(id)) return error("잘못된 투표 주소입니다.", 400);
  try {
    const body = await readJson(request) as { optionId?: unknown };
    if (typeof body?.optionId !== "string" || !isUuid(body.optionId)) return error("선택지를 골라 주세요.");
    const previous = request.cookies.get(voterCookie)?.value;
    const voterId = previous && isUuid(previous) ? previous : randomUUID();
    const result = await castVote(id, body.optionId, voterId);
    if (result === "duplicate") return error("이미 참여한 투표입니다. 결과를 확인해 주세요.", 409);
    if (result === "closed") return error("마감된 투표입니다.", 403);
    if (result === "missing") return error("투표 또는 선택지를 찾을 수 없습니다.", 404);
    const response = NextResponse.json({ ok: true, resultsUrl: `/polls/${id}/results` });
    if (!previous || !isUuid(previous)) response.cookies.set(voterCookie, voterId, { ...cookieOptions(request), maxAge: 60 * 60 * 24 * 365 });
    return response;
  } catch (cause) {
    if (cause instanceof Error && cause.message.startsWith("JSON")) return error(cause.message);
    return error("투표를 저장할 수 없습니다.", 503);
  }
}
