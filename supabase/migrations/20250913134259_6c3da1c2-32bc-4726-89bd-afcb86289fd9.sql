-- Enable real-time updates for pages table
ALTER TABLE public.pages REPLICA IDENTITY FULL;

-- Add pages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.pages;