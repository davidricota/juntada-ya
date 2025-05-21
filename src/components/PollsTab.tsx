import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Vote, X, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PollsTabProps {
  eventId: string;
  currentParticipantId: string | null;
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  created_by_participant_id: string;
  created_at: string;
  closed_at: string | null;
  allow_multiple_votes: boolean;
  creator_name?: string;
  options?: PollOption[];
  total_votes?: number;
}

interface PollOption {
  id: string;
  title: string;
  votes_count?: number;
  has_voted?: boolean;
}

const PollsTab: React.FC<PollsTabProps> = ({ eventId, currentParticipantId }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
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
      // Fetch polls with creator names
      const { data: pollsData, error: pollsError } = await supabase
        .from("polls")
        .select(`
          *,
          event_participants (name),
          poll_options (
            id,
            title,
            poll_votes (count)
          )
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (pollsError) throw pollsError;

      // Fetch votes for the current participant
      const { data: votesData, error: votesError } = await supabase
        .from("poll_votes")
        .select("poll_id, option_id")
        .eq("participant_id", currentParticipantId);

      if (votesError) throw votesError;

      // Process and format the data
      const processedPolls = pollsData.map((poll: any) => {
        const options = poll.poll_options.map((option: any) => ({
          id: option.id,
          title: option.title,
          votes_count: option.poll_votes[0]?.count || 0,
          has_voted: votesData?.some((vote: any) => vote.option_id === option.id) || false,
        }));

        const totalVotes = options.reduce((sum: number, option: PollOption) => sum + (option.votes_count || 0), 0);

        return {
          ...poll,
          creator_name: poll.event_participants?.name || "Unknown",
          options,
          total_votes: totalVotes,
        };
      });

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
      const { data: pollData, error: pollError } = await supabase
        .from("polls")
        .insert({
          event_id: eventId,
          title: newPollTitle.trim(),
          description: newPollDescription.trim() || null,
          created_by_participant_id: currentParticipantId,
          allow_multiple_votes: allowMultipleVotes,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Create options
      const optionsToInsert = validOptions.map((title) => ({
        poll_id: pollData.id,
        title: title.trim(),
      }));

      const { error: optionsError } = await supabase.from("poll_options").insert(optionsToInsert);

      if (optionsError) throw optionsError;

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
      if (!allowMultiple) {
        // Remove existing votes for this poll if multiple votes aren't allowed
        await supabase
          .from("poll_votes")
          .delete()
          .eq("poll_id", pollId)
          .eq("participant_id", currentParticipantId);
      }

      // Add new vote
      const { error } = await supabase.from("poll_votes").insert({
        poll_id: pollId,
        option_id: optionId,
        participant_id: currentParticipantId,
      });

      if (error) throw error;

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
      const { error } = await supabase
        .from("poll_votes")
        .delete()
        .eq("poll_id", pollId)
        .eq("option_id", optionId)
        .eq("participant_id", currentParticipantId);

      if (error) throw error;

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
        <Loader2 className="h-8 w-8 animate-spin text-spotify-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-spotify-text">Encuestas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-spotify-green hover:bg-spotify-green/90 text-spotify-dark">
              <Plus className="mr-2 h-4 w-4" /> Nueva Encuesta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Encuesta</DialogTitle>
              <DialogDescription>Crea una nueva encuesta para que los participantes voten.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newPollTitle}
                  onChange={(e) => setNewPollTitle(e.target.value)}
                  placeholder="¿Qué quieres preguntar?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={newPollDescription}
                  onChange={(e) => setNewPollDescription(e.target.value)}
                  placeholder="Agrega más detalles sobre tu pregunta..."
                />
              </div>
              <div className="space-y-2">
                <Label>Opciones</Label>
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        setOptions(newOptions);
                      }}
                      placeholder={`Opción ${index + 1}`}
                    />
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOptions(options.filter((_, i) => i !== index))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOptions([...options, ""])}
                  className="w-full mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" /> Agregar Opción
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="multiple-votes"
                  checked={allowMultipleVotes}
                  onCheckedChange={setAllowMultipleVotes}
                />
                <Label htmlFor="multiple-votes">Permitir votos múltiples</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreatePoll}
                disabled={isCreatingPoll}
                className="bg-spotify-green hover:bg-spotify-green/90 text-spotify-dark"
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
        {polls.map((poll) => (
          <Card key={poll.id} className="bg-spotify-light-dark">
            <CardHeader>
              <CardTitle className="text-xl text-spotify-text">{poll.title}</CardTitle>
              {poll.description && (
                <CardDescription className="text-spotify-text-muted">{poll.description}</CardDescription>
              )}
              <div className="text-sm text-spotify-text-muted">
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
                              option.has_voted
                                ? removeVote(poll.id, option.id)
                                : handleVote(poll.id, option.id, poll.allow_multiple_votes)
                            }
                            className={option.has_voted ? "bg-spotify-green text-spotify-dark" : ""}
                          >
                            {option.has_voted ? (
                              <Check className="h-4 w-4 mr-2" />
                            ) : (
                              <Vote className="h-4 w-4 mr-2" />
                            )}
                            {option.title}
                          </Button>
                        </div>
                        <span className="text-sm text-spotify-text-muted">
                          {option.votes_count || 0} votos ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-spotify-dark rounded-full overflow-hidden">
                        <div
                          className="h-full bg-spotify-green transition-all duration-500 ease-in-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-sm text-spotify-text-muted text-right">
                  Total: {poll.total_votes} {poll.total_votes === 1 ? "voto" : "votos"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {polls.length === 0 && (
          <Card className="bg-spotify-light-dark">
            <CardContent className="p-8 text-center text-spotify-text-muted">
              No hay encuestas creadas aún. ¡Sé el primero en crear una!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PollsTab;