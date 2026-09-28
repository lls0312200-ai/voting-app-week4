import { NextRequest, NextResponse } from "next/server";
import { createPoll, listPolls } from "@/lib/store";
import { error, readJson, requireAdmin, validOrigin } from "@/lib/http";

export async function GET() {
  try {
    const polls = await listPolls();
    return NextResponse.json(polls.map(({ id, question, createdAt, closesAt, optionCount }) => ({ id, question, createdAt, closesAt, optionCount })));
  } catch {
    return error("투표 목록을 불러올 수 없습니다. DB 설정을 확인해 주세요.", 503);
  }
}

export async function POST(request: NextRequest) {
  if (!validOrigin(request)) return error("허용되지 않은 요청입니다.", 403);
  if (!requireAdmin(request)) return error("운영자 로그인이 필요합니다.", 401);
  try {
    const id = await createPoll(await readJson(request));
    return NextResponse.json({ id }, { status: 201 });
  } catch (cause) {
    if (cause instanceof Error && /^(질문|선택지|중복된|마감|투표 내용을|JSON)/.test(cause.message)) return error(cause.message);
    return error("투표를 저장할 수 없습니다. DB 설정을 확인해 주세요.", 503);
  }
}
