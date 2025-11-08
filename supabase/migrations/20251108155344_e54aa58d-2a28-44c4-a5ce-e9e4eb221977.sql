-- Add kid-specific reading tracking columns to user_book_activity table
ALTER TABLE user_book_activity 
ADD COLUMN IF NOT EXISTS kid_id UUID REFERENCES kid_profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS pages_read INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reading_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_reading_session_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient kid reading queries
CREATE INDEX IF NOT EXISTS idx_user_book_activity_kid_reading 
ON user_book_activity(kid_id, last_reading_session_at DESC NULLS LAST) 
WHERE last_reading_session_at IS NOT NULL;

-- Update RLS policy to allow kid-specific queries
DROP POLICY IF EXISTS "Parents can view their kids book activity" ON user_book_activity;

CREATE POLICY "Parents can view their kids book activity"
ON user_book_activity FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM kid_profiles 
    WHERE kid_profiles.id = user_book_activity.kid_id 
    AND kid_profiles.parent_user_id = auth.uid()
  )
);