-- Remove Legacy Time-based Functions
-- Clean up old queue processing and activation time functions

-- Drop the old activation time function (superseded by fixed schedule)
DROP FUNCTION IF EXISTS public.get_next_activation_time();

-- Drop the old queue processing function (superseded by fixed schedule)
DROP FUNCTION IF EXISTS public.process_daily_published_queue();