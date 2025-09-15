-- Phase 3: Remove the old status column from agents table
-- This completes the safe migration to operational_status

-- Remove the old status column (all code now uses operational_status)
ALTER TABLE public.agents 
DROP COLUMN status;

-- Update the comment on operational_status column to reflect it's now the primary status field
COMMENT ON COLUMN public.agents.operational_status IS 'Current operational status of the agent (online, offline, processing)';