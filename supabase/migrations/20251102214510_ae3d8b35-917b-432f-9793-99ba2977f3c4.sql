-- Add qa_page_prompts column to gemini_chat_sessions table
-- This will store generated prompts for each page during QA review

ALTER TABLE gemini_chat_sessions 
ADD COLUMN IF NOT EXISTS qa_page_prompts JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN gemini_chat_sessions.qa_page_prompts IS 'Generated image prompts for each page during QA review. Key is page number (0 for cover), value is the prompt text.';