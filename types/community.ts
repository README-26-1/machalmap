export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  report_id: string | null;
  like_count: number;
  created_at: string;
  author_nickname?: string;
  comment_count?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_nickname?: string;
}
