"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return <button type="button" className="button button-light" onClick={async () => { await fetch("/api/logout", { method: "POST" }); router.push("/"); router.refresh(); }}>로그아웃</button>;
}
