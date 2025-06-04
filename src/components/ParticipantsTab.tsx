import { Participant } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ParticipantsTabProps {
  participants: Participant[];
}

export function ParticipantsTab({ participants }: ParticipantsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Participantes</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">{participant.name}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
