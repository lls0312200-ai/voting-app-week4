import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { adminCookie, isAdminSession, voterCookie } from "@/lib/auth";
import { getPoll, hasVoted, isUuid } from "@/lib/store";
import { ResultsChart } from "@/components/ResultsChart";

export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const poll = await getPoll(id);
  if (!poll) notFound();
  const jar = await cookies();
  const admin = isAdminSession(jar.get(adminCookie)?.value);
  if (!admin && !await hasVoted(id, jar.get(voterCookie)?.value)) redirect(`/polls/${id}`);
  return <main className="shell narrow-page"><Link className="back-link" href="/">← 투표 목록</Link><div className="result-card"><span className="overline">THE RESULTS ARE IN</span><h1>{poll.question}</h1><p>우리의 선택은 어떤 모습일까요? 결과는 4초마다 갱신됩니다.</p><ResultsChart initialPoll={poll} /><div className="result-footer"><span>{admin ? "운영자 결과 미리보기" : "참여해 주셔서 감사합니다!"}</span><Link href="/">다른 투표 보기 →</Link></div></div></main>;
}
