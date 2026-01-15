-- Clean up duplicate type_specific_discoveries entries
-- Keep only the properly configured book-creation-manners entries and remove stray duplicates

DELETE FROM type_specific_discoveries 
WHERE agent_type = 'book-creation-manners' 
AND question_key IN ('season', 'location', 'city')
AND sort_order > 4;