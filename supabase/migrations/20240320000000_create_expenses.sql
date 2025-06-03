-- Create expenses table
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  title text not null,
  amount numeric(10,2) not null,
  paid_by_participant_id uuid references public.event_participants(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.expenses enable row level security;

-- Allow read access for all authenticated users
create policy "Enable read access for all users"
  on public.expenses for select
  using (true);

-- Allow insert for authenticated users
create policy "Enable insert for authenticated users"
  on public.expenses for insert
  with check (true);

-- Allow delete for authenticated users
create policy "Enable delete for authenticated users"
  on public.expenses for delete
  using (true); 