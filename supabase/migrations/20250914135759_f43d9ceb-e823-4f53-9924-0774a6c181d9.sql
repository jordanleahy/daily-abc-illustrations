-- Enable full replica identity for real-time updates
ALTER TABLE public.page_image_urls REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_image_urls;