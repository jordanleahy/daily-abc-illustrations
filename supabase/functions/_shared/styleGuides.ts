/**
 * Comprehensive style guides for consistent book illustration and character design
 * Used to ensure consistent visual style, character appearance, and world-building across all pages
 */

export interface SelectableCharacter {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  defaultSelected?: boolean;
}

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
  selectableCharacters?: SelectableCharacter[];
}

export const BEAR_STORIES_STYLE: StyleGuide = {
  id: 'bear-stories',
  name: 'Bear Memories - Bear Stories',
  
  characterDescriptions: `
CHARACTER CONSISTENCY - THE FUN BEAR FAMILY:
These characters must appear EXACTLY as described on every page. Include ALL details in every image prompt.

1. **Mama Bear:**
   
   PHYSICAL PROPORTIONS:
   - Height: 5.5 feet tall (medium-sized adult bear)
   - Build: Gentle, soft, rounded maternal figure
   - Size ratio: 1.2x larger than Big Sister, slightly smaller than Papa
   - Snout: Medium length, gentle curve, black nose
   
   FUR DETAILS:
   - Color: Warm caramel brown #D9A066 with lighter cream #F5E6D3 on muzzle and inner ears
   - Texture: Soft, medium-length fur with slight wave
   - Fur pattern: Slightly lighter around chest and belly
   - Shading: Warm honey tones in sunlight, deeper caramel in shadow
   
   FACIAL FEATURES (CRITICAL - MUST BE IDENTICAL EVERY TIME):
   - Eyes: Large, almond-shaped, warm brown #6B4A2C with gentle sparkle
   - Eye placement: Wide-set, conveying warmth and approachability
   - Eyebrows: Soft, slightly arched, conveying kindness
   - Muzzle: Rounded, not elongated, with gentle smile lines
   - Ears: Medium rounded ears, slightly forward-facing, cream interior
   - Expression default: Gentle closed-mouth smile, eyes crinkled with warmth
   
   CLOTHING (EXACT SPECIFICATION):
   - Main garment: Cream-colored #F5E6D3 cable-knit sweater
   - Sweater details: Chunky knit pattern, rolled collar, extends to mid-thigh
   - Texture: Visible knit texture with ribbed cuffs and hem
   - Fit: Cozy, slightly oversized, comfortable
   - Optional accessories: Sometimes wears apron #FFDFA4 or scarf
   
   UNIQUE IDENTIFYING FEATURES:
   - Always holds objects with both paws (mug, basket, book)
   - Small beauty mark on left cheek
   - Slightly rounded ear tips (never pointed)
   - Paw pads visible when holding items: soft pink #FFB3BA
   
   BODY LANGUAGE DEFAULTS:
   - Standing: Weight on both legs, paws clasped or holding something
   - Walking: Gentle forward lean, purposeful but unhurried
   - Sitting: Upright with good posture, paws in lap or holding object
   - Emotional range: Warm smile (default), concerned frown, proud beam

2. **Papa Bear:**
   
   PHYSICAL PROPORTIONS:
   - Height: 6.5 feet tall (largest family member)
   - Build: Broad-shouldered, strong but not intimidating, barrel-chested
   - Size ratio: 1.5x larger than Mama, 2x larger than Big Sister
   - Snout: Slightly longer than Mama's, square masculine jaw
   
   FUR DETAILS:
   - Color: Deep chocolate brown #6B4A2C with darker #4A3520 on back and arms
   - Texture: Thick, slightly shaggy medium-length fur
   - Fur pattern: Darker "saddle" across shoulders and back
   - Shading: Rich warm brown in light, deep cocoa in shadow
   
   FACIAL FEATURES (CRITICAL - MUST BE IDENTICAL EVERY TIME):
   - Eyes: Round, friendly, medium brown #8B6F47 with laugh lines at corners
   - Eye placement: Set slightly closer than Mama's, conveying focus
   - Eyebrows: Thick, expressive, often raised in playful surprise
   - Muzzle: Square, masculine, with broad smile showing warmth
   - Ears: Large rounded ears, slightly back-facing when listening
   - Expression default: Wide warm smile showing teeth, eyes twinkling
   
   CLOTHING (EXACT SPECIFICATION):
   - Main garment: Plaid flannel shirt, always red #E43F3F and black pattern
   - Shirt details: Button-down, rolled sleeves to forearms, chest pocket
   - Pattern: Classic buffalo plaid - large squares, not small checks
   - Fit: Fitted at shoulders, slightly loose at waist, tucked or untucked
   - Undershirt: White or cream thermal visible at neck
   - Optional: Suspenders #6B4A2C or tool belt when working
   
    UNIQUE IDENTIFYING FEATURES:
    - Characteristic head tilt when listening or playing
    - Right ear has small notch at tip (old snowboarding injury)
    - Broader snout than other bears, more square-shaped
   - Paw pads: Darker brown #4A3520, work-worn texture
   - Often shown mid-action (building, lifting, gesturing)
   
   BODY LANGUAGE DEFAULTS:
   - Standing: Confident stance, hands on hips or holding tools
   - Walking: Purposeful stride, long steps, leading the way
   - Sitting: Legs spread, leaning forward, engaged and present
   - Emotional range: Hearty laugh (default), concentrated focus, gentle concern

3. **Big Sister Bear (DanDan - 7 years old):**
   
   PHYSICAL PROPORTIONS:
   - Height: 4 feet tall (7-year-old child bear, early elementary age)
   - **CRITICAL SIZE RATIO: DanDan is 1.6x TALLER than Chelson (her head reaches 60% higher than his)**
   - Build: Lean, energetic, developing coordination, still has some child softness
   - Size comparison: When standing together, DanDan's eyes are at the same height as the top of Chelson's head
   - Relative to parents: 0.6x Mama's height (shoulder height to Mama)
   - **VISUAL CUE: DanDan can easily see over Chelson's head and often rests her paw on his shoulder**
   - Snout: Short, child-like, distinctly younger than parents but more defined than toddler
   
   FUR DETAILS:
   - Color: Light honey brown #E8C59C with golden #F5D5A8 highlights
   - Texture: Soft, fluffy, slightly shorter than parents' fur
   - Fur pattern: Lighter on face and chest, golden tips on ears
   - Shading: Bright honey in sunlight, warm tan in shadow
   
   FACIAL FEATURES (CRITICAL - MUST BE IDENTICAL EVERY TIME):
   - Eyes: Large, bright, hazel #9B7653 with constant sparkle of excitement
   - Eye placement: Wide-set, conveying wonder and alertness
   - Eyebrows: Thin, often raised in curiosity or excitement
   - Muzzle: Small, rounded, youth proportion with animated expressions
   - Ears: Perky, forward-facing, always attentive, fluffy ear tufts
   - Expression default: Wide excited smile, eyes wide with discovery
   
   CLOTHING (EXACT SPECIFICATION):
   - SNOWSUIT: Bright crimson red #DC143C coordinated one-piece or matching two-piece winter suit
   - Snowsuit pattern: Scattered colorful abstract shapes across entire suit (jacket and pants sections)
     * Pattern colors: Blues (#4169E1 royal blue, #87CEEB sky blue), Yellows (#FFD700 gold, #FFA500 orange), Whites (#FFFFFF bright accents), Pinks (#FF69B4 hot pink)
     * Pattern style: Small playful geometric shapes, dots, and abstract forms creating energetic, fun aesthetic
   - Fabric finish: Glossy/shiny technical fabric typical of snow gear
   - Jacket section: Puffy quilted texture, hood with white fur trim, center zipper
   - Pants section: Insulated with same quilted texture and pattern as jacket top, seamless visual continuity
   - Fit: Slightly oversized for growing room and layering, practical for snow play
   - Accessories: Matching crimson red snow gaiters with colorful pattern (boots to mid-calf), colorful knit beanie or pom-pom hat, mittens (may be clipped to suit), waterproof snow boots (black/dark)
   - Seasonal variations: Crimson snowsuit (winter/snow), Teal #40B5AD hoodie with jeans (indoor/casual), Purple #9B6B9E jacket or pink #FFB3D9 vest (spring/fall)
   
   UNIQUE IDENTIFYING FEATURES:
   - Distinctive white patch on chest in shape of small star
   - Left ear often perks higher than right when listening
   - Freckles across bridge of nose (3 on each side)
   - Paw pads: Soft pink #FFB3BA, still kitten-like
   - Always in motion - running, jumping, reaching, pointing
   
   BODY LANGUAGE DEFAULTS:
   - Standing: Confident 7-year-old stance, hands on hips or pointing excitedly
   - Walking: Energetic skip or run, leading Little Brother, showing things to him
   - Sitting: Active listening, cross-legged with good posture, engaged
   - Interactions: Acts as "big kid" helper, protective of Little Brother, proud and responsible
   - Emotional range: Excited discovery (default), focused determination, proud achievement, occasional 7-year-old frustration

4. **Little Brother Bear (Chelson - 3 years old):**
   
   PHYSICAL PROPORTIONS:
   - Height: 2.5 feet tall (3-year-old toddler bear, preschool age)
   - **CRITICAL SIZE RATIO: Chelson is MUCH SMALLER than DanDan - only 0.6x her height (62.5% of her height)**
   - Build: Round, chubby toddler body, short stubby limbs, large head proportion (toddler: head is 1/3.5 of body)
   - Size comparison: When standing beside DanDan, the top of Chelson's head barely reaches her chest/shoulder
   - Relative to parents: 0.4x Mama's height (waist height to Mama)
   - **VISUAL CUE: Chelson often has to look UP to see DanDan's face; DanDan often leans DOWN to hold his paw**
   - Snout: Tiny button-like, baby-faced, distinctly toddler-proportioned
   
   FUR DETAILS:
   - Color: Fluffy light golden #F5D5A8 with creamy white #FFF8E7 on belly
   - Texture: Extra fluffy, downy soft cub fur, longest of all bears
   - Fur pattern: Lighter "bib" on chest, cream inside ears, golden highlights
   - Shading: Glowing pale gold in light, soft honey in shadow
   
   FACIAL FEATURES (CRITICAL - MUST BE IDENTICAL EVERY TIME):
   - Eyes: Oversized, round, deep brown #6B4A2C with constant wonder
   - Eye placement: Large in proportion to face, conveying innocence
   - Eyebrows: Thin, barely visible, express surprise easily
   - Muzzle: Tiny button nose, rounded baby-like features
   - Ears: Small rounded, often hidden by hat, fluffy inner fur
   - Expression default: Gentle wonder, mouth slightly open in awe
   
   CLOTHING (EXACT SPECIFICATION):
   - Main garment: Oversized knit sweater in bright colors (red #E43F3F, blue #7EB9E2, yellow #FFDFA4)
   - Sweater details: Chunky knit, too-long sleeves covering paws, cozy fit
   - Hat: Knit pom-pom beanie, blue #7EB9E2 with red #E43F3F pom-pom and stripes
   - Hat details: Slouchy fit, covers ears, pom-pom bounces when moving
   - Scarf: Matching striped scarf, often trailing behind or wrapped multiple times
   - Pants: Corduroy overalls or snow pants with suspenders
   
   UNIQUE IDENTIFYING FEATURES:
   - Signature blue pom-pom hat - NEVER without it (wear it even inside)
   - Right paw has small brown freckle on pad
   - Slightly cross-eyed when concentrating hard
   - Paw pads: Baby pink #FFCCD5, small and soft
   - Often clutches comfort items: stuffed toy, blanket corner, Mama's paw
   - Walks with slight waddle due to cub proportions
   
   BODY LANGUAGE DEFAULTS:
   - Standing: Wobbly toddler stance, often holding parent's paw or Big Sister's paw for support
   - Walking: Unsteady toddler waddle, sometimes stumbles, needs help with stairs
   - Sitting: Plops down heavily, legs splayed, surrounded by toys
   - Interactions: Constantly seeks comfort from Mama/Papa, follows Big Sister everywhere, tries to copy her
   - Toddler behaviors: Reaches up to be held, grabs objects with both paws, intense focused stare
   - Speech indicators: Points at things, tugs on clothing to get attention, limited vocabulary implied
   - Emotional range: Wide-eyed wonder (default), delighted toddler giggles, sudden tears, clingy when uncertain
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

**MANDATORY SIZE RATIO ENFORCEMENT:**
When DanDan and Chelson appear together in ANY scene:
- DanDan's height MUST be 1.6x Chelson's height (160% taller)
- Chelson's head should reach DanDan's mid-chest/shoulder area
- Use visual anchors: If DanDan is 8 body units tall, Chelson is 5 body units tall
- Perspective: When side-by-side, the height difference should be immediately obvious
- Age visual cues: Chelson looks like a toddler next to elementary-age DanDan

Environmental Storytelling:
- Snow activity (falling, playing, snowboarding - NEVER skiing)
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
- Mountain peaks rising beyond village with visible snowboarding slopes
- Gondola cables stretching up mountain to snowboarding terrain
- Red gondola cabins on cables
- Children playing in snow and snowboarding at base
- Families with snowboards approaching gondola station
- Snowboarding activity visible on mountain slopes

Snowboarding Environment Details:
- Snowboards leaning against walls and racks
- Snowboarding gear displayed prominently (boots, helmets, goggles)
- Snowboard wax and maintenance tools visible
- Trail maps showing snowboarding runs
- Family members often shown preparing for or returning from snowboarding
- Mountain terrain designed for snowboarding (half-pipes, jumps, groomed runs)

Emotional Anchor:
- First thing kids see = warmth and welcome
- Symbol of fun, safety, and snowboarding memories
- Visual representation: "The mountain is big. The memories are bigger."
`,

  specialInstructions: `
🎿 SNOWBOARDING ONLY - NEVER SKIING:
ALL winter sports activities in Bear Stories MUST be snowboarding, NOT skiing.
- Characters always use snowboards (single board, both feet attached)
- NEVER show ski poles, skis (two separate boards), or ski equipment
- Snowboarding stance: sideways on board, knees bent, arms out for balance
- Family teaches snowboarding fundamentals, not skiing
- Papa Bear's ear notch is from an old snowboarding injury, not skiing

🚨 CRITICAL AGE-ACCURATE SIZING (HIGHEST PRIORITY):
The age gap between DanDan (7 years) and Chelson (3 years) MUST be visually unmistakable:
- DanDan stands 60% TALLER than Chelson (1.6x his height)
- Chelson is a TODDLER with chubby proportions and unsteady stance
- DanDan is an ELEMENTARY CHILD with longer limbs and confident posture
- Side-by-side comparison: Think 2nd grader next to preschooler
- If they're holding paws, DanDan's arm extends DOWN to reach Chelson's raised arm
- Chelson's head reaches DanDan's chest/shoulder when standing side-by-side

🎯 TOP 3 QUALITY CONTROL BEST PRACTICES (FOLLOW EXACTLY):

**BEST PRACTICE #1: MANDATORY HEX COLOR CODES**
❌ NEVER write: "natural earth tones", "warm colors", "bright colors"
✅ ALWAYS write: "red #E43F3F", "ice blue #B5D5EE", "golden glow #FFDFA4"

Every single color mentioned in a prompt MUST include its exact hex code from the palette above.
This is the #1 reason for style inconsistency - vague color descriptions allow AI to improvise.

**BEST PRACTICE #2: CHARACTER IDENTIFICATION FIRST**
Every prompt MUST start by explicitly identifying which bears appear:
✅ "Papa Bear (chocolate-brown fur, red-black plaid flannel shirt) is pulling..."
✅ "Little Brother Bear (fluffy golden fur, blue pom-pom hat) reaches..."
✅ "Mama Bear (caramel fur, cream sweater) and Big Sister Bear (light brown fur, teal jacket)..."

Never write generic "a bear" or "the bears" - always specify WHICH bear with their signature features.

**BEST PRACTICE #3: STYLE ANCHOR IN EVERY PROMPT**
Every prompt must include at least ONE of these anchors:
- "Gondola House visible in background with amber-glowing windows"
- "Red gondola cabins #E43F3F on cables in background"
- "Alpine village with warm wood tones #D9A066 behind them"
- "Frozen-inspired cinematic lighting with soft golden rim light"

These anchors force the AI to maintain the Bear Stories world consistency.

⚠️ ADDITIONAL CRITICAL CONSISTENCY REQUIREMENTS:

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

export const BLUEY_STYLE: StyleGuide = {
  id: 'bluey',
  name: 'Bluey - Australian Heeler Family',
  
  selectableCharacters: [
    {
      id: 'bluey',
      name: 'Bluey',
      description: '6-year-old Blue Heeler, light blue fur, curious and playful',
      thumbnail: '/characters/bluey/bluey.png',
      defaultSelected: true
    },
    {
      id: 'bingo',
      name: 'Bingo',
      description: '4-year-old Red Heeler, orange-red fur, imaginative and sweet',
      thumbnail: '/characters/bluey/bingo.png',
      defaultSelected: true
    },
    {
      id: 'bandit',
      name: 'Bandit',
      description: 'Dad, Blue Heeler, dark blue fur, playful and inventive',
      thumbnail: '/characters/bluey/bandit.png'
    },
    {
      id: 'chilli',
      name: 'Chilli',
      description: 'Mum, Red Heeler, orange fur, patient and nurturing',
      thumbnail: '/characters/bluey/chilli.png'
    }
  ],
  
  characterDescriptions: `
ALLOWED CHARACTERS ONLY:
The following characters are the ONLY characters permitted in this book.
⚠️ DO NOT include ANY characters not listed in the selected character list.

BLUEY CHARACTER REFERENCE:
1. Bluey (6-year-old Blue Heeler)
   - Light blue fur with darker blue spots
   - Curious, adventurous, playful personality
   - Often leads games and adventures
   
2. Bingo (4-year-old Red Heeler)
   - Orange-red fur with lighter belly
   - Imaginative, sweet, slightly quieter than Bluey
   - Creative and thoughtful
   
3. Bandit (Dad - Blue Heeler)
   - Dark blue fur, larger build
   - Playful dad who joins in games
   - Inventive and patient
   
4. Chilli (Mum - Red Heeler)
   - Orange fur, slender build
   - Patient, nurturing, supportive
   - Often helps resolve conflicts
`,
  
  visualStyle: `
VISUAL STYLE - AUSTRALIAN CHILDREN'S ANIMATION:

Art Direction:
- Clean, simple 2D animation style
- Bright, cheerful color palette
- Soft rounded shapes and forms
- Child-friendly, accessible aesthetic
- Warm, inviting Australian suburban setting

Atmosphere:
- Playful, energetic family scenes
- Backyard adventures and imaginative play
- Warm Australian sunshine
- Cozy family home environment
`,

  colorPalette: `
COLOR PALETTE (USE THESE EXACT TONES):

Blues (Heeler dogs):
- Light Blue: #6EC6F5 (Bluey's fur)
- Dark Blue: #3A7CA5 (Bandit's fur)
- Sky Blue: #87CEEB (backgrounds)

Oranges/Reds (Heeler dogs):
- Orange: #F5A052 (Bingo's fur)
- Red-Orange: #E87B3F (Chilli's fur)

Environment:
- Grass Green: #7CB342
- Sky Blue: #87CEEB
- House Cream: #FFF8DC
- Warm Yellow: #FFD54F (sunshine)
`,

  lightingRules: `
LIGHTING BEHAVIOR:

Daytime Outdoor:
- Bright Australian sunshine
- Warm golden light
- Soft shadows from trees
- Clear blue skies

Indoor:
- Warm ambient lighting
- Cozy family home atmosphere
- Soft window light
`,

  compositionRules: `
COMPOSITION GUIDELINES:

Character Framing:
- Family-centered scenes
- Characters at child's eye level
- Clear expressions and body language
- Action-oriented poses during play

Environmental Storytelling:
- Australian backyard setting
- Family home interiors
- Playground and park scenes
- Neighborhood adventures
`,

  settingDetails: `
THE HEELER FAMILY HOME:

Architecture:
- Typical Australian suburban house
- Cream/beige exterior
- Red-brown roof
- Large backyard with lawn
- Wooden deck area

Surroundings:
- Grassy backyard for play
- Neighborhood streets
- Local parks and playgrounds
- Australian native trees
`,

  specialInstructions: `
⚠️ CHARACTER RESTRICTIONS - STRICTLY ENFORCED:
Only include characters from the approved selection list.
DO NOT include extended family (Stripe, Trixie, Socks, Muffin, etc.) unless specifically selected.
DO NOT include school friends, neighbors, or other characters.

🎯 QUALITY CONTROL:
- Maintain consistent character proportions
- Keep the simple, clean animation style
- Use bright, cheerful colors
- Focus on family interaction and imaginative play
`
};

export const STYLE_GUIDES: Record<string, StyleGuide> = {
  'bear-stories': BEAR_STORIES_STYLE,
  'bluey': BLUEY_STYLE,
};

export function getStyleGuide(styleGuideKey: string): StyleGuide | null {
  return STYLE_GUIDES[styleGuideKey] || null;
}

/**
 * Extract character details for specific characters from style guide
 * Returns formatted character specifications ready for layered prompt injection
 */
export function getCharacterDetails(
  styleGuideKey: string,
  characterNames: string[]
): Array<{ name: string; details: string }> {
  const guide = getStyleGuide(styleGuideKey);
  if (!guide) return [];

  const characterMap: Record<string, string> = {
    'mama': 'Mama Bear: 5.5 feet tall (2.5x Little Brother\'s height), warm caramel brown #D9A066 fur with cream #F5E6D3 muzzle. FACE: Large almond-shaped warm brown #6B4A2C eyes (wide-set), soft arched eyebrows, rounded gentle muzzle with closed-mouth smile, medium rounded forward-facing ears with cream interior, small beauty mark on left cheek. PAW PADS: Soft pink #FFB3BA. CLOTHING: Cream #F5E6D3 cable-knit sweater with chunky knit texture, rolled collar, ribbed cuffs and hem, extends to mid-thigh, cozy oversized fit. BODY LANGUAGE: Nurturing posture, paws clasped or holding objects with both paws, gentle forward lean when walking, upright sitting with good posture. AGE-ACCURATE SIZING: She towers over Little Brother.',
    'mama bear': 'Mama Bear: 5.5 feet tall (2.5x Little Brother\'s height), warm caramel brown #D9A066 fur with cream #F5E6D3 muzzle. FACE: Large almond-shaped warm brown #6B4A2C eyes (wide-set), soft arched eyebrows, rounded gentle muzzle with closed-mouth smile, medium rounded forward-facing ears with cream interior, small beauty mark on left cheek. PAW PADS: Soft pink #FFB3BA. CLOTHING: Cream #F5E6D3 cable-knit sweater with chunky knit texture, rolled collar, ribbed cuffs and hem, extends to mid-thigh, cozy oversized fit. BODY LANGUAGE: Nurturing posture, paws clasped or holding objects with both paws, gentle forward lean when walking, upright sitting with good posture. AGE-ACCURATE SIZING: She towers over Little Brother.',
    'papa': 'Papa Bear: 6.5 feet tall (largest family member), deep chocolate brown #6B4A2C fur with darker #4A3520 saddle on back. FACE: Round friendly medium brown #8B6F47 eyes with laugh lines, thick expressive eyebrows often raised playfully, square masculine muzzle with broad warm smile, large rounded ears slightly back-facing, right ear has small notch at tip. PAW PADS: Dark chocolate brown #4A3520. CLOTHING: Red #E43F3F and black buffalo plaid flannel shirt (large squares pattern), button-down with rolled sleeves to forearms, chest pocket, white/cream thermal visible at neck, fitted shoulders with slightly loose waist. BODY LANGUAGE: Confident stance with chest out, wide striding gait, hands on hips or gesturing expressively, protective posture near family.',
    'papa bear': 'Papa Bear: 6.5 feet tall (largest family member), deep chocolate brown #6B4A2C fur with darker #4A3520 saddle on back. FACE: Round friendly medium brown #8B6F47 eyes with laugh lines, thick expressive eyebrows often raised playfully, square masculine muzzle with broad warm smile, large rounded ears slightly back-facing, right ear has small notch at tip. PAW PADS: Dark chocolate brown #4A3520. CLOTHING: Red #E43F3F and black buffalo plaid flannel shirt (large squares pattern), button-down with rolled sleeves to forearms, chest pocket, white/cream thermal visible at neck, fitted shoulders with slightly loose waist. BODY LANGUAGE: Confident stance with chest out, wide striding gait, hands on hips or gesturing expressively, protective posture near family.',
    'dandan': 'Big Sister Bear (DanDan, 7 years old): 4 feet tall, light honey brown #E8C59C fur with golden #F5D5A8 highlights. FACE: Bright hazel #9B7653 almond-shaped eyes sparkling with curiosity, arched playful eyebrows, small rounded muzzle, upright alert ears, white star patch on chest, 3 small freckles on each side of nose bridge. PAW PADS: Light golden #F5D5A8. CLOTHING: Bright crimson red #DC143C snowsuit (coordinated one-piece/matching two-piece) with scattered colorful abstract pattern - Blues (#4169E1, #87CEEB), Yellows (#FFD700, #FFA500), Whites (#FFFFFF), Pinks (#FF69B4). Glossy technical fabric, puffy quilted texture throughout, hood with white fur trim, center zipper. Matching crimson snow gaiters with same pattern from boots to mid-calf. BODY LANGUAGE: Energetic bouncy movements, stands on tiptoes when excited, dynamic poses mid-motion, leans forward eagerly, expressive gestures with paws. CRITICAL SIZE: 1.6x TALLER than Chelson - her eyes are at the same height as the top of his head.',
    'big sister': 'Big Sister Bear (DanDan, 7 years old): 4 feet tall, light honey brown #E8C59C fur with golden #F5D5A8 highlights. FACE: Bright hazel #9B7653 almond-shaped eyes sparkling with curiosity, arched playful eyebrows, small rounded muzzle, upright alert ears, white star patch on chest, 3 small freckles on each side of nose bridge. PAW PADS: Light golden #F5D5A8. CLOTHING: Bright crimson red #DC143C snowsuit (coordinated one-piece/matching two-piece) with scattered colorful abstract pattern - Blues (#4169E1, #87CEEB), Yellows (#FFD700, #FFA500), Whites (#FFFFFF), Pinks (#FF69B4). Glossy technical fabric, puffy quilted texture throughout, hood with white fur trim, center zipper. Matching crimson snow gaiters with same pattern from boots to mid-calf. BODY LANGUAGE: Energetic bouncy movements, stands on tiptoes when excited, dynamic poses mid-motion, leans forward eagerly, expressive gestures with paws. CRITICAL SIZE: 1.6x TALLER than Chelson - her eyes are at the same height as the top of his head.',
    'big sister bear': 'Big Sister Bear (DanDan, 7 years old): 4 feet tall, light honey brown #E8C59C fur with golden #F5D5A8 highlights. FACE: Bright hazel #9B7653 almond-shaped eyes sparkling with curiosity, arched playful eyebrows, small rounded muzzle, upright alert ears, white star patch on chest, 3 small freckles on each side of nose bridge. PAW PADS: Light golden #F5D5A8. CLOTHING: Bright teal #40B5AD puffer jacket with puffy quilted texture, hood with fur trim, zippered, slightly oversized for growing room. Denim jeans or snow pants. BODY LANGUAGE: Energetic bouncy movements, stands on tiptoes when excited, dynamic poses mid-motion, leans forward eagerly, expressive gestures with paws. CRITICAL SIZE: 1.6x TALLER than Chelson - her eyes are at the same height as the top of his head.',
    'chelson': 'Little Brother Bear (Chelson, 3 years old): TODDLER size at 2.5 feet tall (only 0.6x DanDan\'s height - 62.5% of her height), fluffy golden fur with creamy white belly. FACE: Oversized round brown #6B4A2C eyes (huge in proportion to face), tiny button nose, very short rounded muzzle, small rounded ears that stick out, rosy cheeks, sweet innocent expression, tiny whisker dots. PAW PADS: Soft baby pink #FFC4C9. CLOTHING: SIGNATURE bright blue #7EB9E2 pom-pom beanie with red #E43F3F pom-pom and stripes (NEVER without it, wears it even inside), oversized chunky knit sweater in bright colors (red/blue/yellow) with too-long sleeves covering paws, matching striped scarf. BODY LANGUAGE: Toddler waddle with arms out for balance, sits with legs splayed, reaches up toward adults, clutches toys/objects to chest, follows siblings closely. His head reaches only to DanDan\'s chest/shoulder.',
    'little brother': 'Little Brother Bear (Chelson, 3 years old): TODDLER size at 2.5 feet tall (only 0.6x DanDan\'s height - 62.5% of her height), fluffy golden fur with creamy white belly. FACE: Oversized round brown #6B4A2C eyes (huge in proportion to face), tiny button nose, very short rounded muzzle, small rounded ears that stick out, rosy cheeks, sweet innocent expression, tiny whisker dots. PAW PADS: Soft baby pink #FFC4C9. CLOTHING: SIGNATURE bright blue #7EB9E2 pom-pom beanie with red #E43F3F pom-pom and stripes (NEVER without it, wears it even inside), oversized chunky knit sweater in bright colors (red/blue/yellow) with too-long sleeves covering paws, matching striped scarf. BODY LANGUAGE: Toddler waddle with arms out for balance, sits with legs splayed, reaches up toward adults, clutches toys/objects to chest, follows siblings closely. His head reaches only to DanDan\'s chest/shoulder.',
    'little brother bear': 'Little Brother Bear (Chelson, 3 years old): TODDLER size at 2.5 feet tall (only 0.6x DanDan\'s height - 62.5% of her height), fluffy golden fur with creamy white belly. FACE: Oversized round brown #6B4A2C eyes (huge in proportion to face), tiny button nose, very short rounded muzzle, small rounded ears that stick out, rosy cheeks, sweet innocent expression, tiny whisker dots. PAW PADS: Soft baby pink #FFC4C9. CLOTHING: SIGNATURE bright blue #7EB9E2 pom-pom beanie with red #E43F3F pom-pom and stripes (NEVER without it, wears it even inside), oversized chunky knit sweater in bright colors (red/blue/yellow) with too-long sleeves covering paws, matching striped scarf. BODY LANGUAGE: Toddler waddle with arms out for balance, sits with legs splayed, reaches up toward adults, clutches toys/objects to chest, follows siblings closely. His head reaches only to DanDan\'s chest/shoulder.',
  };

  const results: Array<{ name: string; details: string }> = [];
  
  for (const name of characterNames) {
    const normalized = name.toLowerCase().trim();
    const details = characterMap[normalized];
    if (details) {
      results.push({ name, details });
    }
  }

  return results;
}

/**
 * Get setting and atmosphere details from style guide
 */
export function getSettingDetails(styleGuideKey: string): string {
  const guide = getStyleGuide(styleGuideKey);
  if (!guide) return '';

  if (styleGuideKey === 'bear-stories') {
    return `THE GONDOLA HOUSE ARCHITECTURE: Charming alpine timber structure with rich walnut brown #6B4423 wood beams and warm honey brown #D9A066 planked walls. Large panoramic windows with warm amber #FFB366 glow from interior lighting. Wraparound wooden deck with carved railings. Gray stone #8B8680 chimney with gentle white smoke curling upward. Red-painted door. SETTING: The house straddles a gondola cable line - the cable runs directly through an open tunnel/archway in the house structure. Red #E43F3F gondola cabins visible on cables passing through. Snow-covered alpine environment with pristine white #FFFFFF snow (blue #E3F2FD shadows). Distant purple-tinted #B8B5D6 mountain peaks against soft ice blue #E3F2FD sky. Snow textures: Smooth powder in undisturbed areas, sculpted drifts near house, crystalline sparkle #F0F8FF in sunlight. Evergreen trees with snow-laden branches frame the scene.`;
  }

  return guide.settingDetails || '';
}

