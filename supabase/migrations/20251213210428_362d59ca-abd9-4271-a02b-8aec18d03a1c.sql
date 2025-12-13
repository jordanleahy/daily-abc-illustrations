-- Step 1: Add completion_count column to user_book_activity
ALTER TABLE public.user_book_activity
ADD COLUMN IF NOT EXISTS completion_count INTEGER NOT NULL DEFAULT 0;

-- Backfill completion_count from existing reading_completed data
UPDATE public.user_book_activity
SET completion_count = 1
WHERE reading_completed = true AND completion_count = 0;