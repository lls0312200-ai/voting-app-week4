import { NextRequest, NextResponse } from "next/server";
import { adminCookie, isAdminSession, voterCookie } from "@/lib/auth";
import { error } from "@/lib/http";
import { getPoll, hasVoted, isUuid } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!isUuid(id)) return error("잘못된 투표 주소입니다.", 400);
  try {
    const poll = await getPoll(id);
    if (!poll) return error("투표를 찾을 수 없습니다.", 404);
    const admin = isAdminSession(request.cookies.get(adminCookie)?.value);
    if (!admin && !await hasVoted(id, request.cookies.get(voterCookie)?.value)) return error("투표 후 결과를 볼 수 있습니다.", 403);
    const totalVotes = poll.options.reduce((sum, option) => sum + option.voteCount, 0);
    return NextResponse.json({ poll, totalVotes }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("결과를 불러올 수 없습니다.", 503);
  }
}
