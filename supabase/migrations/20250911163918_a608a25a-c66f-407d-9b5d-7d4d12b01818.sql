-- Add versioning support to agents table
ALTER TABLE public.agents ADD COLUMN version_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.agents ADD COLUMN is_latest BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.agents ADD COLUMN parent_agent_id UUID REFERENCES public.agents(id);

-- Create index for efficient latest version queries
CREATE INDEX idx_agents_user_latest ON public.agents(user_id, is_latest) WHERE is_latest = true;
CREATE INDEX idx_agents_version_history ON public.agents(parent_agent_id, version_number);

-- Create function to handle version management
CREATE OR REPLACE FUNCTION public.create_new_agent_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark all previous versions as not latest for this user
  UPDATE public.agents 
  SET is_latest = false 
  WHERE user_id = NEW.user_id 
    AND (parent_agent_id = NEW.parent_agent_id OR id = NEW.parent_agent_id OR (parent_agent_id IS NULL AND NEW.parent_agent_id IS NULL))
    AND id != NEW.id;
    
  -- Set this as the latest version
  NEW.is_latest = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically manage versions
CREATE TRIGGER trigger_manage_agent_versions
  BEFORE INSERT ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.create_new_agent_version();

-- Update existing records to have proper versioning
UPDATE public.agents SET version_number = 1, is_latest = true WHERE version_number IS NULL;