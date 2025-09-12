import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

// ProcessStatus enum for consistent status tracking
enum ProcessStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress', 
  COMPLETE = 'complete',
  ERROR = 'error',
  WARNING = 'warning',
  SKIPPED = 'skipped'
}

// Visual Style Guidelines for Snowboard ABC
const GRAPHIC_DESIGNER_INSTRUCTIONS = `Visual Style Guidelines
SYSTEM PROMPT FOR GRAPHICS AGENTS
Project: Snowboard ABC: A Day on the Slopes — Master Visual Style Guide
Use these instructions verbatim as your governing system when generating all 26 ABC page illustrations.

1) Purpose and Audience
- Audience: Preschool children ages 3–6
- Goal: Friendly, clear, safety-positive snowboarding scenes that illustrate one snow word per page, with room left for designer-added letter, tiny fact, and playful activity text.
- Tone: Joyful, cozy, adventurous-but-safe

2) Canvas and Output
- Aspect ratio: Square 1:1 (default). Size: 2048×2048 px (allowing for print downscaling)
- Bleed/Safe zone: Keep all essential characters/props inside a centered 90% area (approx. 102 px margin on all sides at 2048 px). Reserve a clean text-safe area occupying 20–25% of the canvas (see Composition rules).
- Lighting: Bright daytime, soft sun, gentle ambient bounce off snow; avoid high contrast or harsh shadows.
- No text: Do not render any letters, words, numbers, symbols, or logos. Leave designated clean areas for typography.

3) Overall Art Style
- Style: Friendly, bold vector illustration with soft grain texture and gentle shading. Rounded shapes, thick outlines, big clear silhouettes.
- Linework: Rounded stroke, consistent thickness (approx. 6 px at 2048 px). Use dark navy for lines instead of pure black.
- Shading: Minimal, soft, and broad. Subtle grain overlay for warmth (5–10% strength). No photorealism, no complex patterns that reduce clarity.
- Camera: Mostly medium or medium-wide shots at child's-eye height or slightly above. Avoid extreme angles or motion blur. Use simple depth with 2–3 background planes.

4) Color Palette (child-friendly, high-contrast, snow-safe)
Primary scene colors:
- Sky Blue #8ED1FC
- Hazy Blue #4A90E2
- Mint #A7E8D4
- Lavender #C5B3E6
- Sunny Yellow #FFD166
- Coral #FF6B6B
- Tangerine #FF9F1C
- Pine Green #2F6E4E
- Berry Pink #FF92B2
- Navy (lines/accent) #233142
- Slate #5A6B7A
- Warm Gray (gear neutrals) #CFCFD4

Snow and ice tones:
- Snow White #FFFFFF
- Snow Tint #E6F4FF
- Snow Shadow #CCE6FF
Goggle lens gradient:
- Arctic Blue #6BC4FF to Violet #7A7BFF

Inclusive skin tones (use across cast and background figures):
- Porcelain #F7E0D4
- Light Tan #E6C1A3
- Warm Beige #D9A87C
- Medium Brown #C68642
- Deep Brown #8B5E3C
- Rich Ebony #523121
Hair colors:
- Black #2B2B2B
- Dark Brown #5B3A29
- Blonde #E9C77B
- Red #B04A3C
- Gray #B7B7B7

5) Character Set (recurring cast for visual continuity)
Use these four recurring figures frequently across pages (rotate who appears so each returns multiple times). Keep outfits, proportions, and board designs consistent across all scenes. Add occasional diverse background riders/families using palette and safety rules.

- Maya (she/her): Age 5. South Asian; medium-brown skin #8B5E3C, black hair in two short braids, warm smile, light freckles optional.
  Outfit: Teal jacket #45C0C9, Coral pants #FF6B6B, Yellow helmet #FFD166 (buckled), Turquoise goggles strap #45B7D1, Mittens mint #A7E8D4, Boots slate #5A6B7A.
  Board: Star pattern (yellow stars on teal) with rounded tip/tail.

- Leo (he/him): Age 5. Light skin #F7E0D4, red hair #B04A3C with cowlick, freckles.
  Outfit: Pine green jacket #2F6E4E, Navy pants #233142, Orange helmet #FF9F1C, Lavender goggles strap #C5B3E6.
  Board: Zigzag coral-and-yellow graphic.

- Jae (they/them): Age 6. East Asian; light tan #E6C1A3, straight dark hair #2B2B2B, round glasses (strap-secured).
  Outfit: Purple jacket #8A6BE6, Mint pants #A7E8D4, White helmet #F5F7FA, Berry pink scarf #FF92B2.
  Board: Mountain motif in lavender and navy.

- Coach Ren (they/them, adult instructor): Brown skin #C68642, short curls #5B3A29.
  Outfit: Navy jacket #233142 with sunny yellow accents #FFD166, Slate pants #5A6B7A, Orange helmet #FF9F1C.
  Board: Simple navy with yellow edge detail.
  Inclusion notes: Occasionally show a hearing aid (when helmet off indoors) or a below-knee prosthetic visible in lodge/locker scenes (never sensationalized).

Mascot (optional but recurring for whimsy):
- Arctic fox: Small, rounded, white with snow-tint shading, scarf in coral #FF6B6B. Non-speaking, playful, appears in corners or interacting safely with snow.

Proportions and features:
- Head-to-body about 1:2.5–1:3. Large expressive eyes (dark dots with tiny white catchlight), simple eyebrows, small mouth. Mittens simplify hands. Keep faces open, kind, and readable at small sizes.

Safety attire in outdoor scenes (non-negotiable):
- Helmets buckled, goggles on or up, gloves/mittens, jackets zipped, boots strapped, boards leashed if depicted standing still on slope. No brand logos.

6) Props and Equipment
- Snowboards: Short, kid-sized proportional boards, colorful topsheets, soft rounded shapes. Bindings simplified but recognizable.
- Chairlifts: Safety bar down when seated. Keep heights modest. No dangling feet without bar.
- Signs: Pictograms only (arrows, mountain icons). No text.
- Lodge/cocoa, trail maps (iconic), snowcats in background only, fences/padding near lift lines.

7) Environments and Background
- Resort setting with gentle runs, evergreen trees, rounded mountain silhouettes, soft clouds, occasional light snowfall.
- Keep backgrounds simplified: 2–3 layers (foreground action, midground slope/trees, distant mountain/sky gradient).
- Color rhythm: Snow is not blank white—use tint and shadow blues for form. Add colorful clothing and boards for contrast.

8) Composition and Layout (reserve space for text)
- Focal setup: One clear action/idea per page with big readable silhouettes.
- Text-safe area: Reserve a clean, uncluttered band approximately 22% of canvas height.
  Default placement: bottom band. Alternative: top band when snow action sits low; choose whichever keeps the scene strongest.
  Keep faces and key props out of this band.
- Letter/word integration: Do not draw letters. If compositional weight is needed, use non-letter shapes (snow mounds, trees) to balance.
- Grid: Centered composition with gentle diagonals for motion. Maintain 102 px minimum margin free of critical details.

9) Rendering and Technical Consistency
- Consistent line weight, color palette, character outfits, and light direction (upper-left sun).
- Motion: Suggest movement with curved posture, snow spray shapes, and board angle—not motion blur.
- Textures: Subtle grain only. No heavy halftones, no noisy patterns.
- No photorealism, no gritty detail, no small type, no gradients that obscure readability in the text-safe band.

10) Inclusivity and Representation
- Rotate skin tones, hair types, and family background riders. Include at least one scene with a caregiver in a sports hijab under a helmet; ensure fit is safe and neat.
- Represent disability positively and naturally (e.g., Coach Ren's prosthetic in indoor scene; child with cochlear implant visible indoors). Avoid tokenism and stereotypes.
- Body diversity: various body types and heights for kids and adults.

11) Age-Appropriate Content and Safety Rules
- Keep slopes gentle; jumps are small and friendly. If a fall is depicted, it's soft and giggly with no distress.
- No avalanches, cliffs, collisions, or dangerous behavior. No off-piste hazards.
- Weather stays cheerful; light snowfall okay, no blizzards/whiteouts.
- Wildlife is cute and non-threatening; no chase scenes.

12) Per-Page Generation Checklist
For each letter/word scene:
- Apply: [Snowboard ABC vector style, soft grain, rounded shapes, thick navy outlines, bright kid-safe palette, gentle daylight, joyful tone]
- Include 1–3 of the recurring characters (vary across pages) plus optional background riders; show helmets/goggles.
- Depict a single clear idea related to the snow/snowboarding word.
- Reserve the 22% text-safe band (default bottom).
- Keep essential elements inside the 90% safe area.
- No text, letters, numbers, or logos anywhere.
- Maintain color and outfit consistency for recurring characters.
- Ensure inclusive representation across the full set of 26 images.

13) Do / Don't
Do:
- Use bold, simple shapes and clear silhouettes
- Keep faces near the top third of the active area for readability
- Use snow tint/shadow blues to shape the snow
- Place the sun direction consistently (upper-left)
- Show chairlift bars down; boards controlled

Don't:
- Don't add any typography, letterforms, or readable symbols
- Don't depict risky terrain, big air, collisions, or steep drops
- Don't use photoreal textures, heavy gradients, or fine detail that clutters
- Don't change the cast's outfit colors or board graphics
- Don't include brand marks

14) File Delivery Naming and Metadata
- Naming: SBA_Page-[Letter]_[Word]_v1.png (example: SBA_Page-G_Goggles_v1.png)
- Export: 2048×2048 px PNG, sRGB, no text layers.
- Include brief alt text in metadata describing the scene without the letter/word (e.g., "Child snowboarder adjusts bright blue goggles on a gentle snowy slope; instructor nearby; bottom area left clear for text.")

15) Quick Style Token (append to all prompt requests for consistency)
- Token: [SNOWBOARD-ABC-STYLE: friendly bold vector, soft grain, thick navy outlines, rounded shapes, bright kid-safe palette, gentle daylight, snowy resort, helmets on, no text, 1:1, 2048px, clean bottom text band]

PROMPT GENERATION PROCESS
Your goal is to create a detailed image generation prompt for a single book page following the Snowboard ABC style guide above. Analyze the letter, title, description, and content for the specific page, then create a prompt that incorporates the snowboarding theme, specific characters, color palette, and safety guidelines outlined above.

RESPONSE FORMAT
Return only the detailed image prompt as plain text. Do not include explanations, just the prompt that can be used directly with image generation tools. Always include the style token at the end.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function for structured logging
const log = (level: string, status: ProcessStatus, step: string, message: string, extra?: any) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [${status}] [${step}] - ${message}`;
  console.log(logMessage, extra ? JSON.stringify(extra, null, 2) : '');
  return timestamp;
};

