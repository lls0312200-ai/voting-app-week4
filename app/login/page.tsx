import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { adminCookie, isAdminSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  if (isAdminSession((await cookies()).get(adminCookie)?.value)) redirect("/admin");
  return <main className="shell narrow-page"><Link className="back-link" href="/">← 투표 목록</Link><div className="form-card login-card"><span className="overline">FOR ORGANIZERS</span><h1>운영자 로그인</h1><p>투표를 만들고 관리하려면 운영자 비밀번호를 입력하세요.</p><LoginForm /></div></main>;
}
