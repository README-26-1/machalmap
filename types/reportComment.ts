export interface ReportComment {
  id: string;
  report_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  author_nickname: string;
}
