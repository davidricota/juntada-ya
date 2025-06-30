import { supabase } from "@/shared/integrations/supabase/client";
import { Poll, PollChangePayload, PollOption, PollVote } from "@/app/types";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export class PollService {
  static async getPolls(planId: string): Promise<Poll[]> {
    const { data: polls, error } = await supabase
      .from("polls")
      .select("*")
      .eq("event_id", planId)
      .order("created_at", { ascending: false });

    if (error) throw error instanceof Error ? error : new Error(String(error));
    return Array.isArray(polls) ? polls : [];
  }

  static async getPollOptions(pollId: string): Promise<PollOption[]> {
    const { data, error } = await supabase
      .from("poll_options")
      .select("*")
      .eq("poll_id", pollId)
      .order("created_at", { ascending: true });

    if (error) throw error instanceof Error ? error : new Error(String(error));
    return Array.isArray(data) ? data : [];
  }

  static async getPollVotes(pollId: string): Promise<PollVote[]> {
    const { data, error } = await supabase.from("poll_votes").select("*").eq("poll_id", pollId);

    if (error) throw error instanceof Error ? error : new Error(String(error));
    return Array.isArray(data) ? data : [];
  }

  static async createPoll(
    planId: string,
    participantId: string,
    title: string,
    description: string | undefined,
    options: string[],
    allowMultipleVotes: boolean
  ): Promise<Poll> {
    // Crear la encuesta
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        event_id: planId,
        created_by_participant_id: participantId,
        title,
        description,
        allow_multiple_votes: allowMultipleVotes,
      })
      .select()
      .single();

    if (pollError) throw pollError instanceof Error ? pollError : new Error(String(pollError));

    // Crear las opciones
    await Promise.all(
      options.map((text) =>
        supabase.from("poll_options").insert({
          poll_id: poll.id,
          title: text,
        })
      )
    );

    return poll;
  }

  static async vote(pollId: string, participantId: string, optionId: string): Promise<void> {
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("allow_multiple_votes, event_id")
      .eq("id", pollId)
      .single();

    if (pollError) {
      throw new Error("Error al obtener la encuesta");
    }

    const { data: eventParticipant, error: participantError } = await supabase
      .from("event_participants")
      .select("id")
      .eq("event_id", poll.event_id)
      .eq("id", participantId)
      .single();

    if (participantError) {
      throw new Error("Error al verificar el participante");
    }

    if (!eventParticipant) {
      throw new Error("No eres participante de este evento");
    }

    // Verificar si ya existe un voto para esta opción
    const { data: existingVoteForOption, error: checkVoteError } = await supabase
      .from("poll_votes")
      .select("*")
      .eq("poll_id", pollId)
      .eq("participant_id", participantId)
      .eq("option_id", optionId)
      .maybeSingle();

    if (checkVoteError) {
      throw new Error("Error al verificar voto existente");
    }

    if (typeof poll.allow_multiple_votes === "boolean" && poll.allow_multiple_votes) {
      if (existingVoteForOption) {
        // Si ya votó por esta opción, eliminar el voto (toggle)
        const { error: deleteError } = await supabase
          .from("poll_votes")
          .delete()
          .eq("poll_id", pollId)
          .eq("participant_id", participantId)
          .eq("option_id", optionId);

        if (deleteError) {
          throw new Error("Error al eliminar el voto");
        }
      } else {
        // Si no votó por esta opción, agregar el voto
        const { error: insertError } = await supabase.from("poll_votes").insert({
          poll_id: pollId,
          participant_id: participantId,
          option_id: optionId,
        });

        if (insertError) {
          throw new Error("Error al registrar el voto");
        }
      }
    } else {
      // Buscar si existe algún voto del participante en esta encuesta
      const { data: existingVote, error: checkError } = await supabase
        .from("poll_votes")
        .select("*")
        .eq("poll_id", pollId)
        .eq("participant_id", participantId)
        .maybeSingle();

      if (checkError) {
        throw new Error("Error al verificar votos existentes");
      }

      if (existingVote) {
        // Si ya existe un voto, actualizar la opción
        const { error: updateError } = await supabase
          .from("poll_votes")
          .update({ option_id: optionId })
          .eq("poll_id", pollId)
          .eq("participant_id", participantId);

        if (updateError) {
          throw new Error(`Error al actualizar el voto: ${updateError.message}`);
        }
      } else {
        // Si no existe voto, crear uno nuevo
        const { error: insertError } = await supabase.from("poll_votes").insert({
          poll_id: pollId,
          participant_id: participantId,
          option_id: optionId,
        });

        if (insertError) {
          throw new Error("Error al registrar el voto");
        }
      }
    }
  }

  static async closePoll(pollId: string): Promise<void> {
    const { error } = await supabase.from("polls").update({ is_closed: true }).eq("id", pollId);

    if (error) throw error instanceof Error ? error : new Error(String(error));
  }

  static async deletePoll(pollId: string): Promise<void> {
    const { error } = await supabase.from("polls").delete().eq("id", pollId);
    if (error) throw error instanceof Error ? error : new Error(String(error));
  }

  static async addPollOption(
    pollId: string,
    option: Omit<PollOption, "id" | "poll_id" | "created_at">
  ): Promise<PollOption> {
    const { data, error } = await supabase
      .from("poll_options")
      .insert({
        poll_id: pollId,
        ...option,
      })
      .select()
      .single();

    if (error) throw error instanceof Error ? error : new Error(String(error));
    return data;
  }

  static async removePollOption(optionId: string): Promise<void> {
    const { error } = await supabase.from("poll_options").delete().eq("id", optionId);

    if (error) throw error instanceof Error ? error : new Error(String(error));
  }

  static async removeVote(pollId: string, participantId: string, optionId: string): Promise<void> {
    const { data: existingVote, error: checkError } = await supabase
      .from("poll_votes")
      .select("*")
      .eq("poll_id", pollId)
      .eq("participant_id", participantId)
      .eq("option_id", optionId)
      .maybeSingle();

    if (checkError) {
      throw new Error("Error al verificar el voto existente");
    }

    if (!existingVote) {
      throw new Error("No has votado por esta opción");
    }

    const { error } = await supabase
      .from("poll_votes")
      .delete()
      .eq("poll_id", pollId)
      .eq("participant_id", participantId)
      .eq("option_id", optionId);

    if (error) {
      throw new Error("Error al eliminar el voto");
    }
  }

  static async getParticipant(participantId: string) {
    const { data, error } = await supabase
      .from("event_participants")
      .select("name")
      .eq("id", participantId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  static subscribeToPolls(planId: string, callback: (payload: PollChangePayload) => void) {
    return supabase
      .channel(`poll_event_${planId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "polls",
          filter: `event_id=eq.${planId}`,
        },
        (payload) => {
          callback(payload as unknown as PollChangePayload);
        }
      )
      .subscribe();
  }

  static subscribeToPollOptions(
    pollId: string,
    callback: (payload: RealtimePostgresChangesPayload<PollOption>) => void
  ) {
    return supabase
      .channel(`poll_options_${pollId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poll_options",
          filter: `poll_id=eq.${pollId}`,
        },
        (payload) => {
          callback(payload as unknown as RealtimePostgresChangesPayload<PollOption>);
        }
      )
      .subscribe();
  }

  static subscribeToPollVotes(
    pollId: string,
    callback: (payload: RealtimePostgresChangesPayload<PollVote>) => void
  ) {
    return supabase
      .channel(`poll_votes_${pollId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poll_votes",
          filter: `poll_id=eq.${pollId}`,
        },
        (payload) => {
          callback(payload as unknown as RealtimePostgresChangesPayload<PollVote>);
        }
      )
      .subscribe();
  }

  static unsubscribeFromPolls(subscription: ReturnType<typeof supabase.channel>) {
    supabase.removeChannel(subscription);
  }

  static unsubscribeFromPollOptions(subscription: ReturnType<typeof supabase.channel>) {
    supabase.removeChannel(subscription);
  }

  static unsubscribeFromPollVotes(subscription: ReturnType<typeof supabase.channel>) {
    supabase.removeChannel(subscription);
  }
}
