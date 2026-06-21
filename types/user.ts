export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  trust_score: number;
  created_at: string;
}
