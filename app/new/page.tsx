import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { adminCookie, isAdminSession } from "@/lib/auth";
import { NewPollForm } from "@/components/NewPollForm";

export default async function NewPage() {
  if (!isAdminSession((await cookies()).get(adminCookie)?.value)) redirect("/login");
  return <main className="shell narrow-page"><Link className="back-link" href="/admin">← 운영자 공간</Link><div className="form-card"><span className="overline">CREATE A POLL</span><h1>새 투표 만들기</h1><p>질문과 선택지를 입력하고 필요한 경우 마감 시간을 정하세요.</p><NewPollForm /></div></main>;
}
