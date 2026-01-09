-- Update the rhyming agent to include CITY BEHAVIOR instructions
-- This ensures city visual elements are incorporated into image prompts

UPDATE agents
SET instructions = instructions || E'

**CITY BEHAVIOR:**
- This step is OPTIONAL - users can skip it
- If a city is selected (Jersey City, Hoboken, or NYC), ALL illustrations MUST incorporate authentic city elements:
  - **Jersey City**: Waterfront with Manhattan skyline backdrop, brownstones with stoops, Liberty State Park, Exchange Place towers, Colgate Clock, Hudson River views, Lincoln Park, Journal Square
  - **Hoboken**: Washington Street shops, historic brownstones, Stevens Institute on the hill, waterfront piers with NYC views, Sinatra Park, compact walkable streets
  - **New York City**: Iconic landmarks (Central Park, Brooklyn Bridge, Times Square, Empire State Building), yellow taxis, subway entrances, diverse neighborhoods
- Use city-specific color palettes (Jersey City: brick reds, Hudson blues, park greens; NYC: yellow cabs, gray steel, neon lights)
- Include recognizable neighborhood details and urban atmosphere
- If skipped, use generic or character-themed backgrounds
- ⚠️ CITY IS CRITICAL: When a city is selected, it MUST be prominently featured in EVERY image prompt with specific landmarks and architectural details.'
WHERE type = 'book-creation-rhyming' AND is_latest = true;