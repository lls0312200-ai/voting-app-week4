import Link from "next/link";
import { isClosed, listPolls } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  let polls: Awaited<ReturnType<typeof listPolls>> = [];
  let error = "";
  try { polls = await listPolls(); } catch { error = "투표를 불러올 수 없습니다. 데이터베이스 설정을 확인해 주세요."; }
  const openCount = polls.filter((poll) => !isClosed(poll)).length;
  return (
    <main className="shell main-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> OUR VOICE, OUR CHOICE</span>
          <h1>함께 고르면,<br /><em>더 좋은 답이 됩니다.</em></h1>
          <p>동아리의 작은 결정부터 중요한 의견까지. 한 표를 남기고 우리 모두의 선택을 확인해 보세요.</p>
          <div className="hero-actions"><a className="button button-dark" href="#polls">투표 둘러보기 <span aria-hidden="true">↗</span></a><Link className="button button-light" href="/admin">운영자 공간</Link></div>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="art-ring ring-one" /><div className="art-ring ring-two" /><div className="art-card"><span className="art-tag">YOUR VOTE MATTERS</span><span className="art-check">✓</span><strong>당신의 선택이<br />변화를 만듭니다.</strong><span className="art-lines"><i /><i /><i /></span></div><span className="art-spark spark-one">✦</span><span className="art-spark spark-two">✳</span></div>
      </section>
      <section className="section" id="polls">
        <div className="section-heading"><div><span className="overline">CURRENT POLLS</span><h2>지금 진행 중인 투표</h2><p>관심 있는 주제를 골라 당신의 의견을 들려주세요.</p></div><div className="count-chip"><strong>{openCount}</strong><span>진행 중</span></div></div>
        {error ? <div className="notice error" role="alert">{error}</div> : polls.length === 0 ? (
          <div className="empty-state"><span className="empty-symbol">✳</span><h3>아직 등록된 투표가 없습니다</h3><p>운영자 공간에서 첫 투표를 만들어 보세요.</p><Link className="button button-dark" href="/admin">투표 만들기 <span aria-hidden="true">↗</span></Link></div>
        ) : <div className="poll-grid">{polls.map((poll, index) => (
          <Link key={poll.id} href={`/polls/${poll.id}`} className="poll-card"><div className="poll-card-top"><span className="poll-number">{String(index + 1).padStart(2, "0")}</span><span className={`status ${isClosed(poll) ? "status-closed" : "status-open"}`}>{isClosed(poll) ? "마감" : "진행 중"}</span></div><h3>{poll.question}</h3><p>{poll.optionCount}개 선택지 · {poll.closesAt ? `마감 ${new Date(poll.closesAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" })}` : "마감 없음"}</p><span className="card-link">투표하러 가기 <span aria-hidden="true">→</span></span></Link>
        ))}</div>}
      </section>
      <section className="feature-strip"><div><span>01</span><strong>간단하게 참여</strong><p>계정 없이 한 번의 선택으로</p></div><div><span>02</span><strong>함께 보는 결과</strong><p>참여 후 그래프로 한눈에</p></div><div><span>03</span><strong>기한 안에 결정</strong><p>마감 시간을 명확하게</p></div></section>
    </main>
  );
}
