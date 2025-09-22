-- Enable real-time subscriptions for seo_metadata table
-- This allows the UI to receive immediate updates when thumbnails are generated

-- Set REPLICA IDENTITY FULL to capture complete row data during updates
ALTER TABLE public.seo_metadata REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication to enable real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.seo_metadata;