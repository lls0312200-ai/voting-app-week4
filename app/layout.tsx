import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "모아 — 함께 만드는 선택", description: "동아리와 작은 모임을 위한 간단한 투표 앱" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>
    <header className="site-header"><div className="shell header-inner"><Link className="brand" href="/" aria-label="모아, 첫 화면"><span className="brand-mark">✳</span><span>모아<span className="brand-dot">.</span></span></Link><nav aria-label="주 메뉴"><Link href="/">투표 보기</Link><Link href="/admin">운영자</Link></nav><span className="author-badge">만든 사람 <strong>이이삭</strong></span></div></header>
    {children}
    <footer className="site-footer"><div className="shell footer-inner"><span><strong>모아.</strong> 함께 만드는 선택</span><span>Created by 이이삭 · Week 04 Project</span></div></footer>
  </body></html>;
}
