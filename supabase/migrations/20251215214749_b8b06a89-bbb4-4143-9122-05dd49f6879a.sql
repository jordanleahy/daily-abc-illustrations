-- Move digraphs to first position (before ABC)
UPDATE book_types 
SET sort_order = -1
WHERE id = 'digraphs';