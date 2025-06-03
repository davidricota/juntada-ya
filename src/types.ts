import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type EventType = {
  id: string;
  name: string;
  access_code: string;
  host_id: string;
  created_at: string;
};

export type Participant = {
  id: string;
  name: string;
  whatsapp_number: string;
};

export type ParticipantChangePayload = RealtimePostgresChangesPayload<{
  id: string;
  name: string;
  whatsapp_number: string;
  event_id: string;
  created_at: string;
}>;

export type PlaylistItem = {
  id: string;
  event_id: string;
  youtube_video_id: string;
  title: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  added_by_participant_id: string;
  added_at: string;
  participant_name?: string;
};

export type PlaylistChangePayload = RealtimePostgresChangesPayload<{
  id: string;
  event_id: string;
  youtube_video_id: string;
  title: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  added_by_participant_id: string;
  added_at: string;
}>;

export type Poll = {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  created_by_participant_id: string;
  created_at: string;
  closed_at: string | null;
  allow_multiple_votes: boolean;
};

export type PollOption = {
  id: string;
  poll_id: string;
  title: string;
  created_at: string;
};

export type PollVote = {
  id: string;
  poll_id: string;
  option_id: string;
  participant_id: string;
  created_at: string;
};
