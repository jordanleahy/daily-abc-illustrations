-- Update opposites_complexity question to have toddler-appropriate options only
-- Remove "Intermediate" and "Advanced" complexity levels, keep simple and add "Basic" for youngest learners
UPDATE questions
SET static_options = '[
  {
    "id": "OPP_BASIC",
    "label": "Basic Pairs",
    "emoji": "🧒",
    "description": "Easiest contrasts like big/small, up/down, happy/sad"
  },
  {
    "id": "OPP_SIMPLE", 
    "label": "Simple Pairs",
    "emoji": "🔤",
    "description": "Clear contrasts like hot/cold, fast/slow, day/night"
  }
]'::jsonb,
description = 'How simple should the opposite pairs be? (Designed for toddlers and early learners)',
updated_at = now()
WHERE id = 'opposites_complexity';

-- Also update the category to emphasize toddler-appropriate examples
UPDATE questions
SET static_options = '[
  {
    "id": "OPP_PHYSICAL",
    "label": "Physical Opposites", 
    "emoji": "📏",
    "description": "Size and texture: big/small, soft/hard, tall/short"
  },
  {
    "id": "OPP_EMOTIONAL",
    "label": "Emotional Opposites",
    "emoji": "😊", 
    "description": "Feelings: happy/sad, awake/asleep, loud/quiet"
  },
  {
    "id": "OPP_ACTION",
    "label": "Action Opposites",
    "emoji": "🏃",
    "description": "Movement: run/walk, push/pull, start/stop"
  },
  {
    "id": "OPP_POSITION",
    "label": "Position Opposites",
    "emoji": "⬆️",
    "description": "Direction: up/down, in/out, open/closed"
  },
  {
    "id": "OPP_MIXED",
    "label": "Mixed Categories",
    "emoji": "🎲",
    "description": "A fun variety of simple opposite types"
  }
]'::jsonb,
description = 'What types of simple opposites would you like to explore?',
updated_at = now()
WHERE id = 'opposites_category';