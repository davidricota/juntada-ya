import { supabase } from "@/integrations/supabase/client";
import { Expense, ExpenseChangePayload, ExpenseSummary } from "@/types";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"] & {
  event_participants: { name: string } | null;
};

export class ExpenseService {
  static async getExpenses(eventId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select(
        `
        id,
        event_id,
        title,
        amount,
        paid_by_participant_id,
        created_at,
        event_participants!paid_by_participant_id (
          name
        )
      `
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((expense: ExpenseRow) => ({
      ...expense,
      participant_name: expense.event_participants?.name || "Desconocido",
    })) as Expense[];
  }

  static async addExpense(
    eventId: string,
    participantId: string,
    title: string,
    amount: number
  ): Promise<Expense> {
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        event_id: eventId,
        paid_by_participant_id: participantId,
        title,
        amount,
      })
      .select(
        `
        id,
        event_id,
        title,
        amount,
        paid_by_participant_id,
        created_at,
        event_participants!paid_by_participant_id (
          name
        )
      `
      )
      .single();

    if (error) throw error;
    return {
      ...data,
      participant_name: data.event_participants?.name || "Desconocido",
    } as Expense;
  }

  static async removeExpense(expenseId: string) {
    const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
    if (error) throw error;
  }

  static async getExpenseSummary(eventId: string): Promise<ExpenseSummary> {
    const expenses = await this.getExpenses(eventId);
    const { data: participants, error } = await supabase
      .from("event_participants")
      .select("id, name")
      .eq("event_id", eventId);

    if (error) throw error;

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const perPerson = total / participants.length;

    const participantSummary = participants.map((participant) => {
      const paid = expenses
        .filter((expense) => expense.paid_by_participant_id === participant.id)
        .reduce((sum, expense) => sum + expense.amount, 0);

      const owes = perPerson;
      const receives = paid - owes;

      return {
        id: participant.id,
        name: participant.name,
        paid,
        owes,
        receives,
      };
    });

    return {
      total,
      perPerson,
      participants: participantSummary,
    };
  }

  static subscribeToExpenses(eventId: string, callback: (payload: ExpenseChangePayload) => void) {
    return supabase
      .channel(`expenses_event_${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          callback(payload as unknown as ExpenseChangePayload);
        }
      )
      .subscribe();
  }

  static unsubscribeFromExpenses(subscription: ReturnType<typeof supabase.channel>) {
    supabase.removeChannel(subscription);
  }
}
