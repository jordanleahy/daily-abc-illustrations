-- Rename the chat agent from "ABC Cards" to "Chat Agent"
UPDATE public.agents 
SET name = 'Chat Agent', 
    last_modified = now()
WHERE type = 'chat';