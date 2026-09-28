"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "로그인할 수 없습니다.");
      router.push("/admin"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "로그인할 수 없습니다."); }
    finally { setBusy(false); }
  }
  return <form className="stack-form" onSubmit={submit}><label htmlFor="password">운영자 비밀번호</label><input id="password" type="password" autoComplete="current-password" required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호를 입력하세요" />{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark button-wide" type="submit" disabled={busy}>{busy ? "확인 중..." : "로그인하기"}</button></form>;
}
