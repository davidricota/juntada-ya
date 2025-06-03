export interface Participant {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Expense {
  id: string;
  event_id: string;
  participant_id: string;
  participant_name: string;
  title: string;
  amount: number;
  created_at: string;
}

export interface ExpenseSummary {
  total: number;
  perPerson: number;
  participants: {
    id: string;
    name: string;
    paid: number;
    owes: number;
    receives: number;
  }[];
}

export interface ExpenseChangePayload {
  eventType: "INSERT" | "DELETE";
  new?: Expense;
  old?: Expense;
}

export interface Poll {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  created_by_participant_id: string;
  created_at: string;
  closed_at?: string;
  allow_multiple_votes: boolean;
}

export interface PollOption {
  id: string;
  poll_id: string;
  title: string;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  participant_id: string;
  created_at: string;
}
