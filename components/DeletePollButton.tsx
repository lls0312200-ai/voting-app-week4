"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeletePollButton({ id, question }: { id: string; question: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!window.confirm(`"${question}" 투표와 모든 기록을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/polls/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error || "삭제하지 못했습니다.");
      router.refresh();
    } catch (cause) { window.alert(cause instanceof Error ? cause.message : "삭제하지 못했습니다."); }
    finally { setBusy(false); }
  }
  return <button type="button" className="text-danger" disabled={busy} onClick={remove}>{busy ? "삭제 중..." : "삭제"}</button>;
}
