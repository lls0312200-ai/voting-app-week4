"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Poll } from "@/lib/store";

export function VoteForm({ poll }: { poll: Poll }) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const closed = poll.closesAt !== null && new Date(poll.closesAt).getTime() <= now;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || closed) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/polls/${poll.id}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ optionId: selected }) });
      const data = await response.json();
      if (response.status === 409) { router.push(`/polls/${poll.id}/results`); router.refresh(); return; }
      if (!response.ok) throw new Error(data.error || "투표를 저장할 수 없습니다.");
      router.push(data.resultsUrl); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "투표를 저장할 수 없습니다."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit}><fieldset className="vote-options" disabled={closed || busy} aria-label="투표 선택지">{poll.options.map((option) => <label className={`vote-option ${selected === option.id ? "selected" : ""}`} key={option.id}><input type="radio" name="option" value={option.id} checked={selected === option.id} onChange={() => setSelected(option.id)} /><span className="radio-mark" /><span>{option.label}</span></label>)}</fieldset>{closed && <p className="form-error" role="status">마감된 투표입니다. 더 이상 참여할 수 없습니다.</p>}{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark button-wide vote-submit" type="submit" disabled={!selected || closed || busy}>{closed ? "투표 마감" : busy ? "제출 중..." : "이 선택지에 투표하기 →"}</button></form>;
}
