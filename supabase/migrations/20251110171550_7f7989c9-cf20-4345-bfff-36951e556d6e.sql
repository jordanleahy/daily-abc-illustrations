-- Create reading_preferences table for storing user reading preferences
create table public.reading_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  hidden_overlay_pages text[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  constraint reading_preferences_user_id_unique unique(user_id)
);

-- Enable RLS
alter table public.reading_preferences enable row level security;

-- RLS Policies
create policy "Users can view their own reading preferences"
  on public.reading_preferences for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own reading preferences"
  on public.reading_preferences for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own reading preferences"
  on public.reading_preferences for update
  to authenticated
  using (auth.uid() = user_id);

-- Create function to update timestamps
create or replace function public.update_reading_preferences_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Auto-update timestamp trigger
create trigger reading_preferences_updated_at
  before update on public.reading_preferences
  for each row
  execute function public.update_reading_preferences_updated_at();