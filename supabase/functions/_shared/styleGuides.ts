/**
 * Comprehensive style guides for consistent book illustration and character design
 * Used to ensure consistent visual style, character appearance, and world-building across all pages
 */

export interface StyleGuide {
  id: string;
  name: string;
  characterDescriptions: string;
  visualStyle: string;
  colorPalette: string;
  lightingRules: string;
  compositionRules: string;
  settingDetails?: string;
  specialInstructions?: string;
}

export const BEAR_STORIES_STYLE: StyleGuide = {
  id: 'bear-stories',
  name: 'Bear Memories - Bear Stories',
  
  characterDescriptions: `
CHARACTER CONSISTENCY - THE FUN BEAR FAMILY:
These characters must appear EXACTLY as described on every page:

1. **Mama Bear:**
   - Medium-sized brown bear with warm caramel-toned fur
   - Wears a cozy cream-colored knitted sweater
   - Gentle, kind eyes with soft expression
   - Often holds a mug of cocoa or a basket
   - Body language: warm, nurturing, welcoming

2. **Papa Bear:**
   - Large brown bear with darker chocolate-brown fur
   - Wears a plaid flannel shirt (red/black or blue/green patterns)
   - Strong but friendly appearance with warm smile
   - Often shown building, fixing, or playing
   - Body language: protective, playful, encouraging

3. **Big Sister Bear:**
   - Young bear, slightly smaller than parents
   - Light brown fur with a playful energy
   - Wears bright colored winter gear (pink, purple, or teal jacket)
   - Adventurous expression, eyes full of curiosity
   - Often shown exploring or leading activities
   - Body language: confident, excited, discovering

4. **Little Brother Bear:**
   - Small cub with fluffy light brown/golden fur
   - Wears colorful winter hat with pom-pom and matching scarf
   - Wide curious eyes, innocent expression
   - Often collecting snowflakes, tickets, or treasures
   - Body language: curious, gentle, observant
`,

  visualStyle: `
VISUAL STYLE - FROZEN-INSPIRED CINEMATOGRAPHY:

Art Direction:
- Semi-stylized 3D with painterly quality
- Soft, blended textures like hand-painted watercolor
- Visible brush strokes in snow and sky
- Magical realism feel - real but enchanted
- Storybook illustration quality with depth

Atmosphere:
- Warm hearts in a cold world
- Cozy magical tone that invites viewers in
- Family-centered emotional warmth
- Wonder and discovery in every frame
`,

  colorPalette: `
COLOR PALETTE (USE THESE EXACT TONES):

Snow & Ice:
- Soft White: #FFFFFF with subtle blue tint
- Ice Blue Light: #E9F4FB
- Ice Blue Medium: #B5D5EE  
- Ice Blue Deep: #7EB9E2

Sky (varies by time of day):
- Morning/Day Sky: #A7C8E3
- Sunrise/Sunset: #F7B7A3, #FFDFA4
- Twilight: #8BA3C7

Wood & Stone (Gondola House):
- Dark Wood: #6B4A2C
- Warm Wood: #D9A066
- Stone Gray: #8B8680

Warm Lighting:
- Golden Glow: #FFDFA4
- Amber Light: #FBCB8B
- Cozy Orange: #FFB366

Accent Colors:
- Accent Red: #E43F3F (scarves, sleds)
- Forest Green: #3E6E5C (trees, signs)
- Mountain Blue: #406C9F (gondola cabins)
`,

  lightingRules: `
LIGHTING BEHAVIOR (CRITICAL FOR CONSISTENCY):

Morning Light:
- Soft golden rim light on structures and characters
- Snow haze creates diffused glow
- Pastel sky with warm undertones
- Long soft shadows

Midday:
- Bright but not harsh
- Snow sparkles with white highlights
- Clear blue sky gradients
- Crisp but soft-edged shadows

Afternoon/Sunset:
- Warm amber washes across snow
- Golden hour glow on windows
- Pink and orange sky gradients
- Long dramatic shadows with warm edges

Interior Lighting:
- Warm amber from windows (always visible at base)
- Fireplace glow (orange-yellow)
- Cozy lamp light
- Contrast between warm interiors and cool exterior snow
`,

  compositionRules: `
COMPOSITION GUIDELINES:

Wide Cinematic Shots:
- Establish setting with Gondola House prominent
- Show mountain peaks in background
- Include village elements for scale and warmth
- Gondola cables leading eye up the mountain

Character Framing:
- Family grouped together showing connection
- Bears at human eye-level (accessible, relatable)
- Expressions clear and readable from distance
- Body language tells the emotional story

Environmental Storytelling:
- Snow activity (falling, playing, skiing)
- Families in background creating life and energy
- Gondola cabins visible on cables (red, moving)
- Smoke from chimneys suggesting warmth within
`,

  settingDetails: `
THE GONDOLA HOUSE (CENTRAL TO EVERY SCENE):

Architecture:
- Tree fort style built on green-roof gondola terminal
- Heavy timber beam construction
- Open center tunnel for gondola cable to pass through
- Warm wood siding with stone foundation
- Multiple windows glowing with golden light
- Stone chimney with curling smoke
- Balcony with paw-print decorations
- Built above the gondola boarding area

Surroundings:
- Alpine village behind with rustic lodges
- Snow-covered roofs on all buildings
- Amber-lit windows throughout village
- Mountain peaks rising beyond village
- Gondola cables stretching up mountain
- Red gondola cabins on cables
- Children playing in snow at base
- Families approaching gondola station

Emotional Anchor:
- First thing kids see = warmth and welcome
- Symbol of fun, safety, and memories
- Visual representation: "The mountain is big. The memories are bigger."
`,

  specialInstructions: `
⚠️ CRITICAL CONSISTENCY REQUIREMENTS:

1. CHARACTER APPEARANCE: Bears must look identical across all pages
   - Same fur colors, clothing, body proportions
   - Consistent facial features and expressions
   - Recognizable on every single page

2. GONDOLA HOUSE: Must appear in background or setting when contextually appropriate
   - Same architectural design every time
   - Same warm lighting from windows
   - Same timber and stone materials

3. COLOR PALETTE: Use ONLY the specified hex codes
   - No random color variations
   - Maintain warm/cool contrast (warm light, cool snow)
   - Consistent color meanings (red = warmth/play, blue = snow/sky)

4. LIGHTING: Match time of day across related pages
   - Morning scenes use morning light palette
   - Interior scenes always show warm amber glow
   - Snow always has appropriate sparkle/reflection

5. EMOTIONAL TONE: Every image reinforces "Bear Memories"
   - Warmth, connection, family togetherness
   - Wonder and discovery
   - Cozy magical feeling
`
};

export const STYLE_GUIDES: Record<string, StyleGuide> = {
  'bear-stories': BEAR_STORIES_STYLE,
  // Future themes can be added here
};

export function getStyleGuide(styleGuideKey: string): StyleGuide | null {
  return STYLE_GUIDES[styleGuideKey] || null;
}
