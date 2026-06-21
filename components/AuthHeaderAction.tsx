"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthHeaderAction() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setAuthed(!!data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
      setBusy(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setBusy(false);
      alert(error.message);
      return;
    }
    setAuthed(false);
    router.push("/");
    router.refresh();
  }

  const className =
    "rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink disabled:opacity-60";

  if (authed === null) {
    return <span className={className}>...</span>;
  }

  if (authed) {
    return (
      <button type="button" onClick={logout} disabled={busy} className={className}>
        로그아웃
      </button>
    );
  }

  return (
    <Link href="/login" className={className}>
      로그인
    </Link>
  );
}
