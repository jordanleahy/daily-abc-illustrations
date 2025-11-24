-- ============================================================================
-- Migration: Expand Agent Types for Specialized Book Creation
-- Description: Adds specialized book-creation agent types and performance tracking
-- ============================================================================

-- Step 1: Update any existing agents with non-standard types to book-creation
UPDATE agents 
SET type = 'book-creation' 
WHERE type NOT IN ('chat', 'book-creation', 'illustration-director', 'graphic-designer');

-- Step 2: Drop existing constraint on agents.type
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_type_check;

-- Step 3: Add new constraint with specialized book-creation types AND existing types
ALTER TABLE agents ADD CONSTRAINT agents_type_check 
CHECK (type IN (
  'chat',
  'book-creation',           -- Keep generic for fallback
  'illustration-director',   -- Keep existing agent type
  'graphic-designer',        -- Keep existing agent type
  'book-creation-numbers',   -- Specialized for counting/number concepts
  'book-creation-rhyming',   -- Specialized for rhymes/phonics
  'book-creation-colors',    -- Specialized for color learning
  'book-creation-abc',       -- Specialized for alphabet learning
  'book-creation-shapes',
  'book-creation-animals',
  'book-creation-sight-words',
  'book-creation-emotions',
  'book-creation-cvc',
  'book-creation-opposites',
  'book-creation-first-words',
  'book-creation-bedtime'
));

-- Step 4: Create agent performance tracking table for learning infrastructure
CREATE TABLE IF NOT EXISTS agent_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  
  -- Success metrics
  book_created BOOLEAN DEFAULT false,
  user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
  user_edited_pages INTEGER DEFAULT 0,
  total_pages INTEGER,
  
  -- Pattern tracking
  prompt_patterns JSONB DEFAULT '{}',
  metadata_captured JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- Validation
  CONSTRAINT valid_agent_type CHECK (agent_type LIKE 'book-creation%' OR agent_type = 'chat' OR agent_type = 'illustration-director' OR agent_type = 'graphic-designer')
);

-- Step 5: Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_agent_performance_type ON agent_performance_metrics(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_performance_created ON agent_performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_performance_satisfaction ON agent_performance_metrics(user_satisfaction);
CREATE INDEX IF NOT EXISTS idx_agent_performance_book ON agent_performance_metrics(book_id);

-- Step 6: Enable RLS on agent_performance_metrics
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Step 7: Add RLS policies for agent_performance_metrics
CREATE POLICY "Admins can view all agent performance metrics" 
  ON agent_performance_metrics FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert agent performance metrics" 
  ON agent_performance_metrics FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update agent performance metrics" 
  ON agent_performance_metrics FOR UPDATE 
  USING (true);

-- Step 8: Add comment explaining the table
COMMENT ON TABLE agent_performance_metrics IS 'Tracks agent usage and performance metrics for continuous learning and improvement. Used to identify successful patterns and suggest improvements like "80% of Numbers users who added [X] pattern saw better results".';

COMMENT ON COLUMN agent_performance_metrics.prompt_patterns IS 'JSON object storing successful prompt patterns detected in the agent''s output';

COMMENT ON COLUMN agent_performance_metrics.metadata_captured IS 'JSON object storing book metadata for cross-analysis (book type, target age, themes, etc.)';