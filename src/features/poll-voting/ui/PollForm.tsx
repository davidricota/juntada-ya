import React, { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Switch } from "@/shared/ui/switch";
import { DialogFooter } from "@/shared/ui/dialog";
import { X, Loader2 } from "lucide-react";

interface PollFormProps {
  initialData?: {
    title: string;
    description: string;
    allowMultipleVotes: boolean;
    options: string[];
  };
  onSubmit: (data: {
    title: string;
    description: string;
    allowMultipleVotes: boolean;
    options: string[];
  }) => Promise<void>;
  onDelete?: () => void;
  isSubmitting: boolean;
}

export const PollForm: React.FC<PollFormProps> = ({
  initialData,
  onSubmit,
  onDelete,
  isSubmitting,
}) => {
  const [title, setTitle] = useState(
    typeof initialData?.title === "string" && initialData.title.length > 0 ? initialData.title : ""
  );
  const [description, setDescription] = useState(
    typeof initialData?.description === "string" && initialData.description.length > 0
      ? initialData.description
      : ""
  );
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(
    typeof initialData?.allowMultipleVotes === "boolean" ? initialData.allowMultipleVotes : false
  );
  const [options, setOptions] = useState<string[]>(
    Array.isArray(initialData?.options) && initialData.options.length > 0
      ? initialData.options
      : [""]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      return;
    }

    await onSubmit({
      title,
      description,
      allowMultipleVotes,
      options: validOptions,
    });
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          placeholder="¿Qué quieres preguntar?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-primary-foreground bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea
          id="description"
          placeholder="Añade más detalles sobre la encuesta..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-primary-foreground bg-background"
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
              className="border border-primary-foreground bg-background"
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
        <Button
          type="button"
          variant="outline"
          onClick={() => setOptions([...options, ""])}
          className="w-full"
        >
          Agregar Opción
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="multiple-votes"
          checked={allowMultipleVotes}
          onCheckedChange={setAllowMultipleVotes}
          className={`data-[state=checked]:bg-white data-[state=unchecked]:bg-muted ${
            !allowMultipleVotes ? "opacity-50" : ""
          }`}
        />
        <Label
          htmlFor="multiple-votes"
          className={`text-primary-foreground ${!allowMultipleVotes ? "opacity-50" : ""}`}
        >
          Permitir votos múltiples
        </Label>
      </div>
      <DialogFooter>
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => onDelete()}
            className="mr-auto"
          >
            Eliminar Encuesta
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
              {initialData ? "Actualizando..." : "Creando..."}
            </>
          ) : initialData ? (
            "Actualizar Encuesta"
          ) : (
            "Crear Encuesta"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};
