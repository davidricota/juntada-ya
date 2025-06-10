import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Vote, X, Check, Loader2 } from "lucide-react";
import { PollService } from "@/services/pollService";
import { useToast } from "@/hooks/use-toast";
import { Poll, PollOption, PollVote } from "@/types";
import { PollForm } from "@/components/PollForm";

interface PollsTabProps {
  eventId: string;
  currentParticipantId: string | null;
  isHost: boolean;
}

interface PollWithDetails extends Poll {
  creator_name?: string;
  total_votes?: number;
  options: (PollOption & {
    votes_count: number;
    has_voted: boolean;
  })[];
}

interface PollOptionWithVotes extends PollOption {
  votes_count: number;
  has_voted: boolean;
}

const PollsTab: React.FC<PollsTabProps> = ({ eventId, currentParticipantId, isHost }) => {
  const [polls, setPolls] = useState<PollWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<PollWithDetails | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!eventId) return;

    fetchPolls();

    // Suscribirse a cambios en las encuestas
    const pollsSubscription = PollService.subscribeToPolls(eventId, async (payload) => {
      if (payload.eventType === "DELETE") {
        setPolls((prev) => prev.filter((poll) => poll.id !== payload.old.id));
      } else if (payload.eventType === "INSERT" && payload.new) {
        // Agregar nueva encuesta
        const [pollOptions, pollVotes, creator] = await Promise.all([
          PollService.getPollOptions(payload.new.id),
          PollService.getPollVotes(payload.new.id),
          PollService.getParticipant(payload.new.created_by_participant_id),
        ]);

        const optionsWithVotes = pollOptions.map((option) => ({
          ...option,
          votes_count: pollVotes.filter((vote) => vote.option_id === option.id).length,
          has_voted: currentParticipantId
            ? pollVotes.some(
                (vote) =>
                  vote.option_id === option.id && vote.participant_id === currentParticipantId
              )
            : false,
        }));

        const totalVotes = optionsWithVotes.reduce(
          (sum, option) => sum + (option.votes_count || 0),
          0
        );

        setPolls((prev) => [
          {
            ...payload.new,
            options: optionsWithVotes,
            total_votes: totalVotes,
            creator_name: creator?.name || "Anónimo",
          },
          ...prev,
        ]);
      }
    });

    // Suscribirse a cambios en las opciones de las encuestas
    const pollOptionsSubscriptions = polls.map((poll) =>
      PollService.subscribeToPollOptions(poll.id, async (payload) => {
        if (payload.eventType === "INSERT" && payload.new) {
          setPolls((prev) =>
            prev.map((p) =>
              p.id === poll.id
                ? {
                    ...p,
                    options: [
                      ...(p.options || []),
                      { ...payload.new, votes_count: 0, has_voted: false },
                    ],
                  }
                : p
            )
          );
        } else if (payload.eventType === "DELETE" && payload.old) {
          setPolls((prev) =>
            prev.map((p) =>
              p.id === poll.id
                ? {
                    ...p,
                    options: p.options?.filter((opt) => opt.id !== payload.old.id),
                  }
                : p
            )
          );
        }
      })
    );

    // Suscribirse a cambios en los votos
    const pollVotesSubscriptions = polls.map((poll) =>
      PollService.subscribeToPollVotes(poll.id, async () => {
        // Recargar los votos de esta encuesta
        const [pollOptions, pollVotes] = await Promise.all([
          PollService.getPollOptions(poll.id),
          PollService.getPollVotes(poll.id),
        ]);

        const optionsWithVotes = pollOptions.map((option) => ({
          ...option,
          votes_count: pollVotes.filter((vote) => vote.option_id === option.id).length,
          has_voted: currentParticipantId
            ? pollVotes.some(
                (vote) =>
                  vote.option_id === option.id && vote.participant_id === currentParticipantId
              )
            : false,
        }));

        const totalVotes = optionsWithVotes.reduce(
          (sum, option) => sum + (option.votes_count || 0),
          0
        );

        setPolls((prev) =>
          prev.map((p) =>
            p.id === poll.id
              ? {
                  ...p,
                  options: optionsWithVotes,
                  total_votes: totalVotes,
                }
              : p
          )
        );
      })
    );

    return () => {
      PollService.unsubscribeFromPolls(pollsSubscription);
      pollOptionsSubscriptions.forEach((sub) => PollService.unsubscribeFromPollOptions(sub));
      pollVotesSubscriptions.forEach((sub) => PollService.unsubscribeFromPollVotes(sub));
    };
  }, [eventId, currentParticipantId, polls]);

  const fetchPolls = async () => {
    try {
      const pollsData = await PollService.getPolls(eventId);

      const processedPolls: PollWithDetails[] = await Promise.all(
        pollsData.map(async (poll) => {
          const [pollOptions, pollVotes, creator] = await Promise.all([
            PollService.getPollOptions(poll.id),
            PollService.getPollVotes(poll.id),
            PollService.getParticipant(poll.created_by_participant_id),
          ]);

          const optionsWithVotes: PollOptionWithVotes[] = pollOptions.map((option) => ({
            ...option,
            votes_count: pollVotes.filter((vote) => vote.option_id === option.id).length,
            has_voted: currentParticipantId
              ? pollVotes.some(
                  (vote) =>
                    vote.option_id === option.id && vote.participant_id === currentParticipantId
                )
              : false,
          }));

          const totalVotes = optionsWithVotes.reduce(
            (sum, option) => sum + (option.votes_count || 0),
            0
          );

          return {
            ...poll,
            options: optionsWithVotes,
            total_votes: totalVotes,
            creator_name: creator?.name || "Anónimo",
          };
        })
      );

      setPolls(processedPolls);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las encuestas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePoll = async (formData: {
    title: string;
    description: string;
    allowMultipleVotes: boolean;
    options: string[];
  }) => {
    if (!currentParticipantId) {
      toast({
        title: "Error",
        description: "Debes unirte al evento para crear encuestas.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingPoll) {
        // Actualizar encuesta existente
        await PollService.createPoll(
          eventId,
          currentParticipantId,
          formData.title.trim(),
          formData.description.trim() || undefined,
          formData.options,
          formData.allowMultipleVotes
        );

        await queryClient.invalidateQueries({ queryKey: ["polls", eventId] });
        toast({
          title: "¡Encuesta actualizada!",
          description: "La encuesta se ha actualizado exitosamente.",
        });
      } else {
        // Crear nueva encuesta
        await PollService.createPoll(
          eventId,
          currentParticipantId,
          formData.title.trim(),
          formData.description.trim() || undefined,
          formData.options,
          formData.allowMultipleVotes
        );

        await queryClient.invalidateQueries({ queryKey: ["polls", eventId] });
        toast({
          title: "¡Encuesta creada!",
          description: "La encuesta se ha creado exitosamente.",
        });
      }

      // Reset form
      setEditingPoll(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear/actualizar la encuesta. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleEditPoll = (poll: PollWithDetails) => {
    setEditingPoll(poll);
    setIsDialogOpen(true);
  };

  const handleDeletePoll = async (pollId: string) => {
    try {
      await PollService.deletePoll(pollId);
      await queryClient.invalidateQueries({ queryKey: ["polls", eventId] });
      toast({
        title: "Encuesta eliminada",
        description: "La encuesta se ha eliminado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la encuesta. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const canEditPoll = (poll: PollWithDetails) => {
    return (
      isHost || (currentParticipantId && poll.created_by_participant_id === currentParticipantId)
    );
  };

  const handleVote = async (pollId: string, optionId: string, allowMultiple: boolean) => {
    if (!currentParticipantId) {
      toast({
        title: "Error",
        description: "Debes unirte al evento para votar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const poll = polls.find((p) => p.id === pollId);
      if (!poll) return;

      // Agregamos el nuevo voto
      await PollService.vote(pollId, currentParticipantId, optionId);

      // Actualizamos el estado local inmediatamente
      setPolls((prevPolls) =>
        prevPolls.map((p) => {
          if (p.id === pollId) {
            const updatedOptions = p.options?.map((opt) => {
              if (!allowMultiple) {
                // Si no permite múltiples votos, actualizamos todos los votos
                return {
                  ...opt,
                  votes_count:
                    opt.id === optionId
                      ? (opt.votes_count || 0) + 1
                      : opt.has_voted
                      ? (opt.votes_count || 0) - 1
                      : opt.votes_count,
                  has_voted: opt.id === optionId,
                };
              } else {
                // Si permite múltiples votos, solo actualizamos la opción seleccionada
                return opt.id === optionId
                  ? {
                      ...opt,
                      votes_count: (opt.votes_count || 0) + 1,
                      has_voted: true,
                    }
                  : opt;
              }
            });

            const totalVotes =
              updatedOptions?.reduce((sum, opt) => sum + (opt.votes_count || 0), 0) || 0;

            return {
              ...p,
              options: updatedOptions,
              total_votes: totalVotes,
            };
          }
          return p;
        })
      );

      toast({
        title: "¡Voto registrado!",
        description: "Tu voto se ha registrado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar tu voto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const removeVote = async (pollId: string, optionId: string) => {
    if (!currentParticipantId) return;

    try {
      await PollService.removeVote(pollId, currentParticipantId, optionId);
      await queryClient.invalidateQueries({ queryKey: ["polls", eventId] });

      toast({
        title: "Voto eliminado",
        description: "Tu voto se ha eliminado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar tu voto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground border border-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Nueva Encuesta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPoll ? "Editar Encuesta" : "Nueva Encuesta"}</DialogTitle>
              <DialogDescription>
                {editingPoll
                  ? "Modifica los detalles de la encuesta."
                  : "Crea una nueva encuesta para que los participantes voten."}
              </DialogDescription>
            </DialogHeader>
            <PollForm
              initialData={
                editingPoll
                  ? {
                      title: editingPoll.title,
                      description: editingPoll.description || "",
                      allowMultipleVotes: editingPoll.allow_multiple_votes,
                      options: editingPoll.options?.map((opt) => opt.title) || [""],
                    }
                  : undefined
              }
              onSubmit={handleCreatePoll}
              onDelete={editingPoll ? () => handleDeletePoll(editingPoll.id) : undefined}
              isSubmitting={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {polls.length === 0 ? (
          <Card className="bg-card text-card-foreground">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="text-lg text-muted-foreground">No hay encuestas creadas</div>
              <div className="text-sm text-muted-foreground">
                ¡Sé el primero en crear una encuesta!
              </div>
            </CardContent>
          </Card>
        ) : (
          polls.map((poll) => (
            <Card key={poll.id} className="bg-card text-card-foreground">
              <CardHeader className="p-2 md:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl text-primary">{poll.title}</CardTitle>
                    {poll.description && (
                      <CardDescription className="text-muted-foreground">
                        {poll.description}
                      </CardDescription>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Creada por {poll.creator_name} ·{" "}
                      {new Date(poll.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {canEditPoll(poll) && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditPoll(poll)}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePoll(poll.id)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-2 md:p-6">
                <div className="space-y-4">
                  {poll.options?.map((option) => {
                    const percentage = poll.total_votes
                      ? ((option.votes_count || 0) / poll.total_votes) * 100
                      : 0;
                    return (
                      <div key={option.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant={option.has_voted ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                option.has_voted
                                  ? removeVote(poll.id, option.id)
                                  : handleVote(poll.id, option.id, poll.allow_multiple_votes)
                              }
                              className={
                                option.has_voted
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-card text-primary"
                              }
                            >
                              {option.has_voted ? (
                                <Check className="h-4 w-4 mr-2" />
                              ) : (
                                <Vote className="h-4 w-4 mr-2" />
                              )}
                              {option.title}
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {option.votes_count || 0} votos ({percentage.toFixed(1)}%)
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500 ease-in-out"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="text-sm text-muted-foreground text-right">
                    Total: {poll.total_votes} {poll.total_votes === 1 ? "voto" : "votos"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PollsTab;
