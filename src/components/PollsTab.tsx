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

interface PollsTabProps {
  eventId: string;
  currentParticipantId: string | null;
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

const PollsTab: React.FC<PollsTabProps> = ({ eventId, currentParticipantId }) => {
  const [polls, setPolls] = useState<PollWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPollTitle, setNewPollTitle] = useState("");
  const [newPollDescription, setNewPollDescription] = useState("");
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [options, setOptions] = useState<string[]>([""]);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPolls();
  }, [eventId]);

  const fetchPolls = async () => {
    try {
      const [pollsData, votesData] = await Promise.all([
        PollService.getPolls(eventId),
        currentParticipantId ? PollService.getPollVotes(eventId) : Promise.resolve([]),
      ]);

      const processedPolls: PollWithDetails[] = await Promise.all(
        pollsData.map(async (poll) => {
          const pollOptions = await PollService.getPollOptions(poll.id);
          const optionsWithVotes: PollOptionWithVotes[] = pollOptions.map((option) => ({
            ...option,
            votes_count: votesData.filter((vote) => vote.option_id === option.id).length,
            has_voted: votesData.some((vote) => vote.option_id === option.id),
          }));

          const totalVotes = optionsWithVotes.reduce((sum, option) => sum + (option.votes_count || 0), 0);

          return {
            ...poll,
            options: optionsWithVotes,
            total_votes: totalVotes,
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

  const handleCreatePoll = async () => {
    if (!currentParticipantId) {
      toast({
        title: "Error",
        description: "Debes unirte al evento para crear encuestas.",
        variant: "destructive",
      });
      return;
    }

    if (!newPollTitle.trim()) {
      toast({
        title: "Error",
        description: "El título de la encuesta es requerido.",
        variant: "destructive",
      });
      return;
    }

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Se requieren al menos dos opciones válidas.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingPoll(true);

    try {
      // Create poll
      const poll = await PollService.createPoll(eventId, currentParticipantId, {
        title: newPollTitle.trim(),
        description: newPollDescription.trim() || null,
        allow_multiple_votes: allowMultipleVotes,
      });

      // Create options
      await Promise.all(
        validOptions.map((title) =>
          PollService.addPollOption(poll.id, {
            title: title.trim(),
          })
        )
      );

      toast({
        title: "¡Encuesta creada!",
        description: "La encuesta se ha creado exitosamente.",
      });

      // Reset form
      setNewPollTitle("");
      setNewPollDescription("");
      setAllowMultipleVotes(false);
      setOptions([""]);
      setIsDialogOpen(false);

      // Refresh polls
      fetchPolls();
    } catch (error) {
      console.error("Error creating poll:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la encuesta. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPoll(false);
    }
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
      await PollService.vote(pollId, optionId, currentParticipantId);

      toast({
        title: "¡Voto registrado!",
        description: "Tu voto se ha registrado correctamente.",
      });

      // Refresh polls to update vote counts
      fetchPolls();
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
      await PollService.removeVote(pollId, optionId, currentParticipantId);

      toast({
        title: "Voto eliminado",
        description: "Tu voto se ha eliminado correctamente.",
      });

      fetchPolls();
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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Nueva Encuesta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Encuesta</DialogTitle>
              <DialogDescription>Crea una nueva encuesta para que los participantes voten.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" placeholder="¿Qué quieres preguntar?" value={newPollTitle} onChange={(e) => setNewPollTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Añade más detalles sobre la encuesta..."
                  value={newPollDescription}
                  onChange={(e) => setNewPollDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Opciones</Label>
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Opción ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        setOptions(newOptions);
                      }}
                    />
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newOptions = options.filter((_, i) => i !== index);
                          setOptions(newOptions);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => setOptions([...options, ""])} className="w-full">
                  Agregar Opción
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="multiple-votes"
                  checked={allowMultipleVotes}
                  onCheckedChange={setAllowMultipleVotes}
                  className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white"
                />
                <Label htmlFor="multiple-votes" className="text-primary-foreground">
                  Permitir votos múltiples
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreatePoll}
                disabled={isCreatingPoll}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                {isCreatingPoll ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...
                  </>
                ) : (
                  "Crear Encuesta"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {polls.length === 0 ? (
          <Card className="bg-card text-card-foreground">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <p className="text-lg text-muted-foreground">No hay encuestas creadas</p>
              <p className="text-sm text-muted-foreground">¡Sé el primero en crear una encuesta!</p>
            </CardContent>
          </Card>
        ) : (
          polls.map((poll) => (
            <Card key={poll.id} className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-xl text-primary">{poll.title}</CardTitle>
                {poll.description && <CardDescription className="text-muted-foreground">{poll.description}</CardDescription>}
                <div className="text-sm text-muted-foreground">
                  Creada por {poll.creator_name} · {new Date(poll.created_at).toLocaleDateString()}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                          <span className="text-sm text-muted-foreground">
                            {option.votes_count || 0} votos ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-500 ease-in-out" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-sm text-muted-foreground text-right">
                    Total: {poll.total_votes} {poll.total_votes === 1 ? "voto" : "votos"}
                  </p>
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
