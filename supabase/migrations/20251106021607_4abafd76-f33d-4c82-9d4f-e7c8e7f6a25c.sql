-- Enable REPLICA IDENTITY FULL to send complete row data in real-time change events
-- This ensures complete page image data is available for real-time synchronization
ALTER TABLE page_image_urls REPLICA IDENTITY FULL;