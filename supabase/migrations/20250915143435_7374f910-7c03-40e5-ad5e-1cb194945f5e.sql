-- Update the prompt_status column with values from the status column
UPDATE public.page_system_prompts 
SET prompt_status = COALESCE(status, 'complete') 
WHERE prompt_status IS NULL;