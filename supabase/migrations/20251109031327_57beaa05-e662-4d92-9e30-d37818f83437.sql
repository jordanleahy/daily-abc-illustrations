-- Clean up orphaned draft daily_published records from old auto-creation behavior
-- These were created before Phase 0.6 refactoring

DELETE FROM daily_published 
WHERE status = 'draft';