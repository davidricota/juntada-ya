import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExpenseService } from "@/services/expenseService";
import { Expense, ExpenseSummary, Participant } from "@/types";
import { toast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

interface ExpensesTabProps {
  eventId: string;
  participants: Participant[];
  currentParticipantId: string | null;
  isHost: boolean;
}

export default function ExpensesTab({ eventId, participants, currentParticipantId, isHost }: ExpensesTabProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [newExpenseTitle, setNewExpenseTitle] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>("");
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadExpenses();
    const sub = ExpenseService.subscribeToExpenses(eventId, handleExpenseChange);
    setSubscription(sub);

    return () => {
      if (sub) {
        ExpenseService.unsubscribeFromExpenses(sub);
      }
    };
  }, [eventId]);

  const loadExpenses = async () => {
    try {
      const [expensesData, summaryData] = await Promise.all([ExpenseService.getExpenses(eventId), ExpenseService.getExpenseSummary(eventId)]);
      setExpenses(expensesData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Error loading expenses:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los gastos. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleExpenseChange = async () => {
    await loadExpenses();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentParticipantId) return;

    const amount = parseFloat(newExpenseAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser un número positivo.",
        variant: "destructive",
      });
      return;
    }

    try {
      await ExpenseService.addExpense(eventId, isHost ? selectedParticipantId : currentParticipantId, newExpenseTitle, amount);
      setNewExpenseTitle("");
      setNewExpenseAmount("");
      setSelectedParticipantId("");
      setIsDialogOpen(false);
      toast({ title: "Gasto Agregado", description: "El gasto se ha agregado correctamente." });
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el gasto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveExpense = async (expenseId: string) => {
    try {
      await ExpenseService.removeExpense(expenseId);
      toast({ title: "Gasto Eliminado", description: "El gasto se ha eliminado correctamente." });
    } catch (error) {
      console.error("Error removing expense:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el gasto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Gasto</DialogTitle>
              <DialogDescription>Ingresa los detalles del gasto que deseas agregar.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid gap-4">
                <Input placeholder="Descripción del gasto" value={newExpenseTitle} onChange={(e) => setNewExpenseTitle(e.target.value)} required />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Monto"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                  required
                />
                {isHost && (
                  <Select value={selectedParticipantId} onValueChange={setSelectedParticipantId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar participante" />
                    </SelectTrigger>
                    <SelectContent>
                      {participants.map((participant) => (
                        <SelectItem key={participant.id} value={participant.id}>
                          {participant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <DialogFooter>
                <Button type="submit">Agregar Gasto</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {expenses.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No hay gastos registrados</div>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <Card key={expense.id} className="bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{expense.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(expense.amount)} • Pagado por {expense.participant_name}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveExpense(expense.id)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Gastos</CardTitle>
          {summary && (
            <CardDescription>
              Total: {formatCurrency(summary.total)} • Por persona: {formatCurrency(summary.perPerson)}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] rounded-md border p-4">
            {summary?.participants.map((participant) => (
              <div key={participant.id} className="mb-4 last:mb-0">
                <h4 className="font-medium">{participant.name}</h4>
                <div className="text-sm text-muted-foreground">
                  <p>Pagó: {formatCurrency(participant.paid)}</p>
                  {participant.receives > 0 ? (
                    <p className="text-green-600">Recibe: {formatCurrency(participant.receives)}</p>
                  ) : participant.receives < 0 ? (
                    <p className="text-red-600">Debe: {formatCurrency(Math.abs(participant.receives))}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
