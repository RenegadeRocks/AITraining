export type SessionStatus = "live" | "ended";

export type QuestionStatus =
  | "pending"
  | "answered"
  | "resolved"
  | "escalated"
  | "replied";

export interface SessionRow {
  id: string;
  code: string;
  host_key: string;
  title: string;
  status: SessionStatus;
  created_at: string;
  ended_at: string | null;
}

export interface AttendeeRow {
  id: string;
  session_id: string;
  name: string;
  created_at: string;
}

export interface QuestionRow {
  id: string;
  session_id: string;
  attendee_id: string;
  attendee_name: string;
  body: string;
  ai_answer: string | null;
  status: QuestionStatus;
  host_reply: string | null;
  created_at: string;
  answered_at: string | null;
  resolved_at: string | null;
  escalated_at: string | null;
  replied_at: string | null;
}
