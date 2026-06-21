export interface Friend {
  id: string;
  nickname: string;
  trust_score: number;
  status: "pending" | "accepted";
  direction: "sent" | "received" | "friend";
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender_nickname?: string;
}
