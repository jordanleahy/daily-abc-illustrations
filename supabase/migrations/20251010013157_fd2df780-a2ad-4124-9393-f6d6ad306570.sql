-- Create user_subscriptions table to cache Stripe subscription data
create table public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_product_id text,
  stripe_price_id text,
  status text not null, -- 'active', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid'
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Ensure one user can have multiple subscriptions but each subscription is unique
  unique(stripe_subscription_id)
);

-- Add indexes for fast lookups
create index idx_user_subscriptions_user_id on public.user_subscriptions(user_id);
create index idx_user_subscriptions_stripe_subscription_id on public.user_subscriptions(stripe_subscription_id);
create index idx_user_subscriptions_status on public.user_subscriptions(status);

-- Enable RLS
alter table public.user_subscriptions enable row level security;

-- Users can view their own subscriptions
create policy "Users can view own subscriptions"
  on public.user_subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Service role can manage all subscriptions (for webhook updates)
create policy "Service role can manage all subscriptions"
  on public.user_subscriptions
  for all
  to service_role
  using (true)
  with check (true);

-- Add updated_at trigger
create trigger update_user_subscriptions_updated_at
  before update on public.user_subscriptions
  for each row
  execute function public.update_updated_at_column();