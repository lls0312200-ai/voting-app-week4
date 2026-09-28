import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { adminCookie, isAdminSession } from "@/lib/auth";
import { isClosed, listPolls } from "@/lib/store";
import { DeletePollButton } from "@/components/DeletePollButton";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isAdminSession((await cookies()).get(adminCookie)?.value)) redirect("/login");
  let polls: Awaited<ReturnType<typeof listPolls>> = [];
  let error = "";
  try { polls = await listPolls(); } catch { error = "투표 목록을 불러오지 못했습니다. DB 설정을 확인해 주세요."; }
  return <main className="shell content-page"><div className="page-heading"><div><span className="overline">ORGANIZER DESK</span><h1>운영자 공간</h1><p>새 투표를 만들고 진행 상황을 관리하세요.</p></div><div className="heading-actions"><Link className="button button-dark" href="/new">+ 새 투표 만들기</Link><LogoutButton /></div></div>
    <div className="summary-row"><div><span>전체 투표</span><strong>{polls.length}</strong></div><div><span>진행 중</span><strong>{polls.filter((poll) => !isClosed(poll)).length}</strong></div><div><span>누적 참여</span><strong>{polls.reduce((sum, poll) => sum + poll.totalVotes, 0)}</strong></div></div>
    <div className="section-heading compact"><div><span className="overline">POLL MANAGEMENT</span><h2>투표 관리</h2></div></div>
    {error ? <div className="notice error" role="alert">{error}</div> : polls.length === 0 ? <div className="empty-state"><h3>아직 만든 투표가 없습니다</h3><p>첫 투표를 만들고 구성원에게 링크를 공유해 보세요.</p></div> : <div className="admin-list">{polls.map((poll) => <article className="admin-item" key={poll.id}><div><div className="admin-item-meta"><span className={`status ${isClosed(poll) ? "status-closed" : "status-open"}`}>{isClosed(poll) ? "마감" : "진행 중"}</span><span>{poll.optionCount}개 선택지 · {poll.totalVotes}표</span></div><h3>{poll.question}</h3><p>{poll.closesAt ? `마감 ${new Date(poll.closesAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" })}` : "마감 시간 없음"}</p></div><div className="admin-item-actions"><Link href={`/polls/${poll.id}/results`}>결과 보기</Link><Link href={`/polls/${poll.id}`}>투표 화면</Link><DeletePollButton id={poll.id} question={poll.question} /></div></article>)}</div>}
  </main>;
}
