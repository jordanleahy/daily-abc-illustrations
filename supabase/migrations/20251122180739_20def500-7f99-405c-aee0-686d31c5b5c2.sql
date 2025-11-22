-- Enable real-time updates for user_book_activity table
-- This allows the analytics dashboard to update instantly when users read pages

-- Set replica identity to FULL to capture complete row data during updates
ALTER TABLE user_book_activity REPLICA IDENTITY FULL;

-- Add the table to the realtime publication to activate real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE user_book_activity;