import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================
// SUPABASE SQL SCHEMA — run this in your Supabase SQL Editor
// ============================================================
//
// -- FACILITIES TABLE
// create table facilities (
//   id uuid default gen_random_uuid() primary key,
//   name text not null,
//   address text not null,
//   city text,
//   state text,
//   zip text,
//   lat float,
//   lng float,
//   place_id text unique,
//   facility_type text default 'both', -- 'shipper', 'receiver', 'both'
//   created_at timestamp with time zone default now()
// );
//
// -- REVIEWS TABLE
// create table reviews (
//   id uuid default gen_random_uuid() primary key,
//   facility_id uuid references facilities(id) on delete cascade,
//   user_id uuid references auth.users(id) on delete cascade,
//   driver_name text,
//   overall_rating int check (overall_rating between 1 and 5),
//   wait_time_minutes int,
//   detention_honored boolean,
//   lumper_required boolean,
//   lumper_cost numeric(8,2),
//   bathroom_access boolean,
//   driver_respect_rating int check (driver_respect_rating between 1 and 5),
//   notes text,
//   photos text[],
//   created_at timestamp with time zone default now()
// );
//
// -- DETENTION LOGS TABLE
// create table detention_logs (
//   id uuid default gen_random_uuid() primary key,
//   user_id uuid references auth.users(id) on delete cascade,
//   facility_id uuid references facilities(id),
//   facility_name text,
//   facility_address text,
//   arrived_at timestamp with time zone,
//   departed_at timestamp with time zone,
//   free_time_minutes int default 120,
//   detention_minutes int,
//   notes text,
//   broker_name text,
//   load_number text,
//   exported boolean default false,
//   created_at timestamp with time zone default now()
// );
//
// -- PROFILES TABLE
// create table profiles (
//   id uuid references auth.users(id) primary key,
//   full_name text,
//   cdl_state text,
//   truck_type text,
//   review_count int default 0,
//   created_at timestamp with time zone default now()
// );
//
// -- RLS POLICIES
// alter table facilities enable row level security;
// alter table reviews enable row level security;
// alter table detention_logs enable row level security;
// alter table profiles enable row level security;
//
// create policy "Anyone can read facilities" on facilities for select using (true);
// create policy "Authenticated users can insert facilities" on facilities for insert with check (auth.role() = 'authenticated');
//
// create policy "Anyone can read reviews" on reviews for select using (true);
// create policy "Authenticated users can insert reviews" on reviews for insert with check (auth.uid() = user_id);
// create policy "Users can update own reviews" on reviews for update using (auth.uid() = user_id);
//
// create policy "Users can read own detention logs" on detention_logs for select using (auth.uid() = user_id);
// create policy "Users can insert own detention logs" on detention_logs for insert with check (auth.uid() = user_id);
// create policy "Users can update own detention logs" on detention_logs for update using (auth.uid() = user_id);
//
// create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
// create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
// create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
//
// -- FUNCTION: auto-create profile on signup
// create or replace function handle_new_user()
// returns trigger as $$
// begin
//   insert into public.profiles (id, full_name)
//   values (new.id, new.raw_user_meta_data->>'full_name');
//   return new;
// end;
// $$ language plpgsql security definer;
//
// create trigger on_auth_user_created
//   after insert on auth.users
//   for each row execute procedure handle_new_user();
//
// -- SEED DATA (optional sample facilities)
// insert into facilities (name, address, city, state, zip, lat, lng, facility_type) values
// ('Amazon Fulfillment Center MDW2', '250 Emerald Dr', 'Joliet', 'IL', '60433', 41.5219, -88.0856, 'receiver'),
// ('Walmart Distribution Center #6097', '2400 SE 14th St', 'Bentonville', 'AR', '72712', 36.3729, -94.2088, 'both'),
// ('Home Depot RDC Atlanta', '4000 Hamilton Mill Rd', 'Buford', 'GA', '30519', 34.1087, -83.9874, 'receiver'),
// ('Target Distribution Center', '3400 Target Dr', 'Bloomington', 'MN', '55425', 44.8408, -93.3244, 'receiver'),
// ('SYSCO Indianapolis', '4600 W 86th St', 'Indianapolis', 'IN', '46268', 39.9012, -86.2344, 'both');
