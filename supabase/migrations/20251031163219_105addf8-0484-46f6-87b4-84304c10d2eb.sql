-- Add qa_page_images column to gemini_chat_sessions to store QA checkpoint images
ALTER TABLE gemini_chat_sessions 
ADD COLUMN qa_page_images jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN gemini_chat_sessions.qa_page_images IS 'Stores QA checkpoint images as a JSON object where keys are page numbers and values are base64 image data URLs';