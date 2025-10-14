-- Unschedule the automatic daily habit completions cron job
-- This ensures only manually scheduled habits (via habit_schedule table) appear on /home
SELECT cron.unschedule('create-daily-habit-completions');