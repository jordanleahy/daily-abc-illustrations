-- Remove the old process-daily-published-queue cron job since it no longer exists
SELECT cron.unschedule('process-daily-published-queue');