/**
 * Get visual style summary for prompt injection
 */
export function getVisualStyleSummary(styleGuideKey: string): string {
  const guide = getStyleGuide(styleGuideKey);
  if (!guide) return '';

  if (styleGuideKey === 'bear-stories') {
    return 'Semi-stylized 3D with painterly quality (like Frozen/Pixar). Soft blended textures with visible brush strokes. Hand-painted watercolor feel on snow and sky. NOT comic book style - NO thick black borders or heavy line work. Cinematic lighting with soft golden rim light on fur.';
  }

  return guide.visualStyle || '';
}

/**
 * Get critical constraints for prompt enforcement
 */
export function getCriticalConstraints(styleGuideKey: string): string[] {
  const guide = getStyleGuide(styleGuideKey);
  if (!guide) return [];

  if (styleGuideKey === 'bear-stories') {
    return [
      'Chelson (Little Brother) MUST wear his blue #7EB9E2 pom-pom beanie with red #E43F3F pom-pom in EVERY image - even indoors',
      'Character size ratios must be exact: Papa 6.5ft, Mama 5.5ft, DanDan 4ft, Chelson 2.5ft',
      'Use ONLY the specified hex color codes - no variations or approximations',
      'Snowboarding ONLY - never skiing (no ski poles, no skis, no ski equipment)',
      'All four bears must maintain their exact facial features, fur colors, and identifying marks',
      'Mama Bear always has beauty mark on left cheek, Papa has notch in right ear, DanDan has white star chest patch and 6 freckles',
      'COMPOSITION: Characters should interact naturally - eye contact, physical proximity, engaged body language',
      'FRAMING: Family scenes show all characters at appropriate size ratios, background includes Gondola House when contextually appropriate',
      'CHARACTER INTERACTION: Chelson often looks up at siblings/parents, DanDan protective/guiding toward Chelson, parents display nurturing body language',
      'CONTINUITY: Each character\'s clothing remains consistent across all pages unless explicitly changed for story reason',
      '🚫 ABSOLUTELY NO TEXT OR SIGNS anywhere in the image (Gondola House has NO readable text)',
    ];
  }

  return [];
}