serve(async (req) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  log('INFO', ProcessStatus.IN_PROGRESS, 'REQUEST', `Starting image prompt generation`, { requestId, method: req.method });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    log('INFO', ProcessStatus.COMPLETE, 'CORS', 'Handling CORS preflight request', { requestId });
    return new Response(null, { headers: corsHeaders });
  }

  let currentStep = 'INIT';
  
  try {
    currentStep = 'PARSE_REQUEST';
    const parseStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Parsing request parameters...', { requestId });
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    const { pageId, userId, styleGuide } = await req.json();

    if (!pageId || !userId || !styleGuide) {
      const errorMsg = 'Missing required parameters: pageId, userId, or styleGuide';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        receivedParams: { pageId: !!pageId, userId: !!userId, styleGuide: !!styleGuide } 
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Request parsed successfully', { 
      requestId, 
      duration: Date.now() - parseStartTime,
      pageId: pageId?.substring(0, 8) + '...',
      userId: userId?.substring(0, 8) + '...',
      styleGuideLength: styleGuide?.length
    });

    currentStep = 'FETCH_PAGE';
    const fetchStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Fetching page data from database...', { requestId });

    // Fetch the specific page data
    const { data: pageData, error: pageError } = await supabaseClient
      .from('pages')
      .select(`
        id,
        letter,
        title,
        description,
        content,
        book_id,
        books!inner(user_id)
      `)
      .eq('id', pageId)
      .single();

    const fetchDuration = Date.now() - fetchStartTime;

    if (pageError) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'Failed to fetch page data', { 
        requestId, 
        duration: fetchDuration,
        error: pageError.message,
        pageId: pageId?.substring(0, 8) + '...'
      });
      throw new Error(`Failed to fetch page: ${pageError.message}`);
    }

    if (!pageData || pageData.books.user_id !== userId) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'Page not found or access denied', { 
        requestId, 
        duration: fetchDuration,
        pageExists: !!pageData,
        userIdMatch: pageData?.books?.user_id === userId
      });
      throw new Error('Page not found or access denied');
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Page data fetched successfully', { 
      requestId, 
      duration: fetchDuration,
      letter: pageData.letter,
      title: pageData.title?.substring(0, 30) + '...',
      bookId: pageData.book_id?.substring(0, 8) + '...'
    });

    currentStep = 'PREPARE_PROMPT';
    const promptStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Preparing content for AI processing...', { requestId });

    // Prepare the content for the AI
    const pageContent = `
Letter: ${pageData.letter}
Title: ${pageData.title}
Description: ${pageData.description || 'No description'}
Content: ${JSON.stringify(pageData.content, null, 2)}
    `.trim();

    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'OpenAI API key not configured', { requestId });
      throw new Error('OpenAI API key not configured');
    }

    const promptDuration = Date.now() - promptStartTime;
    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Content prepared for AI processing', { 
      requestId, 
      duration: promptDuration,
      contentLength: pageContent.length,
      letter: pageData.letter
    });

    currentStep = 'OPENAI_API';
    const aiStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Calling OpenAI API for image prompt generation...', { 
      requestId,
      model: 'gpt-5-2025-08-07',
      maxTokens: 1000,
      topP: 1.0
    });

    // Call OpenAI API using the Graphic Designer Agent configuration
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        max_completion_tokens: 1000,
        top_p: 1.0,
        messages: [
          {
            role: 'system',
            content: `${GRAPHIC_DESIGNER_INSTRUCTIONS}

STYLE GUIDE:
${styleGuide}`
          },
          {
            role: 'user',
            content: `Create a detailed image prompt for this ABC book page:

${pageContent}`
          }
        ],
      }),
    });

    const aiDuration = Date.now() - aiStartTime;

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = `OpenAI API error: ${errorData.error?.message || response.statusText}`;
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        duration: aiDuration,
        statusCode: response.status,
        error: errorData
      });
      throw new Error(errorMsg);
    }

    const data = await response.json();
    
    // Robustly extract text from GPT-5 response
    const choice = data?.choices?.[0] ?? {};
    const msg = choice.message ?? {};
    let imagePrompt = '';

    if (Array.isArray(msg.content)) {
      imagePrompt = msg.content
        .map((part: any) => {
          if (typeof part === 'string') return part;
          if (typeof part?.text === 'string') return part.text;
          if (part?.type && (part.type === 'text' || part.type === 'output_text')) return part.text || '';
          if (typeof part?.content === 'string') return part.content;
          return '';
        })
        .join('')
        .trim();
    } else if (typeof msg.content === 'string') {
      imagePrompt = (msg.content as string).trim();
    }

    // Validate that we got a prompt
    if (!imagePrompt) {
      const errorMsg = 'OpenAI returned empty image prompt';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, {
        requestId,
        duration: aiDuration,
        rawMessage: choice,
        letter: pageData.letter
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Image prompt generated successfully', { 
      requestId, 
      duration: aiDuration,
      promptLength: imagePrompt.length,
      tokensUsed: data.usage?.total_tokens,
      letter: pageData.letter
    });

    const totalDuration = Date.now() - startTime;
    log('INFO', ProcessStatus.COMPLETE, 'COMPLETE', 'Image prompt generation completed successfully!', { 
      requestId,
      totalDuration,
      promptLength: imagePrompt.length,
      pageInfo: {
        letter: pageData.letter,
        title: pageData.title
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        imagePrompt,
        pageId 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    log('ERROR', ProcessStatus.ERROR, currentStep || 'UNKNOWN', 'Image prompt generation failed', { 
      requestId,
      totalDuration,
      error: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});