"use client";

import { useEffect, useState } from "react";
import type { Poll } from "@/lib/store";

export function ResultsChart({ initialPoll }: { initialPoll: Poll }) {
  const [poll, setPoll] = useState(initialPoll);
  const [stale, setStale] = useState(false);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/polls/${initialPoll.id}/results`, { cache: "no-store" });
        if (!response.ok) throw new Error("결과를 갱신하지 못했습니다.");
        const data = await response.json() as { poll: Poll };
        if (active) { setPoll(data.poll); setStale(false); }
      } catch { if (active) setStale(true); }
    };
    const timer = window.setInterval(refresh, 4000);
    return () => { active = false; window.clearInterval(timer); };
  }, [initialPoll.id]);
  const total = poll.options.reduce((sum, option) => sum + option.voteCount, 0);
  return <section className="results" aria-label="투표 결과"><div className="results-total"><div><span className="overline">TOTAL VOTES</span><strong>{total}<small>표</small></strong></div><span className="live-chip"><i /> {stale ? "갱신 대기" : "실시간 결과"}</span></div>{total === 0 && <p className="zero-votes">아직 투표가 없습니다. 첫 번째 선택을 기다리고 있어요.</p>}<div className="bar-list">{poll.options.map((option, index) => { const percent = total === 0 ? 0 : Math.round(option.voteCount / total * 1000) / 10; return <div className="bar-item" key={option.id}><div className="bar-label"><span><b className="bar-index">{String(index + 1).padStart(2, "0")}</b>{option.label}</span><strong>{percent}%</strong></div><div className="bar-track" role="progressbar" aria-label={option.label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className="bar-fill" style={{ width: `${percent}%` }} /></div><span className="bar-count">{option.voteCount}표</span></div>; })}</div></section>;
}
