import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ExpenseService } from "@/services/expenseService";
import { useToast } from "@/hooks/use-toast";
import { Participant, Expense, ExpenseSummary, ExpenseChangePayload } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Trash } from "lucide-react";
import ExpenseForm from "./ExpenseForm";

import { ScrollArea } from "@/components/ui/scroll-area";

interface ExpensesTabProps {
  eventId: string;
  participants: Participant[];
  currentParticipantId: string;
  isHost: boolean;
}

const ExpensesTab: React.FC<ExpensesTabProps> = ({ eventId, participants, currentParticipantId, isHost }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadExpenses();
    const subscription = ExpenseService.subscribeToExpenses(eventId, (payload: ExpenseChangePayload) => {
      if (payload.eventType === "INSERT" && payload.new) {
        ExpenseService.getExpenseSummary(eventId).then(setSummary);
      } else if (payload.eventType === "DELETE" && payload.old) {
        setExpenses((prev) => {
          const filtered = prev.filter((expense) => expense.id !== payload.old?.id);
          return filtered;
        });
        ExpenseService.getExpenseSummary(eventId).then(setSummary);
      }
    });
    return () => {
      ExpenseService.unsubscribeFromExpenses(subscription);
    };
  }, [eventId]);

  const loadExpenses = async () => {
    try {
      const [expensesData, summaryData] = await Promise.all([ExpenseService.getExpenses(eventId), ExpenseService.getExpenseSummary(eventId)]);

      setExpenses(expensesData);
      setSummary(summaryData);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los gastos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async (title: string, amount: number, paidBy: string) => {
    try {
      const newExpense = await ExpenseService.addExpense(eventId, paidBy, title, amount);
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
      const newSummary = await ExpenseService.getExpenseSummary(eventId);
      setSummary(newSummary);
      setIsDialogOpen(false);
      toast({
        title: "¡Gasto Agregado!",
        description: "El gasto se ha agregado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el gasto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      // Primero actualizamos el estado local
      setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId));
      // Luego eliminamos en la base de datos
      await ExpenseService.removeExpense(expenseId);
      // Actualizamos el resumen
      const newSummary = await ExpenseService.getExpenseSummary(eventId);
      setSummary(newSummary);

      toast({
        title: "Gasto Eliminado",
        description: "El gasto se ha eliminado correctamente.",
      });
    } catch (error) {
      // Si hay error, recargamos todo
      loadExpenses();
      toast({
        title: "Error",
        description: "No se pudo eliminar el gasto. Inténtalo de nuevo.",
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
        <ExpenseForm
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleAddExpense}
          isLoading={false}
          participants={participants}
          isHost={isHost}
          currentParticipantId={currentParticipantId}
        />
      </div>

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
                    <span className="text-muted-foreground">{participant.name}:</span>
                    <span className={participant.receives > 0 ? "text-green-500" : participant.receives < 0 ? "text-red-500" : ""}>
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
              <p className="text-muted-foreground text-center py-6 italic">No hay gastos registrados.</p>
            ) : (
              <div className="max-h-72 space-y-4">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 bg-foreground border border-primary rounded-lg">
                    <div>
                      <h3 className="font-semibold">{expense.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(expense.amount)} - Pagado por: {expense.participant_name}
                      </p>
                    </div>
                    {(expense.paid_by_participant_id === currentParticipantId || isHost) && (
                      <button onClick={() => handleDeleteExpense(expense.id)} className="p-2 hover:bg-destructive/10 rounded-full transition-colors">
                        <Trash className="h-4 w-4 text-destructive" />
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
