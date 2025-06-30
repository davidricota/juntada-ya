import React from "react";
import { Button } from "@/shared/ui/button"; // Usando el botón de shadcn
import { ArrowRight } from "lucide-react";

const HeroSection: React.FC = () => {
  return (
    <section className="text-center py-16 md:py-24">
      <h1 className="text-4xl md:text-6xl font-bold mb-6">
        Organiza <span className="text-primary">eventos épicos</span> con tus amigos.
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
        Desde encuestas para decidir la comida hasta playlists colaborativas y división de gastos.
        Todo en un solo lugar.
      </p>
      <Button
        size="lg"
        className="bg-primary text-primary-foreground font-semibold hover:bg-opacity-90 transform hover:scale-105 transition-all duration-300 ease-in-out px-8 py-6 text-lg group"
        onClick={() =>
          alert("Próximamente: ¡Integración con Supabase para crear tu primer evento!")
        }
      >
        Comenzar ahora{" "}
        <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
      <p className="text-sm text-muted-foreground mt-4">
        (La creación de eventos y colaboración se habilitará con Supabase)
      </p>
    </section>
  );
};

export default HeroSection;
