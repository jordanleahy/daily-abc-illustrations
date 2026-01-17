-- Remove all UI-based discovery questions for CVC agent
-- The agent will handle all discovery conversationally through its 7-step flow
DELETE FROM type_specific_discoveries 
WHERE agent_type = 'book-creation-cvc';