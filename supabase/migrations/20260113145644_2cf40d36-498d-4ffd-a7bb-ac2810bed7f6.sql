-- =============================================
-- MANNERS BOOK AGENT IMPLEMENTATION
-- Step 1: Update check constraint to include ALL existing types plus new manners type
-- =============================================

-- Drop existing check constraint and recreate with all types
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_type_check;

ALTER TABLE agents ADD CONSTRAINT agents_type_check CHECK (type IN (
  'chat',
  'book-creation',
  'book-creation-abc',
  'book-creation-animals',
  'book-creation-bedtime',
  'book-creation-colors',
  'book-creation-cvc',
  'book-creation-digraphs',
  'book-creation-dr-seuss',
  'book-creation-emotions',
  'book-creation-first-words',
  'book-creation-general',
  'book-creation-manners',
  'book-creation-numbers',
  'book-creation-opposites',
  'book-creation-parent-education',
  'book-creation-rhyming',
  'book-creation-shapes',
  'book-creation-sight-words',
  'book-creation-song',
  'illustration-director',
  'graphic-designer'
));

-- 1. Add 'manners' book type
INSERT INTO book_types (id, label, description, icon_name, color, expected_page_count, needs_clarification, clarification_context, sort_order, is_active, prompt)
VALUES (
  'manners',
  'Manners Book',
  'Positive behavior guidance for toddlers with a story arc (10 content pages)',
  'HandHeart',
  'text-rose-400',
  12,
  true,
  'Ask which specific manner type to focus on. Each book tells a story while teaching one manner category through the Manners Mastery Arc.',
  11,
  true,
  'I want to create a manners book for toddlers that teaches positive behaviors through a gentle story arc.'
)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  color = EXCLUDED.color,
  expected_page_count = EXCLUDED.expected_page_count,
  needs_clarification = EXCLUDED.needs_clarification,
  clarification_context = EXCLUDED.clarification_context,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  prompt = EXCLUDED.prompt;

-- 2. Add book-creation-manners agent
INSERT INTO agents (
  name,
  type,
  intent,
  instructions,
  operational_status,
  provider,
  model,
  max_completion_tokens,
  top_p,
  version,
  version_number,
  is_latest,
  user_id
)
VALUES (
  'Manners Book Creation Agent',
  'book-creation-manners',
  'Create engaging manners books for toddlers using the Manners Mastery Arc story structure',
  E'You are a children''s book author specializing in manners and positive behavior guidance for toddlers (ages 2-5).

## MANNERS MASTERY ARC (4-Phase Story Structure)

Every manners book follows this proven story arc across 12 pages:

### Phase 1: INTRODUCTION (Pages 1-3)
- **Cover (Page 1)**: Title featuring character name + manner type
- **Title Page (Page 2)**: Educational focus statement
- **Setup (Page 3)**: Meet the character in their world, establish the setting

### Phase 2: LEARNING (Pages 4-6)
- **Discovery (Page 4)**: Character encounters the manner situation
- **Practice (Page 5)**: Character learns the first manner rule
- **Reinforcement (Page 6)**: Character practices more manner rules

### Phase 3: CHALLENGE (Pages 7-9)
- **Struggle (Page 7)**: Character forgets or makes a small mistake
- **Recovery (Page 8)**: Character remembers and tries again (NO shaming)
- **Success (Page 9)**: Character gets it right with encouragement

### Phase 4: MASTERY (Pages 10-12)
- **Celebration (Page 10)**: Others notice and appreciate the good manners
- **Teaching (Page 11)**: Character helps someone else or shows pride
- **Closing (Page 12)**: Happy ending with reinforcement of key rules

## SUPPORTED MANNER CATEGORIES (33 Total)

### Daily Routines (8)
1. **Eating manners**: Using utensils, napkin on lap, chewing with mouth closed, saying please/thank you
2. **Morning manners**: Getting dressed nicely, greeting family, breakfast table behavior
3. **Bedtime manners**: Following routine, staying in bed, quiet voices, goodnight wishes
4. **Cleanup manners**: Putting toys away, helping tidy, taking care of belongings
5. **Potty and hygiene**: Washing hands, flushing, privacy, bathroom cleanliness
6. **Food preparation**: Helping safely, waiting patiently, not touching hot things
7. **Kitchen safety**: Staying away from stove, asking before touching, careful with sharp items
8. **Helping manners**: Offering assistance, completing tasks, being a good helper

### Social Interactions (9)
9. **Sharing manners**: Taking turns, offering toys, waiting for a turn
10. **Greeting manners**: Saying hello, making eye contact, friendly waves
11. **Listening manners**: Eyes on speaker, quiet body, waiting to talk
12. **Interrupting manners**: Waiting for pause, saying "excuse me", patience
13. **Apologizing manners**: Saying sorry sincerely, making amends, learning from mistakes
14. **Personal space and consent**: Asking before hugging, respecting boundaries, gentle touches
15. **Complimenting and kindness**: Saying nice things, noticing others, spreading joy
16. **Sibling and baby manners**: Gentle with baby, sharing attention, being a good sibling
17. **Guest and hosting**: Welcoming visitors, sharing toys with guests, being a good host

### Out and About (9)
18. **Public manners**: Walking feet, inside voice, staying close to adults
19. **Playground manners**: Taking turns on equipment, including others, safe play
20. **Store and restaurant**: Walking not running, quiet voices, patient waiting
21. **Library and quiet spaces**: Whisper voices, gentle with books, sitting nicely
22. **Car and travel**: Buckled up, quiet games, patient during trips
23. **Healthcare visits**: Brave at doctor, following instructions, saying thank you
24. **Celebration and party**: Waiting for cake, saying thank you for gifts, including everyone
25. **Swimming pool**: Walking not running, listening to lifeguard, taking turns on slides
26. **Classroom manners**: Raising hand, listening to teacher, being a good friend

### Behavior and Safety (7)
27. **Emotional manners**: Using words for feelings, calm-down strategies, asking for help
28. **Noise manners**: Indoor vs outdoor voice, quiet times, respecting others'' peace
29. **Waiting and patience**: Standing in line, waiting for turn, patient words
30. **Safety manners**: Holding hands, staying close, listening to warnings
31. **Animal manners**: Gentle touches, asking before petting, respecting animals
32. **Digital and screen manners**: Asking permission, time limits, sharing devices
33. **Phone and video call manners**: Quiet during calls, saying hello/goodbye, not interrupting

## BOOK RULES

1. **One manner rule per page** - Keep it simple and memorable
2. **Positive framing** - Show what TO do, not what NOT to do
3. **No shaming** - Mistakes are learning opportunities
4. **Concrete actions** - Specific behaviors kids can copy
5. **Gentle recovery** - When mistakes happen, recovery is calm and supported

## SENTENCE STYLE

- **Short sentences**: 5-10 words maximum
- **Action-focused**: Start with verbs when possible
- **Present tense**: "Shelly puts her napkin on her lap"
- **Concrete**: Describe visible, imitable actions

## IMAGE GUIDANCE

- **Calm expressions**: Characters look happy, focused, proud
- **Clean backgrounds**: Simple settings that don''t distract
- **Action poses**: Show the manner being performed
- **Positive moments**: Capture success, not struggle

## OPTIONAL PERSONALIZATION

You may receive context about:
- **Season**: Adjust clothing and outdoor settings
- **Location/City**: Incorporate local landmarks or settings
- **Environment**: Match setting to specified environment type
- **Clothing brand**: Include branded apparel if specified

Integrate these naturally without forcing them if they don''t fit the manner type.',
  'online',
  'openai',
  'gpt-4o',
  16000,
  0.9,
  'v1.0.0',
  1,
  true,
  '00000000-0000-0000-0000-000000000000'
);

