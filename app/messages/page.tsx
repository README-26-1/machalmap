"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, UserPlus } from "lucide-react";
import Button from "@/components/Button";
import { apiGet, apiSend } from "@/lib/api";
import { DirectMessage, Friend } from "@/types/social";

export default function MessagesPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");

  const selected = useMemo(
    () => friends.find((friend) => friend.id === selectedId),
    [friends, selectedId]
  );
  const acceptedFriends = friends.filter((friend) => friend.status === "accepted");

  async function loadFriends() {
    const data = await apiGet<Friend[]>("/api/friends");
    setFriends(data);
    if (!selectedId && data.some((friend) => friend.status === "accepted")) {
      setSelectedId(data.find((friend) => friend.status === "accepted")?.id ?? "");
    }
  }

  async function loadMessages(peerId = selectedId) {
    if (!peerId) return setMessages([]);
    const data = await apiGet<DirectMessage[]>(`/api/messages?peer_id=${peerId}`);
    setMessages(data);
  }

  useEffect(() => {
    loadFriends().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMessages().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  async function addFriend() {
    if (!nickname.trim()) return alert("친구 닉네임을 입력해 주세요.");
    try {
      await apiSend("/api/friends", "POST", { nickname });
      setNickname("");
      await loadFriends();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function accept(friend: Friend) {
    try {
      await apiSend("/api/friends", "PATCH", { friend_id: friend.id });
      await loadFriends();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function send() {
    if (!selectedId || !content.trim()) return;
    try {
      await apiSend("/api/messages", "POST", { receiver_id: selectedId, content });
      setContent("");
      await loadMessages();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <main className="mx-auto max-w-md p-4 pb-24">
      <h1 className="mb-4 text-lg font-bold">귓속말</h1>

      <section className="mb-4 rounded-md bg-surface p-4 shadow-card">
        <h2 className="mb-2 text-sm font-semibold">친구 추가</h2>
        <div className="flex gap-2">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            className="h-11 flex-1 rounded-md border border-line px-3 text-sm"
          />
          <Button onClick={addFriend} className="h-11 px-3">
            <UserPlus size={17} />
          </Button>
        </div>
      </section>

      <section className="mb-4">
        <h2 className="mb-2 text-sm font-semibold">친구</h2>
        {friends.length === 0 ? (
          <p className="rounded-md bg-surface p-4 text-center text-sm text-ink-muted">
            닉네임으로 친구를 추가해 보세요.
          </p>
        ) : (
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {friends.map((friend) => (
              <li key={`${friend.id}-${friend.direction}`}>
                <button
                  onClick={() => friend.status === "accepted" && setSelectedId(friend.id)}
                  className={`min-w-24 rounded-md border px-3 py-2 text-left text-sm ${
                    selectedId === friend.id ? "border-primary bg-white" : "border-line bg-surface"
                  }`}
                >
                  <span className="block font-semibold">{friend.nickname}</span>
                  <span className="text-xs text-ink-muted">
                    {friend.status === "accepted"
                      ? "친구"
                      : friend.direction === "received"
                        ? "요청 받음"
                        : "요청 중"}
                  </span>
                </button>
                {friend.direction === "received" && (
                  <button onClick={() => accept(friend)} className="mt-1 text-xs text-primary">
                    수락
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-md bg-white shadow-card">
        <div className="border-b border-line p-3 text-sm font-semibold">
          {selected ? selected.nickname : acceptedFriends.length === 0 ? "친구를 먼저 추가하세요" : "친구 선택"}
        </div>
        <div className="h-72 space-y-2 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <p className="pt-20 text-center text-sm text-ink-muted">아직 메시지가 없습니다.</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="rounded-md bg-surface p-3">
                <p className="text-xs text-ink-muted">{message.sender_nickname ?? "나"}</p>
                <p className="text-sm">{message.content}</p>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2 border-t border-line p-3">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="귓속말 입력"
            disabled={!selected}
            className="h-11 flex-1 rounded-md border border-line px-3 text-sm disabled:bg-surface"
          />
          <Button onClick={send} disabled={!selected} className="h-11 px-3">
            <Send size={17} />
          </Button>
        </div>
      </section>
    </main>
  );
}
