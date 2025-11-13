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
   - Main garment: Bright teal #40B5AD puffer jacket (winter) or hoodie (other seasons)
   - Jacket details: Puffy quilted texture, hood with fur trim, zippered
   - Color variations: Teal (primary), purple #9B6B9E (alternate), pink #FFB3D9 (rare)
   - Fit: Slightly oversized for growing room, sleeves pushed up or cuffed
   - Accessories: Colorful knit hat with stripes, mittens on string, backpack
   - Pants: Denim jeans or snow pants, practical for adventure
   
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

export const STYLE_GUIDES: Record<string, StyleGuide> = {
  'bear-stories': BEAR_STORIES_STYLE,
  // Future themes can be added here
};

export function getStyleGuide(styleGuideKey: string): StyleGuide | null {
  return STYLE_GUIDES[styleGuideKey] || null;
}
