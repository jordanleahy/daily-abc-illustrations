-- Remove unused illustration-director and graphic-designer agents
DELETE FROM agents 
WHERE type IN ('illustration-director', 'graphic-designer');

-- Add comment explaining cleanup
COMMENT ON TABLE agents IS 'Stores AI agent configurations for book creation workflows. Only book-related agents are actively used.';