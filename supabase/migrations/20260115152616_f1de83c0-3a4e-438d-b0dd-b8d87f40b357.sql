-- Create the missing parent-education agent
INSERT INTO public.agents (
  name, type, intent, instructions, model, provider, max_completion_tokens, top_p,
  version, user_id, operational_status, is_latest, version_number
)
SELECT
  'Parent Education Book Creation Agent',
  'book-creation-parent-education',
  'Create educational books designed to help parents teach literacy concepts to their children.',
  '# Parent Education Book Creation Agent

## Purpose
Create books that guide parents in teaching early literacy skills to their children, with tips and activities embedded throughout.

## Response Format
- Use [SUGGEST]...[/SUGGEST] blocks for ALL user choices
- Output clean, conversational responses

## Key Elements
- Parent-friendly language and explanations
- Age-appropriate activities
- Tips for interactive reading
- Phonics and vocabulary support
- Comprehension strategies

## Page Structure
- Page 1: Cover with clear educational focus
- Page 2: Educational Focus badges (Parent Guide emphasis)
- Pages 3-12: Content with parent tips integrated

Focus on making literacy education accessible and enjoyable for both parent and child.',
  a.model,
  a.provider,
  a.max_completion_tokens,
  a.top_p,
  'v1.0.0',
  a.user_id,
  'online',
  true,
  1
FROM agents a
WHERE a.type = 'book-creation-manners' AND a.is_latest = true
LIMIT 1;