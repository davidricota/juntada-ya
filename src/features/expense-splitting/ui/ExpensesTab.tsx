import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Loader2 } from "lucide-react";
import { ExpenseService } from "../api/expenseService";
import { toast } from "sonner";
import { Participant, Expense, ExpenseSummary, ExpenseChangePayload } from "@/app/types";
import { formatCurrency } from "@/shared/lib/utils";
import { Trash, UserPlus } from "lucide-react";
import ExpenseForm from "./ExpenseForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

interface ExpensesTabProps {
  planId: string;
  participants: Participant[];
  currentParticipantId: string;
  isHost: boolean;
}

const ExpensesTab: React.FC<ExpensesTabProps> = ({
  planId,
  participants,
  currentParticipantId,
  isHost,
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddExtraOpen, setIsAddExtraOpen] = useState(false);
  const [extraName, setExtraName] = useState("");
  const [isAddingExtra, setIsAddingExtra] = useState(false);

  useEffect(() => {
    void loadExpenses();
    const subscription = ExpenseService.subscribeToExpenses(
      planId,
      (payload: ExpenseChangePayload) => {
        if (payload.eventType === "INSERT" && payload.new) {
          void ExpenseService.getExpenseSummary(planId).then(setSummary);
        } else if (payload.eventType === "DELETE" && payload.old) {
          setExpenses((prev) => {
            const filtered = prev.filter((expense) => expense.id !== payload.old?.id);
            return filtered;
          });
          void ExpenseService.getExpenseSummary(planId).then(setSummary);
        }
      }
    );
    return () => {
      ExpenseService.unsubscribeFromExpenses(subscription);
    };
  }, [planId]);

  const loadExpenses = async () => {
    try {
      const [expensesData, summaryData] = await Promise.all([
        ExpenseService.getExpenses(planId),
        ExpenseService.getExpenseSummary(planId),
      ]);

      setExpenses(expensesData);
      setSummary(summaryData);
    } catch {
      toast.error("No se pudieron cargar los gastos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async (title: string, amount: number, paidBy: string) => {
    try {
      const newExpense = await ExpenseService.addExpense(planId, paidBy, title, amount);
      // Encontrar el nombre del participante que pagó
      const paidByParticipant = participants.find((p) => p.id === paidBy);
      // Agregar el gasto al estado con el nombre del participante
      setExpenses((prev) => [
        {
          ...newExpense,
          participant_name: paidByParticipant?.name || "Desconocido",
        },
        ...prev,
      ]);
      // Actualizar el resumen
      const newSummary = await ExpenseService.getExpenseSummary(planId);
      setSummary(newSummary);
      setIsDialogOpen(false);
      toast.success("El gasto se ha agregado correctamente.");
    } catch {
      toast.error("No se pudo agregar el gasto. Inténtalo de nuevo.");
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      // Primero actualizamos el estado local
      setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId));
      // Luego eliminamos en la base de datos
      await ExpenseService.removeExpense(expenseId);
      // Actualizamos el resumen
      const newSummary = await ExpenseService.getExpenseSummary(planId);
      setSummary(newSummary);

      toast.success("El gasto se ha eliminado correctamente.");
    } catch {
      // Si hay error, recargamos todo
      void loadExpenses();
      toast.error("No se pudo eliminar el gasto. Inténtalo de nuevo.");
    }
  };

  const handleAddExtra = async () => {
    if (typeof extraName === "string" && extraName.trim().length > 0) {
      setIsAddingExtra(true);
      try {
        await ExpenseService.addExtraParticipant(planId, extraName);
        setExtraName("");
        setIsAddExtraOpen(false);
        toast.success(`${extraName} fue añadido a la lista de gastos.`);
      } catch {
        toast.error("No se pudo agregar el participante extra.");
      } finally {
        setIsAddingExtra(false);
      }
    }
  };

  function isNonEmptyString(val: unknown): val is string {
    return typeof val === "string" && val.length > 0;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button onClick={() => setIsAddExtraOpen(true)} variant="outline">
          Agregar participante extra
        </Button>
        <ExpenseForm
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={(...args) => {
            void handleAddExpense(...args);
          }}
          isLoading={false}
          participants={participants}
          isHost={isHost}
          currentParticipantId={currentParticipantId}
        />
      </div>
      {/* Popup para agregar participante extra */}
      <Dialog open={isAddExtraOpen} onOpenChange={setIsAddExtraOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar participante extra</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nombre del participante"
            value={extraName}
            onChange={(e) => setExtraName(e.target.value)}
            disabled={isAddingExtra}
            autoFocus
            className="border border-primary-foreground focus:border-primary-foreground focus:ring-0"
          />
          <DialogFooter>
            <Button
              onClick={() => {
                void handleAddExtra();
              }}
              disabled={isAddingExtra || extraName.trim().length === 0}
            >
              {isAddingExtra ? "Agregando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {summary && (
        <Card className="bg-card text-card-foreground">
          <CardHeader className="p-2 md:p-6">
            <CardTitle className="text-xl">Resumen de Gastos</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Gastado:</span>
                <span className="font-semibold">{formatCurrency(summary.total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Por Persona:</span>
                <span className="font-semibold">{formatCurrency(summary.perPerson)}</span>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Balance por Participante:</h3>
                {summary.participants.map((participant) => (
                  <div key={participant.id} className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      {isNonEmptyString(participant.name) ? participant.name : "Desconocido"}
                      {participant.is_extra && (
                        <UserPlus
                          className="inline h-4 w-4 text-primary ml-1"
                          title="Participante extra"
                        />
                      )}
                    </span>
                    <span
                      className={
                        participant.receives > 0
                          ? "text-green-500"
                          : participant.receives < 0
                          ? "text-red-500"
                          : ""
                      }
                    >
                      {participant.receives > 0
                        ? `Recibe ${formatCurrency(participant.receives)}`
                        : participant.receives < 0
                        ? `Debe ${formatCurrency(Math.abs(participant.receives))}`
                        : "Balanceado"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card text-card-foreground">
        <CardHeader className="p-2 md:p-6">
          <CardTitle className="text-xl">Historial de Gastos</CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          <ScrollArea className="h-full max-h-72 pr-4">
            {expenses.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 italic">
                No hay gastos registrados.
              </p>
            ) : (
              <div className="max-h-72 space-y-4">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 bg-foreground border border-primary rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{expense.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(expense.amount)} - Pagado por: {expense.participant_name}
                      </p>
                    </div>
                    {(expense.paid_by_participant_id === currentParticipantId || isHost) && (
                      <button
                        onClick={() => {
                          void handleDeleteExpense(expense.id);
                        }}
                        className="p-2 hover:bg-destructive/10 rounded-full transition-colors"
                      >
                        <Trash className="h-4 w-4 text-destructive cursor-pointer" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesTab;