/**
 * Get time-of-day specific lighting details for atmospheric consistency
 */
export function getTimeOfDayLighting(styleGuideKey: string, timeOfDay: 'morning' | 'midday' | 'afternoon' | 'sunset' | 'evening' | 'interior'): string {
  if (styleGuideKey !== 'bear-stories') return '';

  const lightingMap: Record<string, string> = {
    'morning': 'Soft golden morning light with long shadows. Cool blue #E3F2FD undertones in snow shadows. Warm peachy #FFDAB9 rim lighting on fur. Sky transitions from soft pink #FFE4E1 at horizon to ice blue #E3F2FD above. Fresh, crisp atmosphere.',
    'midday': 'Bright overhead sunlight creating short shadows. Brilliant white #FFFFFF snow with subtle blue #E3F2FD shadows. Strong contrast between light and shadow. Clear ice blue #E3F2FD sky. High-key lighting with natural brightness.',
    'afternoon': 'Warm golden light #FFD700 angled from side. Rich amber #FFB366 highlights on fur and wood. Longer shadows stretching across snow. Sky deepens to rich blue #87CEEB. Cozy, inviting warmth.',
    'sunset': 'MAGICAL golden hour with intense warm light. Orange #FF8C42 and pink #FFB3D9 sky gradients. Purple #B8B5D6 mountain silhouettes. Long dramatic shadows in deep blue #4A5F8C. Amber #FFB366 rim lighting creates glowing fur edges. Romantic, dreamy atmosphere.',
    'evening': 'Soft twilight with purple-blue #8B9DC3 ambient light. Cool color temperature overall. Warm amber #FFB366 glow from Gondola House windows providing contrast. First stars visible. Peaceful, calm mood.',
    'interior': 'Warm amber #FFB366 interior lighting from lamps and fireplace. Soft glowing quality. Cozy orange #FF8C42 highlights. Cool blue #E3F2FD light streaming through windows provides contrast. Intimate, homey atmosphere with soft shadows.',
  };

  return lightingMap[timeOfDay] || lightingMap['afternoon'];
}

