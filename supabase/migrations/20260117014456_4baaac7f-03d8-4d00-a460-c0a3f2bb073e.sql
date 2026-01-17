-- Rename to better reflect its orchestration role
UPDATE public.agents 
SET name = 'Orchestration Agent', 
    intent = 'Orchestrates book creation conversations, asks questions, and coordinates with specialized book agents',
    last_modified = now()
WHERE type = 'chat';