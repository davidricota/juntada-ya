import { supabase } from "@/shared/integrations/supabase/client";
import { Expense, ExpenseChangePayload, ExpenseSummary } from "@/app/types";

export class ExpenseService {
  static async getExpenses(planId: string): Promise<Expense[]> {
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
      .eq("event_id", planId)
      .order("created_at", { ascending: false });

    if (error) throw error instanceof Error ? error : new Error(String(error));
    if (!Array.isArray(data)) return [];
    return data.map((expense) => ({
      ...expense,
      participant_name:
        typeof expense.event_participants?.name === "string" &&
        expense.event_participants.name.length > 0
          ? expense.event_participants.name
          : "Desconocido",
    })) as Expense[];
  }

  static async addExpense(
    planId: string,
    participantId: string,
    title: string,
    amount: number
  ): Promise<Expense> {
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        event_id: planId,
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

    if (error) throw error instanceof Error ? error : new Error(String(error));
    if (!data) throw new Error("No data returned from addExpense");
    return {
      ...data,
      participant_name:
        typeof data.event_participants?.name === "string" && data.event_participants.name.length > 0
          ? data.event_participants.name
          : "Desconocido",
    } as Expense;
  }

  static async removeExpense(expenseId: string) {
    const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
    if (error) throw error instanceof Error ? error : new Error(String(error));
  }

  static async getExpenseSummary(planId: string): Promise<ExpenseSummary> {
    const expenses = await this.getExpenses(planId);
    const { data: participants, error } = await supabase
      .from("event_participants")
      .select("id, name, is_extra")
      .eq("event_id", planId);

    if (error) throw error instanceof Error ? error : new Error(String(error));

    if (!Array.isArray(participants) || participants.length === 0) {
      return {
        total: 0,
        perPerson: 0,
        participants: [],
      };
    }

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
        is_extra: participant.is_extra,
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

  static subscribeToExpenses(planId: string, callback: (payload: ExpenseChangePayload) => void) {
    return supabase
      .channel(`expenses_event_${planId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `event_id=eq.${planId}`,
        },
        (payload) => {
          callback(payload as unknown as ExpenseChangePayload);
        }
      )
      .subscribe();
  }

  static unsubscribeFromExpenses(subscription: ReturnType<typeof supabase.channel>) {
    void supabase.removeChannel(subscription);
  }

  static async addExtraParticipant(planId: string, name: string): Promise<void> {
    const { error } = await supabase.from("event_participants").insert({
      event_id: planId,
      name,
      is_extra: true,
    });
    if (error) throw error instanceof Error ? error : new Error(String(error));
  }
}
