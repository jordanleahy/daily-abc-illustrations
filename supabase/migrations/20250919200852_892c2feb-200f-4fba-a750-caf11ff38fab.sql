-- Add illustration config columns to book_system_prompts table
ALTER TABLE book_system_prompts ADD COLUMN illustration_config jsonb;
ALTER TABLE book_system_prompts ADD COLUMN config_version text DEFAULT 'v1.0.0';
ALTER TABLE book_system_prompts ADD COLUMN config_hash text;