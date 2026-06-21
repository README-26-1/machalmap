"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, User, Users } from "lucide-react";

const navItems = [
  { href: "/", label: "지도", icon: Map },
  { href: "/community", label: "커뮤니티", icon: Users },
  { href: "/me", label: "마이", icon: User },
] as const;

// 데스크톱 전용 상단 네비게이션 바 (md 이상에서만 표시). 모바일은 AppMenu(버거)가 담당.
export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-40 hidden h-14 items-center border-b border-line bg-white/95 backdrop-blur md:flex">
      <div className="mx-auto flex w-full max-w-6xl items-center px-6">
        <Link href="/" className="text-lg font-bold text-primary">
          마찰지도
        </Link>

        <nav className="ml-8 flex items-center gap-1" aria-label="주요 메뉴">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-ink-muted hover:bg-surface hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/login"
          className="ml-auto rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface"
        >
          로그인
        </Link>
      </div>
    </header>
  );
}
