"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Users, User } from "lucide-react";

const items = [
  { href: "/", label: "지도", icon: Map },
  { href: "/community", label: "커뮤니티", icon: Users },
  { href: "/me", label: "마이", icon: User },
] as const;

const baseItemClassName =
  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-2 text-xs font-semibold transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]";

const activeItemClassName = "bg-primary text-white shadow-card";

const inactiveItemClassName = "text-ink-muted hover:bg-surface hover:text-ink";

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto grid h-16 w-full max-w-md grid-cols-3 gap-1 px-3 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`${baseItemClassName} ${
                active ? activeItemClassName : inactiveItemClassName
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="truncate leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
