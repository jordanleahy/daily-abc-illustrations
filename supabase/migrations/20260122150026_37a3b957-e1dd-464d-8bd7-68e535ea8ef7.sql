-- Fix sort_order for Digraphs flow: DIGRAPH_FOCUS at 2, DIGRAPH_SELECTION at 2.5 (conditional), SEASON at 3
-- The edge function will handle the conditional display logic

-- First, update DIGRAPH_SELECTION to have a parent_question_id relationship
-- This indicates it's conditional on a specific answer to DIGRAPH_FOCUS

-- Add conditional_on columns to agent_questions to support conditional questions
ALTER TABLE agent_questions 
ADD COLUMN IF NOT EXISTS conditional_on_question_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS conditional_on_answer_id TEXT DEFAULT NULL;

-- Update DIGRAPH_SELECTION to be conditional on DIGRAPH_FOCUS = DIGRAPH_SPECIFIC
UPDATE agent_questions 
SET 
  sort_order = 2.5,
  conditional_on_question_id = 'DIGRAPH_FOCUS',
  conditional_on_answer_id = 'DIGRAPH_SPECIFIC'
WHERE agent_type = 'book-creation-digraphs' AND question_id = 'DIGRAPH_SELECTION';

-- Ensure DIGRAPH_FOCUS stays at sort_order 2
UPDATE agent_questions 
SET sort_order = 2
WHERE agent_type = 'book-creation-digraphs' AND question_id = 'DIGRAPH_FOCUS';

-- Ensure SEASON is at sort_order 3
UPDATE agent_questions 
SET sort_order = 3
WHERE agent_type = 'book-creation-digraphs' AND question_id = 'SEASON';