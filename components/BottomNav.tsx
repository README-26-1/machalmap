"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, MessageSquare, Sparkles, User, Users } from "lucide-react";

const items = [
  { href: "/", label: "지도", icon: Map },
  { href: "/recommendations", label: "추천", icon: Sparkles },
  { href: "/community", label: "커뮤니티", icon: Users },
  { href: "/messages", label: "귓속말", icon: MessageSquare },
  { href: "/me", label: "마이", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-line bg-white">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs ${
              active ? "text-primary" : "text-ink-muted"
            }`}
          >
            <Icon size={22} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
