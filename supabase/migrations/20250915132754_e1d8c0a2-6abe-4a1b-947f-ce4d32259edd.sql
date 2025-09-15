-- Phase 1: Add new operational_status column to agents table
-- This is a safe, non-breaking change that adds the new column alongside the existing one

-- Add the new operational_status column with the same constraints as status
ALTER TABLE public.agents 
ADD COLUMN operational_status text NOT NULL DEFAULT 'offline';

-- Copy all existing data from status to operational_status
UPDATE public.agents 
SET operational_status = status;

-- Add a comment to document the migration phase
COMMENT ON COLUMN public.agents.operational_status IS 'Phase 1: New descriptive status column - will replace generic status column';