/**
 * Get complete color palette with hex codes for exact color matching
 */
export function getColorPaletteDetails(styleGuideKey: string): string {
  if (styleGuideKey !== 'bear-stories') return '';

  return `COLOR PALETTE (use exact hex codes):
  
SNOW & ICE:
- Fresh powder snow: #FFFFFF
- Snow shadows: #E3F2FD (soft ice blue)
- Snow highlights/sparkle: #F0F8FF (crystalline)
- Ice formations: #D6EAF8 (pale blue-white)

SKY & ATMOSPHERE:
- Clear daytime sky: #E3F2FD to #87CEEB gradient
- Sunrise/sunset sky: #FFE4E1 (peachy) to #FFB3D9 (pink) to #FF8C42 (orange)
- Mountain distance tint: #B8B5D6 (purple-gray)
- Evening twilight: #8B9DC3 (purple-blue)

GONDOLA HOUSE:
- Wood beams: #6B4423 (walnut brown)
- Wood planks: #D9A066 (honey brown)
- Stone chimney: #8B8680 (gray)
- Window glow: #FFB366 (warm amber)
- Red door: #E43F3F

LIGHTING:
- Golden sunlight: #FFD700
- Warm interior light: #FFB366 (amber) to #FF8C42 (orange)
- Rim lighting: #FFDAB9 (peachy-gold)
- Fire glow: #FF8C42 (orange)

CHARACTER CLOTHING:
- Mama's sweater: #F5E6D3 (cream)
- Papa's shirt red: #E43F3F
- DanDan's jacket: #40B5AD (teal)
- Chelson's beanie: #7EB9E2 (blue) with #E43F3F pom-pom
- Gondola cabins: #E43F3F (red)`;
}

