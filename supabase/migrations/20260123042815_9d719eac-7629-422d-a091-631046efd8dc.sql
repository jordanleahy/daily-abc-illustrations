-- Add mandatory title approval [SUGGEST] block to all book creation agents
-- This updates the "After Discovery Phase" section to include the approval buttons

UPDATE agents 
SET instructions = REPLACE(
    instructions,
    '### Title and Description Approval
Once all discovery questions are answered, present a creative title and description for approval.',
    '### Title and Description Approval
Once all discovery questions are answered, present a creative title and description for approval.

**🚨 MANDATORY: Include this EXACT [SUGGEST] block after title/description:**

[SUGGEST]
approve: ✅ Create My Book!
revise: ✏️ Suggest Changes
[/SUGGEST]'
),
    what_changed = 'Added mandatory [SUGGEST] block for title/description approval step',
    last_modified = now()
WHERE type LIKE 'book-creation%' 
  AND is_latest = true 
  AND type != 'book-creation-rhyming'
  AND instructions LIKE '%### Title and Description Approval%Once all discovery questions are answered, present a creative title and description for approval.%';