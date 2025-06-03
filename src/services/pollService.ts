import { supabase } from "@/integrations/supabase/client";
import { Poll, PollOption, PollVote } from "@/types";

export class PollService {
  static async getPolls(eventId: string): Promise<Poll[]> {
    try {
      const { data, error } = await supabase.from("polls").select("*").eq("event_id", eventId).order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching polls:", error);
        throw new Error("Error al obtener las encuestas");
      }

      return data || [];
    } catch (error) {
      console.error("Error in getPolls:", error);
      throw error;
    }
  }

  static async getPollOptions(pollId: string): Promise<PollOption[]> {
    try {
      const { data, error } = await supabase.from("poll_options").select("*").eq("poll_id", pollId).order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching poll options:", error);
        throw new Error("Error al obtener las opciones de la encuesta");
      }

      return data || [];
    } catch (error) {
      console.error("Error in getPollOptions:", error);
      throw error;
    }
  }

  static async getPollVotes(pollId: string): Promise<PollVote[]> {
    try {
      const { data, error } = await supabase.from("poll_votes").select("*").eq("poll_id", pollId);

      if (error) {
        console.error("Error fetching poll votes:", error);
        throw new Error("Error al obtener los votos de la encuesta");
      }

      return data || [];
    } catch (error) {
      console.error("Error in getPollVotes:", error);
      throw error;
    }
  }

  static async createPoll(
    eventId: string,
    participantId: string,
    poll: Omit<Poll, "id" | "event_id" | "created_by_participant_id" | "created_at" | "closed_at">
  ): Promise<Poll> {
    try {
      const { data, error } = await supabase
        .from("polls")
        .insert({
          event_id: eventId,
          created_by_participant_id: participantId,
          ...poll,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating poll:", error);
        throw new Error("Error al crear la encuesta");
      }

      return data;
    } catch (error) {
      console.error("Error in createPoll:", error);
      throw error;
    }
  }

  static async updatePoll(
    pollId: string,
    poll: Partial<Omit<Poll, "id" | "event_id" | "created_by_participant_id" | "created_at" | "closed_at">>
  ): Promise<Poll> {
    const { data, error } = await supabase.from("polls").update(poll).eq("id", pollId).select().single();

    if (error) throw error;
    return data;
  }

  static async deletePoll(pollId: string): Promise<void> {
    const { error } = await supabase.from("polls").delete().eq("id", pollId);

    if (error) throw error;
  }

  static async addPollOption(pollId: string, option: Omit<PollOption, "id" | "poll_id" | "created_at">): Promise<PollOption> {
    const { data, error } = await supabase
      .from("poll_options")
      .insert({
        poll_id: pollId,
        ...option,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async removePollOption(optionId: string): Promise<void> {
    const { error } = await supabase.from("poll_options").delete().eq("id", optionId);

    if (error) throw error;
  }

  static async vote(pollId: string, participantId: string, optionId: string): Promise<void> {
    try {
      console.log("=== Iniciando proceso de voto ===");
      console.log("Poll ID:", pollId);
      console.log("Participant ID:", participantId);
      console.log("Option ID:", optionId);

      // Primero obtenemos la encuesta para verificar si permite múltiples votos
      const { data: poll, error: pollError } = await supabase.from("polls").select("allow_multiple_votes, event_id").eq("id", pollId).single();

      if (pollError) {
        console.error("Error fetching poll:", pollError);
        throw new Error("Error al obtener la encuesta");
      }

      console.log("Encuesta encontrada:", poll);
      console.log("Permite múltiples votos:", poll.allow_multiple_votes);

      // Verificamos si el participante es parte del evento
      console.log("Verificando si el participante pertenece al evento...");
      const { data: eventParticipant, error: participantError } = await supabase
        .from("event_participants")
        .select("id")
        .eq("event_id", poll.event_id)
        .eq("id", participantId)
        .single();

      if (participantError) {
        console.error("Error fetching participant:", participantError);
        throw new Error("Error al verificar el participante");
      }

      if (!eventParticipant) {
        console.error("Participante no encontrado en el evento");
        throw new Error("No eres participante de este evento");
      }

      console.log("Participante verificado correctamente");

      // Si no permite múltiples votos, verificamos si ya existe un voto del participante
      if (!poll.allow_multiple_votes) {
        console.log("Verificando votos existentes para encuesta sin múltiples votos...");
        const { data: existingVotes, error: checkError } = await supabase
          .from("poll_votes")
          .select("*")
          .eq("poll_id", pollId)
          .eq("participant_id", participantId);

        if (checkError) {
          console.error("Error checking existing votes:", checkError);
          throw new Error("Error al verificar votos existentes");
        }

        console.log("Votos existentes encontrados:", existingVotes);

        if (existingVotes && existingVotes.length > 0) {
          console.log("Actualizando voto existente...");
          const { error: updateError } = await supabase
            .from("poll_votes")
            .update({ option_id: optionId })
            .eq("poll_id", pollId)
            .eq("participant_id", participantId);

          if (updateError) {
            console.error("Error updating vote:", updateError);
            throw new Error("Error al actualizar el voto");
          }
          console.log("Voto actualizado correctamente");
          return;
        }
      }

      // Si no hay voto existente o permite múltiples votos, insertamos el nuevo voto
      console.log("Insertando nuevo voto...");
      const { error } = await supabase.from("poll_votes").insert({
        poll_id: pollId,
        participant_id: participantId,
        option_id: optionId,
      });

      if (error) {
        console.error("Error inserting vote:", error);
        if (error.code === "42501") {
          throw new Error("No tienes permiso para votar en esta encuesta");
        }
        throw new Error("Error al registrar el voto");
      }

      console.log("Voto insertado correctamente");
      console.log("=== Proceso de voto completado ===");
    } catch (error) {
      console.error("Error in vote method:", error);
      throw error;
    }
  }

  static async removeVote(pollId: string, participantId: string, optionId: string): Promise<void> {
    try {
      // Verificamos si el voto existe
      const { data: existingVote, error: checkError } = await supabase
        .from("poll_votes")
        .select("*")
        .eq("poll_id", pollId)
        .eq("participant_id", participantId)
        .eq("option_id", optionId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing vote:", checkError);
        throw new Error("Error al verificar el voto existente");
      }

      if (!existingVote) {
        throw new Error("No has votado por esta opción");
      }

      // Eliminamos el voto
      const { error } = await supabase
        .from("poll_votes")
        .delete()
        .eq("poll_id", pollId)
        .eq("participant_id", participantId)
        .eq("option_id", optionId);

      if (error) {
        console.error("Error removing vote:", error);
        throw new Error("Error al eliminar el voto");
      }
    } catch (error) {
      console.error("Error in removeVote:", error);
      throw error;
    }
  }

  static async closePoll(pollId: string): Promise<void> {
    try {
      const { error } = await supabase.from("polls").update({ closed_at: new Date().toISOString() }).eq("id", pollId);

      if (error) {
        console.error("Error closing poll:", error);
        throw new Error("Error al cerrar la encuesta");
      }
    } catch (error) {
      console.error("Error in closePoll:", error);
      throw error;
    }
  }

  static async getParticipant(participantId: string) {
    const { data, error } = await supabase.from("event_participants").select("name").eq("id", participantId).single();

    if (error) {
      console.error("Error fetching participant:", error);
      return null;
    }

    return data;
  }
}
