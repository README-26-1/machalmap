"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Menu, User, Users, X } from "lucide-react";

const menuItems = [
  { href: "/", label: "지도", icon: Map },
  { href: "/community", label: "커뮤니티", icon: Users },
  { href: "/me", label: "마이", icon: User },
] as const;

const menuPanelId = "app-navigation-menu";

const itemClassName =
  "flex h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export default function AppMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default bg-transparent md:hidden"
          aria-label="메뉴 닫기"
          onClick={() => setOpen(false)}
        />
      )}

      <nav className="fixed bottom-4 left-4 z-50 md:hidden" aria-label="주요 메뉴">
        {open && (
          <div
            id={menuPanelId}
            className="mb-3 w-52 rounded-lg border border-line bg-white/95 p-2 shadow-float backdrop-blur supports-[backdrop-filter]:bg-white/90"
          >
            {menuItems.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`${itemClassName} ${
                    active ? "bg-primary text-white" : "text-ink hover:bg-surface"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        )}

        <button
          type="button"
          aria-controls={menuPanelId}
          aria-expanded={open}
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          className="flex h-14 w-14 items-center justify-center rounded-lg bg-white text-ink shadow-float transition-transform duration-150 ease-out hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </nav>
    </>
  );
}
