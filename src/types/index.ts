export interface EventType {
  id: string;
  name: string;
  access_code: string;
  created_at: string;
  host_user_id: string;
}

export interface Participant {
  id: string;
  event_id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Expense {
  id: string;
  event_id: string;
  paid_by_participant_id: string;
  participant_name: string;
  title: string;
  amount: number;
  created_at: string;
}

export interface ExpenseSummary {
  total: number;
  perPerson: number;
  participants: {
    id: string;
    name: string;
    paid: number;
    owes: number;
    receives: number;
  }[];
}

export interface ExpenseChangePayload {
  eventType: "INSERT" | "DELETE";
  new?: Expense;
  old?: Expense;
}

export interface Poll {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  created_by_user_id: string;
  created_at: string;
  closed_at?: string;
  allow_multiple_votes: boolean;
}

export interface PollOption {
  id: string;
  poll_id: string;
  title: string;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}
export interface PollChangePayload {
  eventType: "INSERT" | "DELETE";
  new?: Poll;
  old?: Poll;
}

export interface PlaylistItem {
  id: string;
  event_id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string;
  channel_title: string;
  added_by_participant_id: string;
  added_at: string;
  participant_name: string;
}

export interface ParticipantChangePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Participant;
  old: Participant;
}

export interface PlaylistChangePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: PlaylistItem;
  old: PlaylistItem;
}
