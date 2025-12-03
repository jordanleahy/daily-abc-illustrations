-- Enable realtime for user_subscription_cache table
ALTER TABLE public.user_subscription_cache REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscription_cache;