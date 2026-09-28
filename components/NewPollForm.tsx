"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewPollForm() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const closesAt = deadline ? new Date(deadline).toISOString() : null;
      const response = await fetch("/api/polls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, options, closesAt }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "투표를 저장할 수 없습니다.");
      router.push(`/polls/${data.id}`); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "투표를 저장할 수 없습니다."); }
    finally { setBusy(false); }
  }
  return <form className="stack-form" onSubmit={submit}>
    <label htmlFor="question">질문 <span className="required">*</span></label><input id="question" required minLength={5} maxLength={200} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="예: 다음 모임은 언제 열까요?" />
    <div className="field-heading"><label>선택지 <span className="required">*</span></label><span>2~10개</span></div>
    {options.map((option, index) => <div className="option-input" key={index}><span>{String(index + 1).padStart(2, "0")}</span><input aria-label={`선택지 ${index + 1}`} required maxLength={100} value={option} onChange={(event) => setOptions((old) => old.map((item, at) => at === index ? event.target.value : item))} placeholder={`선택지 ${index + 1}`} />{options.length > 2 && <button type="button" aria-label={`선택지 ${index + 1} 삭제`} onClick={() => setOptions((old) => old.filter((_, at) => at !== index))}>×</button>}</div>)}
    {options.length < 10 && <button className="add-option" type="button" onClick={() => setOptions((old) => [...old, ""])}>+ 선택지 추가</button>}
    <label htmlFor="deadline">마감 시간 <span className="optional">선택</span></label><input id="deadline" type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} /><p className="field-help">비워두면 마감 없이 진행됩니다. 마감 후에는 투표할 수 없습니다.</p>
    {error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark button-wide" type="submit" disabled={busy}>{busy ? "만드는 중..." : "투표 만들기 →"}</button>
  </form>;
}
