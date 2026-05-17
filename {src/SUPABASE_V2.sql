-- RUN THIS IN SUPABASE SQL EDITOR (new query)
-- Adds the broker_reviews table needed for v2

create table broker_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  broker_name text not null,
  overall_rating int check (overall_rating between 1 and 5),
  payment_speed_days int,
  paid_detention boolean,
  communication_rating int check (communication_rating between 1 and 5),
  would_work_again boolean,
  notes text,
  load_type text,
  created_at timestamp with time zone default now()
);

alter table broker_reviews enable row level security;

create policy "Anyone can read broker reviews" on broker_reviews for select using (true);
create policy "Authenticated users can insert broker reviews" on broker_reviews for insert with check (auth.uid() = user_id);
create policy "Users can update own broker reviews" on broker_reviews for update using (auth.uid() = user_id);