/**
 * Get character constraint text for selected characters from a style guide
 * Used to inject character restrictions into page prompts
 */
export function getSelectedCharacterConstraints(
  styleGuideKey: string,
  selectedCharacterIds: string[]
): string {
  const guide = getStyleGuide(styleGuideKey);
  if (!guide?.selectableCharacters) return '';
  
  const selectedChars = guide.selectableCharacters
    .filter(c => selectedCharacterIds.includes(c.id));
  
  if (selectedChars.length === 0) return '';
  
  // Well-known themes use name-only format (AI models recognize these characters)
  const NAME_ONLY_THEMES = new Set([
    'bluey',
    'frozen',
    'paw-patrol',
    'peppa-pig',
    'cocomelon',
    'moana',
    'mickey-mouse',
    'mario',
    'sesame-street',
    'dora',
    'little-mermaid',
  ]);
  
  const useNameOnly = NAME_ONLY_THEMES.has(styleGuideKey);
  
  const charList = selectedChars
    .map(c => useNameOnly 
      ? `- ${c.name}` 
      : `- ${c.name}: ${c.description}`)
    .join('\n');
  
  return `
⚠️ CHARACTER RESTRICTIONS - STRICTLY ENFORCED:
ONLY the following characters may appear in this book:
${charList}

DO NOT include ANY other characters, animals, or named figures.
All characters not listed above are FORBIDDEN.
`;
}

