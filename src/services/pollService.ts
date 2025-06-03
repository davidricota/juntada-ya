import { supabase } from "@/integrations/supabase/client";
import { Poll, PollOption, PollVote } from "@/types";

export class PollService {
  static async getPolls(eventId: string): Promise<Poll[]> {
    const { data, error } = await supabase.from("polls").select("*").eq("event_id", eventId).order("created_at", { ascending: false });

    if (error) throw error;
    return data as Poll[];
  }

  static async getPollOptions(pollId: string): Promise<PollOption[]> {
    const { data, error } = await supabase.from("poll_options").select("*").eq("poll_id", pollId);

    if (error) throw error;
    return data as PollOption[];
  }

  static async getPollVotes(pollId: string): Promise<PollVote[]> {
    const { data, error } = await supabase.from("poll_votes").select("*").eq("poll_id", pollId);

    if (error) throw error;
    return data as PollVote[];
  }

  static async createPoll(
    eventId: string,
    participantId: string,
    pollData: Omit<Poll, "id" | "event_id" | "created_by_participant_id" | "created_at" | "closed_at">
  ): Promise<Poll> {
    const { data, error } = await supabase
      .from("polls")
      .insert({
        event_id: eventId,
        created_by_participant_id: participantId,
        title: pollData.title,
        description: pollData.description,
        allow_multiple_votes: pollData.allow_multiple_votes,
        closed_at: null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Poll;
  }

  static async addPollOption(pollId: string, optionData: Omit<PollOption, "id" | "poll_id" | "created_at">): Promise<PollOption> {
    const { data, error } = await supabase
      .from("poll_options")
      .insert({
        poll_id: pollId,
        title: optionData.title,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PollOption;
  }

  static async vote(pollId: string, optionId: string, participantId: string): Promise<PollVote> {
    const { data, error } = await supabase
      .from("poll_votes")
      .insert({
        poll_id: pollId,
        option_id: optionId,
        participant_id: participantId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PollVote;
  }

  static async removeVote(pollId: string, optionId: string, participantId: string): Promise<void> {
    const { error } = await supabase.from("poll_votes").delete().eq("poll_id", pollId).eq("option_id", optionId).eq("participant_id", participantId);

    if (error) throw error;
  }

  static async closePoll(pollId: string): Promise<void> {
    const { error } = await supabase.from("polls").update({ closed_at: new Date().toISOString() }).eq("id", pollId);
    if (error) throw error;
  }
}
