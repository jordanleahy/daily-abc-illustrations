-- Remove daily_published_id column from user_book_activity
-- This field is no longer used after simplifying tracking to use book_id only

-- Drop the foreign key constraint first
ALTER TABLE public.user_book_activity
DROP CONSTRAINT IF EXISTS user_book_activity_daily_published_id_fkey;

-- Drop the column
ALTER TABLE public.user_book_activity
DROP COLUMN IF EXISTS daily_published_id;