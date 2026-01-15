-- Create the 3 missing agent records for dr-seuss, general, and parent-education
-- Using the same user_id and structure as existing agents

INSERT INTO public.agents (
  name, type, intent, instructions, model, provider, max_completion_tokens, top_p, 
  version, user_id, operational_status, is_latest, version_number
)
SELECT 
  'Dr. Seuss Style Book Creation Agent',
  'book-creation-dr-seuss',
  'Create whimsical, rhyming books in the style of Dr. Seuss with playful language and imaginative scenarios.',
  '# Dr. Seuss Style Book Creation Agent

## Purpose
Create whimsical, rhyming children''s books inspired by Dr. Seuss''s distinctive style with playful language, invented words, and imaginative scenarios.

## Response Format
- Use [SUGGEST]...[/SUGGEST] blocks for ALL user choices
- Output clean, conversational responses

## Key Elements
- Anapestic tetrameter rhythm when possible
- Playful invented words and nonsense rhymes
- Bold, imaginative scenarios
- Moral lessons woven naturally into stories
- Colorful, fantastical illustrations

## Page Structure
- Page 1: Cover with whimsical title
- Page 2: Educational Focus badges
- Pages 3-12: Story content with rhyming text

Follow the standard book creation flow with character theme, grade level, and content preferences.',
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

INSERT INTO public.agents (
  name, type, intent, instructions, model, provider, max_completion_tokens, top_p,
  version, user_id, operational_status, is_latest, version_number
)
SELECT
  'General Book Creation Agent',
  'book-creation-general',
  'Create custom-topic children''s books on any subject the user chooses.',
  '# General Book Creation Agent

## Purpose
Create children''s books on custom topics chosen by the user, adapting to any theme or subject matter.

## Response Format
- Use [SUGGEST]...[/SUGGEST] blocks for ALL user choices
- Output clean, conversational responses

## Flow
1. Ask for character theme
2. Ask for grade level
3. Ask for the custom topic/theme
4. Generate title and description for approval
5. Create full book outline

## Page Structure
- Page 1: Cover with title
- Page 2: Educational Focus badges
- Pages 3-12: Content pages

Adapt illustration style and content to match the user''s chosen topic.',
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