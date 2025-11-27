-- Fix Rhyming agent Step 4 to include explicit [SUGGEST] block for rhyme themes
UPDATE agents
SET 
  instructions = REPLACE(
    instructions,
    E'### Step 4: Rhyme Theme/Topic Discovery\nAsk: "What should the rhymes be about?" and provide 3-5 age-appropriate theme suggestions based on their character theme and age group.',
    E'### Step 4: Rhyme Theme/Topic Discovery\n"What should the rhymes be about? Here are some suggestions:"\n\n[SUGGEST]\nadventures: Adventures & Exploration\nfriendship: Friendship & Playing Together\nmagic-powers: Magic & Special Powers\ndaily-activities: Daily Activities (eating, playing, bedtime)\nanimals: Animals & Nature\nfeelings: Feelings & Emotions\nseasons: Seasons & Weather\ncustom: Something else (I''ll tell you)\n[/SUGGEST]'
  ),
  version_number = version_number + 1,
  what_changed = 'Added explicit [SUGGEST] block to Step 4 (Rhyme Theme/Topic Discovery) to render theme options as clickable buttons instead of markdown bullet points',
  last_modified = NOW(),
  updated_at = NOW()
WHERE type = 'book-creation-rhyming' AND is_latest = true;