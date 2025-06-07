import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Vote, X, Check, Loader2 } from "lucide-react";
import { PollService } from "@/services/pollService";
import { useToast } from "@/hooks/use-toast";
import { Poll, PollOption, PollVote } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { PollForm } from "@/components/PollForm";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCard } from "@/components/ui/skeleton-card";

interface PollsTabProps {
  eventId: string;
  currentParticipantId: string | null;
  isHost: boolean;
}

interface PollWithDetails extends Poll {
  creator_name?: string;
  options?: PollOptionWithVotes[];
  total_votes?: number;
}

interface PollOptionWithVotes extends PollOption {
  votes_count?: number;
  has_voted?: boolean;
}

const PollSkeleton = () => (
  <Card className="bg-card text-card-foreground animate-pulse">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-5 w-36" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <Skeleton className="h-full w-2/3" />
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const PollsTab: React.FC<PollsTabProps> = ({ eventId, currentParticipantId, isHost }) => {
  const [polls, setPolls] = useState<PollWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<PollWithDetails | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPolls();

    // Suscribirse a cambios en los votos
    const subscription = supabase
      .channel("poll_votes_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poll_votes",
        },
        async (payload) => {
          // Refrescar los votos cuando hay cambios
          await fetchPolls();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId]);

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
              ? pollVotes.some((vote) => vote.option_id === option.id && vote.participant_id === currentParticipantId)
              : false,
          }));

          const totalVotes = optionsWithVotes.reduce((sum, option) => sum + (option.votes_count || 0), 0);

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
      console.error("Error fetching polls:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las encuestas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePoll = async (formData: { title: string; description: string; allowMultipleVotes: boolean; options: string[] }) => {
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
        await PollService.updatePoll(editingPoll.id, {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          allow_multiple_votes: formData.allowMultipleVotes,
        });

        // Actualizar opciones
        const existingOptions = await PollService.getPollOptions(editingPoll.id);
        await Promise.all(existingOptions.map((opt) => PollService.removePollOption(opt.id)));

        await Promise.all(
          formData.options.map((title) =>
            PollService.addPollOption(editingPoll.id, {
              title: title.trim(),
            })
          )
        );

        toast({
          title: "¡Encuesta actualizada!",
          description: "La encuesta se ha actualizado exitosamente.",
        });
      } else {
        // Crear nueva encuesta
        const poll = await PollService.createPoll(eventId, currentParticipantId, {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          allow_multiple_votes: formData.allowMultipleVotes,
        });

        await Promise.all(
          formData.options.map((title) =>
            PollService.addPollOption(poll.id, {
              title: title.trim(),
            })
          )
        );

        toast({
          title: "¡Encuesta creada!",
          description: "La encuesta se ha creado exitosamente.",
        });
      }

      // Reset form
      setEditingPoll(null);
      setIsDialogOpen(false);

      // Refresh polls
      fetchPolls();
    } catch (error) {
      console.error("Error creating/updating poll:", error);
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
      toast({
        title: "Encuesta eliminada",
        description: "La encuesta se ha eliminado correctamente.",
      });
      fetchPolls();
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la encuesta. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const canEditPoll = (poll: PollWithDetails) => {
    return isHost || (currentParticipantId && poll.created_by_participant_id === currentParticipantId);
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

      // Si no permite múltiples votos, primero removemos el voto anterior si existe
      if (!allowMultiple) {
        const previousVote = poll.options?.find((opt) => opt.has_voted);
        if (previousVote) {
          await PollService.removeVote(pollId, currentParticipantId, previousVote.id);
        }
      }

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
                  votes_count: opt.id === optionId ? (opt.votes_count || 0) + 1 : opt.has_voted ? (opt.votes_count || 0) - 1 : opt.votes_count,
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

            const totalVotes = updatedOptions?.reduce((sum, opt) => sum + (opt.votes_count || 0), 0) || 0;

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
      console.error("Error voting:", error);
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

      // Actualizamos el estado local inmediatamente
      setPolls((prevPolls) =>
        prevPolls.map((poll) => {
          if (poll.id === pollId) {
            const updatedOptions = poll.options?.map((option) => {
              if (option.id === optionId) {
                return {
                  ...option,
                  votes_count: (option.votes_count || 0) - 1,
                  has_voted: false,
                };
              }
              return option;
            });

            const totalVotes = updatedOptions?.reduce((sum, opt) => sum + (opt.votes_count || 0), 0) || 0;

            return {
              ...poll,
              options: updatedOptions,
              total_votes: totalVotes,
            };
          }
          return poll;
        })
      );

      toast({
        title: "Voto eliminado",
        description: "Tu voto se ha eliminado correctamente.",
      });
    } catch (error) {
      console.error("Error removing vote:", error);
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
                {editingPoll ? "Modifica los detalles de la encuesta." : "Crea una nueva encuesta para que los participantes voten."}
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
              <div className="text-sm text-muted-foreground">¡Sé el primero en crear una encuesta!</div>
            </CardContent>
          </Card>
        ) : (
          polls.map((poll) => (
            <Card key={poll.id} className="bg-card text-card-foreground">
              <CardHeader className="px-2 md:px-6">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl text-primary">{poll.title}</CardTitle>
                    {poll.description && <CardDescription className="text-muted-foreground">{poll.description}</CardDescription>}
                    <div className="text-sm text-muted-foreground">
                      Creada por {poll.creator_name} · {new Date(poll.created_at).toLocaleDateString()}
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
              <CardContent>
                <div className="space-y-4 px-2 md:px-6">
                  {poll.options?.map((option) => {
                    const percentage = poll.total_votes ? ((option.votes_count || 0) / poll.total_votes) * 100 : 0;
                    return (
                      <div key={option.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant={option.has_voted ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                option.has_voted ? removeVote(poll.id, option.id) : handleVote(poll.id, option.id, poll.allow_multiple_votes)
                              }
                              className={option.has_voted ? "bg-primary text-primary-foreground" : "bg-card text-primary"}
                            >
                              {option.has_voted ? <Check className="h-4 w-4 mr-2" /> : <Vote className="h-4 w-4 mr-2" />}
                              {option.title}
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {option.votes_count || 0} votos ({percentage.toFixed(1)}%)
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-500 ease-in-out" style={{ width: `${percentage}%` }} />
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
