import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { voterCookie } from "@/lib/auth";
import { getPoll, hasVoted, isClosed, isUuid } from "@/lib/store";
import { VoteForm } from "@/components/VoteForm";

export const dynamic = "force-dynamic";

export default async function PollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const poll = await getPoll(id);
  if (!poll) notFound();
  if (await hasVoted(id, (await cookies()).get(voterCookie)?.value)) redirect(`/polls/${id}/results`);
  return <main className="shell narrow-page"><Link className="back-link" href="/">← 투표 목록</Link><div className="vote-card"><div className="vote-card-header"><span className="overline">CAST YOUR VOTE</span><span className={`status ${isClosed(poll) ? "status-closed" : "status-open"}`}>{isClosed(poll) ? "마감" : "진행 중"}</span></div><h1>{poll.question}</h1><p className="vote-subtitle">가장 마음에 드는 선택지를 하나 골라 주세요.</p><VoteForm poll={poll} /><div className="vote-note">{poll.closesAt ? `마감: ${new Date(poll.closesAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "full", timeStyle: "short" })}` : "마감 시간 없음"}<br />익명으로 참여하며, 같은 브라우저에서는 한 번만 투표할 수 있습니다.</div></div></main>;
}
