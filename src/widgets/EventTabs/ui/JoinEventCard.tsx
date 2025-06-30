import React from "react";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { useNavigate } from "react-router-dom";

interface JoinEventCardProps {
  accessCode: string;
  message?: string;
}

const JoinEventCard: React.FC<JoinEventCardProps> = ({
  accessCode,
  message = "unirte al evento",
}) => {
  const navigate = useNavigate();

  return (
    <Card className="bg-card text-card-foreground p-6 text-center shadow-lg">
      <p className="text-muted-foreground">
        Debes{" "}
        <Button
          variant="link"
          onClick={() => navigate(`/join/${accessCode}`)}
          className="p-0 h-auto text-primary hover:underline"
        >
          {message}
        </Button>{" "}
        para continuar.
      </p>
    </Card>
  );
};

export default JoinEventCard;