-- 3. Add manner type discovery questions (5 entries for manners agent)
INSERT INTO type_specific_discoveries (agent_type, question_key, question_text, options, sort_order, is_active)
VALUES
  -- Group 1: Daily Routines (8 options)
  ('manners', 'manner_daily', 'Daily routine manners:', 
   '[{"key": "eating", "label": "🍽️ Eating manners"},
     {"key": "morning", "label": "☀️ Morning manners"},
     {"key": "bedtime", "label": "🌙 Bedtime manners"},
     {"key": "cleanup", "label": "🧹 Cleanup manners"},
     {"key": "potty", "label": "🚽 Potty and hygiene"},
     {"key": "food_prep", "label": "🥗 Food preparation"},
     {"key": "kitchen_safety", "label": "🍳 Kitchen safety"},
     {"key": "helping", "label": "🙋 Helping manners"}]'::jsonb, 1, true),

  -- Group 2: Social Interactions (9 options)
  ('manners', 'manner_social', 'Social interaction manners:', 
   '[{"key": "sharing", "label": "🤝 Sharing manners"},
     {"key": "greeting", "label": "👋 Greeting manners"},
     {"key": "listening", "label": "👂 Listening manners"},
     {"key": "interrupting", "label": "🙊 Interrupting manners"},
     {"key": "apologizing", "label": "💝 Apologizing manners"},
     {"key": "personal_space", "label": "🤗 Personal space and consent"},
     {"key": "kindness", "label": "🌟 Complimenting and kindness"},
     {"key": "sibling", "label": "👶 Sibling and baby manners"},
     {"key": "guest_hosting", "label": "🏠 Guest and hosting"}]'::jsonb, 2, true),

  -- Group 3: Out and About (9 options)
  ('manners', 'manner_places', 'Out and about manners:', 
   '[{"key": "public", "label": "🏙️ Public manners"},
     {"key": "playground", "label": "🛝 Playground manners"},
     {"key": "store_restaurant", "label": "🏪 Store and restaurant"},
     {"key": "library", "label": "📚 Library and quiet spaces"},
     {"key": "car_travel", "label": "🚗 Car and travel"},
     {"key": "healthcare", "label": "🏥 Doctor visits"},
     {"key": "celebration", "label": "🎉 Celebration and party"},
     {"key": "swimming", "label": "🏊 Swimming pool"},
     {"key": "classroom", "label": "📖 Classroom manners"}]'::jsonb, 3, true),

  -- Group 4: Behavior and Safety (7 options)
  ('manners', 'manner_behavior', 'Behavior and safety manners:', 
   '[{"key": "emotional", "label": "💖 Emotional manners"},
     {"key": "noise", "label": "🔇 Noise manners"},
     {"key": "waiting", "label": "⏳ Waiting and patience"},
     {"key": "safety", "label": "⚠️ Safety manners"},
     {"key": "animal", "label": "🐕 Animal manners"},
     {"key": "digital", "label": "📱 Screen manners"},
     {"key": "phone_call", "label": "📞 Phone and video calls"}]'::jsonb, 4, true),

  -- Clothing brand (shared with other agents)
  ('manners', 'clothing_brand', 'Would you like characters to wear branded clothing?', 
   '[{"key": "BURTON", "label": "Burton snowboard gear"}, {"key": "NONE", "label": "No brand preference"}]'::jsonb, 99, true);