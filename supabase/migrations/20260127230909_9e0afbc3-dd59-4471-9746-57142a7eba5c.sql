-- Fix hardcoded audience references in book-creation-general and book-creation-sight-words agents
-- Add NO HARDCODED AUDIENCE directive and remove specific age ranges

-- Update book-creation-general agent
UPDATE agents
SET 
  instructions = CASE 
    WHEN instructions NOT LIKE '%## CRITICAL: NO HARDCODED AUDIENCE%' THEN
      regexp_replace(
        regexp_replace(instructions, 'children ages 2-8', 'young learners', 'gi'),
        '(# [^\n]+\n)',
        E'\\1\n## CRITICAL: NO HARDCODED AUDIENCE\n\n❌ NEVER assume or reference a specific age group (toddler, preschool, etc.)\n❌ NEVER echo age-related terms from user messages in your responses\n❌ NEVER say things like "perfect for toddlers" or "great for young children"\n✅ Keep initial responses age-neutral\n✅ Let the grade_level discovery question determine the target audience\n✅ Generic phrases like "age-appropriate" are acceptable only AFTER grade is selected\n\n'
      )
    ELSE regexp_replace(instructions, 'children ages 2-8', 'young learners', 'gi')
  END,
  version_number = version_number + 1,
  what_changed = 'Removed hardcoded age range (children ages 2-8), added NO HARDCODED AUDIENCE directive for data-driven audience discovery',
  last_modified = now(),
  updated_at = now()
WHERE type = 'book-creation-general' AND is_latest = true;

-- Update book-creation-sight-words agent  
UPDATE agents
SET 
  instructions = CASE 
    WHEN instructions NOT LIKE '%## CRITICAL: NO HARDCODED AUDIENCE%' THEN
      regexp_replace(
        regexp_replace(instructions, 'children ages 4-8', 'young learners', 'gi'),
        '(# [^\n]+\n)',
        E'\\1\n## CRITICAL: NO HARDCODED AUDIENCE\n\n❌ NEVER assume or reference a specific age group (toddler, preschool, etc.)\n❌ NEVER echo age-related terms from user messages in your responses\n❌ NEVER say things like "perfect for toddlers" or "great for young children"\n✅ Keep initial responses age-neutral\n✅ Let the grade_level discovery question determine the target audience\n✅ Generic phrases like "age-appropriate" are acceptable only AFTER grade is selected\n\n'
      )
    ELSE regexp_replace(instructions, 'children ages 4-8', 'young learners', 'gi')
  END,
  version_number = version_number + 1,
  what_changed = 'Removed hardcoded age range (children ages 4-8), added NO HARDCODED AUDIENCE directive for data-driven audience discovery',
  last_modified = now(),
  updated_at = now()
WHERE type = 'book-creation-sight-words' AND is_latest = true;