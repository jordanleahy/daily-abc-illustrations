-- Enable real-time updates for agents table
ALTER TABLE public.agents REPLICA IDENTITY FULL;

-- Add agents table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;