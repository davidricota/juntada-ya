import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"; // Usando Card de shadcn
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <Card className="bg-card border-gray-700 hover:shadow-xl hover:shadow-primary/10 transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center space-x-3 pb-2">
        <Icon className="h-8 w-8 text-primary" />
        <CardTitle className="text-xl text-card-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
