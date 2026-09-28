import { NextRequest, NextResponse } from "next/server";
import { deletePoll, getPoll, isUuid } from "@/lib/store";
import { error, requireAdmin, validOrigin } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!isUuid(id)) return error("잘못된 투표 주소입니다.", 400);
  try {
    const poll = await getPoll(id);
    if (!poll) return error("투표를 찾을 수 없습니다.", 404);
    return NextResponse.json({
      id: poll.id, question: poll.question, createdAt: poll.createdAt,
      closesAt: poll.closesAt,
      options: poll.options.map(({ id: optionId, label }) => ({ id: optionId, label })),
    });
  } catch {
    return error("투표를 불러올 수 없습니다.", 503);
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  if (!validOrigin(request)) return error("허용되지 않은 요청입니다.", 403);
  if (!requireAdmin(request)) return error("운영자 로그인이 필요합니다.", 401);
  const { id } = await params;
  if (!isUuid(id)) return error("잘못된 투표 주소입니다.", 400);
  try {
    if (!await deletePoll(id)) return error("투표를 찾을 수 없습니다.", 404);
    return NextResponse.json({ ok: true });
  } catch {
    return error("투표를 삭제할 수 없습니다.", 503);
  }
}
