import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Participant } from "@/types";
import FormDialog from "./FormDialog";

interface ExpenseFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string, amount: number, paidBy: string) => void;
  isLoading: boolean;
  participants: Participant[];
  isHost: boolean;
  currentParticipantId: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ isOpen, onOpenChange, onSubmit, isLoading, participants, isHost, currentParticipantId }) => {
  console.log("ExpenseForm debug:", { isHost, participants });
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentParticipantId);

  const handleSubmit = () => {
    if (!title.trim() || !amount.trim()) return;
    const amountNumber = parseFloat(amount.replace(",", "."));
    if (isNaN(amountNumber)) return;
    onSubmit(title.trim(), amountNumber, paidBy);
    setTitle("");
    setAmount("");
    setPaidBy(currentParticipantId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <FormDialog
      title="Nuevo Gasto"
      description="Agrega un nuevo gasto al evento."
      triggerText="Nuevo Gasto"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitText="Agregar Gasto"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="title">Descripción</Label>
          <Input
            id="title"
            placeholder="¿En qué gastaste?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border border-primary-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            type="number"
            min={0}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border border-primary-foreground"
          />
        </div>
        {isHost && participants.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="paidBy">Pagado por</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger className="border border-primary-foreground">
                <SelectValue placeholder="Selecciona un participante" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((participant) => (
                  <SelectItem key={participant.id} value={participant.id}>
                    {participant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form>
    </FormDialog>
  );
};

export default ExpenseForm;
