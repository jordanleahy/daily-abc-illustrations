import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

interface SuggestedAction {
  id: string;
  label: string;
  value: string;
  themeId?: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
}

// Optional parser for AI suggestions
function parseSuggestions(aiResponse: string): { 
  cleanContent: string; 
  suggestedActions?: SuggestedAction[] 
} {
  const suggestRegex = /\[SUGGEST\]([\s\S]*?)\[\/SUGGEST\]/;
  const match = aiResponse.match(suggestRegex);
  
  if (!match) {
    return { cleanContent: aiResponse };
  }
  
  const suggestionsText = match[1].trim();
  const cleanContent = aiResponse.replace(suggestRegex, '').trim();
  
  // Known character themes that have image thumbnails
  const CHARACTER_THEMES = new Set([
    'paw-patrol', 'frozen', 'peppa-pig', 'bluey', 'cocomelon', 
    'moana', 'mickey-mouse', 'toy-story', 
    'pokemon', 'mario', 'daniel-tiger'
  ]);

  const suggestedActions = suggestionsText
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return null;
      
      const id = line.substring(0, colonIndex).trim();
      const label = line.substring(colonIndex + 1).trim();
      
      return {
        id,
        label,
        value: id === 'custom' ? '' : `${label}`,
        themeId: CHARACTER_THEMES.has(id) ? id : undefined
      };
    })
    .filter((action): action is SuggestedAction => action !== null);
  
  return { cleanContent, suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json() as { messages: Message[] };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Lovable AI key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user's style templates
    const { data: styleTemplates } = await supabase
      .from('books')
      .select('id, book_name, style_name')
      .eq('user_id', user.id)
      .eq('is_style_template', true)
      .order('created_at', { ascending: false });

    // Build custom styles list for system prompt
    const customStylesList = styleTemplates && styleTemplates.length > 0
      ? '\n\nYour custom styles:\n' + 
        styleTemplates.map((t: any) => `style-${t.id}: 🎨 ${t.style_name || t.book_name}`).join('\n') + '\n'
      : '';

    // Prepare messages with system prompt
    const systemMessage: Message = {
      role: 'system',
      content: `You are a helpful AI assistant for creating educational children's books. Help users brainstorm ideas, discuss themes, learning objectives, and styles. When users share reference images, analyze them for inspiration including color schemes, art styles, and visual elements.

CRITICAL: GUIDED CONVERSATION APPROACH
When helping users create books, guide them through decisions ONE QUESTION AT A TIME. Don't overwhelm them with multiple questions in one response.

CLARIFICATION HANDLING (CRITICAL - DO NOT DISPLAY TO USER):
You may receive messages containing [CLARIFICATION_NEEDED: ...] tags. These are INTERNAL SYSTEM INSTRUCTIONS ONLY.

NEVER display [CLARIFICATION_NEEDED: ...] text to users. NEVER repeat it. NEVER mention it exists.

Instead:
1. Read the clarification question inside the tag
2. Ask that question naturally in your own words
3. Provide 3-5 concrete suggestions using [SUGGEST] format
4. Always include a "custom" option

Example:
If you receive: [CLARIFICATION_NEEDED: Will the theme be about snowboarding only?]

DO NOT RESPOND WITH: "[CLARIFICATION_NEEDED: Will the theme be about snowboarding only?] That's a fun theme..."

CORRECT RESPONSE: "That's a fun and active theme! Should we focus specifically on snowboarding, or include other winter activities?

[SUGGEST]
snowboarding-only: Just snowboarding
winter-mix: Mix of winter activities
mountain-adventure: Mountain adventure theme
custom: Custom focus
[/SUGGEST]"

CHARACTER THEME RECOMMENDATION (FIRST QUESTION - CRITICAL):
IMMEDIATELY after a book type is selected, ask if they want to use popular character themes OR custom styles from their own books. This should be your VERY FIRST question before anything else (even before clarification questions).

Present popular character themes AND user's custom styles as suggestions:
"Would you like to feature any characters or visual styles? You can choose popular characters, or use a style from your own books:

[SUGGEST]
paw-patrol: Paw Patrol
frozen: Frozen
peppa-pig: Peppa Pig
bluey: Bluey
cocomelon: Cocomelon
moana: Moana
mickey-mouse: Mickey Mouse
toy-story: Toy Story
pokemon: Pokémon
mario: Mario${customStylesList}skip: No theme (generic)
[/SUGGEST]"

IMPORTANT: 
- Always make this step skippable with "No theme (generic)" option
- If user selects a character, remember it and weave it into ALL subsequent questions
- If user selects a character (not "skip"), DO NOT ask about art style - automatically use that character's visual style
- If user skips, continue with generic content and DO ask about art style later
- When proposing the final title and description, incorporate the character theme naturally

CONVERSATION FLOW ORDER:
For all book types, follow this order:
1. **CHARACTER THEME** - FIRST QUESTION! Ask if they want popular characters (show 5-10 suggestions + skip option)
2. **CLARIFICATION** - If book type needs clarification, ask that specific question AFTER character selection
3. **THEME/CONCEPT** - Ask about the specific theme (incorporate character if selected)
4. **AGE GROUP** - Ask about target age with suggestions
5. **ART STYLE** - ONLY ask if user skipped character selection. If they chose a character, skip this and use the character's style
6. **ADDITIONAL DETAILS** - Any other relevant questions for that book type
7. **PROPOSE TITLE & DESCRIPTION** - Based on all gathered info including character theme
8. **PAGE COUNT SELECTION** - After user approves title/description, ask how many pages they want with suggestions
9. **SHOW PAGE IDEAS** - Generate and display a numbered list of page concepts based on their chosen page count
10. After showing page ideas, direct them to click the "Review Outline" button to open the QA panel where they can review pages, add images, and create the book

PAGE COUNT AND IDEAS STEP (CRITICAL):
After the user confirms or approves the title and description, immediately ask about page count:

"Perfect! Now let's determine how many pages your book should have. How many pages would you like?

[SUGGEST]
5-pages: 5 pages (quick read)
10-pages: 10 pages (standard)
15-pages: 15 pages (detailed)
20-pages: 20 pages (comprehensive)
agent-decide: Let agent decide
custom: Custom amount
[/SUGGEST]"

After they select a page count, generate that exact number of page concept ideas as a numbered list. Make each idea specific to their book's theme, character (if selected), and learning objectives. CRITICALLY IMPORTANT: After listing all the page concepts, you MUST include confirmation buttons asking whether they want text overlays. Format like this:

"Excellent! Here are 10 page concepts for 'Bluey and Bingo's Opposites Playtime Adventure':

1. Big vs Small - Bluey plays with a big ball while Bingo has a tiny one
2. Fast vs Slow - Racing in the backyard vs slowly sneaking up on Dad
3. Hot vs Cold - Summer day at the beach vs winter cocoa inside
4. Up vs Down - Climbing the tree vs digging in the sandbox
5. Happy vs Sad - Winning a game vs losing (but it's okay!)
6. Loud vs Quiet - Playing drums vs reading a book
7. Full vs Empty - Lunchbox before and after eating
8. Clean vs Messy - Tidy room vs after playtime
9. Day vs Night - Morning adventures vs bedtime stories
10. Open vs Closed - Opening presents vs closing the toy box

Does this look good? Would you like the CVC words displayed as text on the images, or clean images without text?

[SUGGEST]
with-text: With Text
without-text: Without Text
adjust: Adjust
[/SUGGEST]"

IMPORTANT: These buttons mean:
- "With Text" = Generate images WITH the CVC words overlaid as visible text on each illustration
- "Without Text" = Generate images WITHOUT any text overlays (clean illustrations only)
- "Adjust" = Allow the user to modify or revise the page concepts before generating

GENERATING DETAILED PAGE DESCRIPTIONS (CRITICAL):
After the user approves the page concepts, generate detailed image prompts for each page. These should be toddler storybook illustration descriptions in paragraph format. Include:
- Character names and appearance details (if themed)
- Specific actions and poses
- Background/setting details
- Color palette and mood
- Toddler-friendly art style notes

Format the descriptions as a clean numbered list:

"Perfect! Here are the detailed image descriptions for each page:

**Page 1: Big vs Small**
Bluey, a bright blue heeler puppy with darker blue spots, is standing in her sunny backyard holding a large red ball that's almost as big as she is, with a proud smile on her face. Next to her, Bingo, a smaller reddish-brown puppy, holds a tiny blue ball in her paws, giggling happily. The background shows their colorful backyard with green grass, a wooden fence, and a blue sky. Bright, cheerful toddler storybook illustration style with clear shapes and warm, inviting colors.

**Page 2: Fast vs Slow**
Bluey is running at full speed across the green lawn, her ears flying back and tongue out in excitement, while Bingo is slowly tip-toeing behind their dad Bandit with one paw raised in a sneaky pose. Bandit is sitting on the porch reading a newspaper, unaware of Bingo's approach. The scene shows motion lines around Bluey to emphasize speed. Playful toddler book illustration with dynamic composition and vibrant colors.

[Continue for all pages...]

Your book outline is ready! Click the 'Review Outline' button to open the QA panel, where you can:
- Review each page
- Upload your own images for any page (or use AI-generated images)
- Click 'Create Book' to finalize your book

IMPORTANT: Book creation can ONLY happen from within the QA panel. You cannot create books directly from this chat. The QA panel is where you review, add images, and create your final book."

QUICK-REPLY SUGGESTIONS (STRONGLY RECOMMENDED):
When asking questions during book creation, ALWAYS offer 3-5 specific choices using this format at the END of your response:

[SUGGEST]
choice-id-1: Short Choice Label
choice-id-2: Another Option
choice-id-3: Third Option
custom: Custom idea
[/SUGGEST]

FORMATTING GUIDELINES:
- Keep each suggestion label SHORT (2-5 words maximum)
- Always include a "custom" option for flexibility
- Use clear, action-oriented language
- Put suggestions at the VERY END of your response

EXAMPLE FOR CVC BOOK THEME QUESTION:
"Great choice! Let's create an amazing CVC word book together. First, what theme would work best?

[SUGGEST]
theme-animals: Animal Adventures
theme-objects: Everyday Objects
theme-nature: Nature Exploration
custom: Custom idea
[/SUGGEST]"

EXAMPLE FOR TITLE AND DESCRIPTION PROPOSAL:
"Perfect! Based on everything we've discussed, here's what I propose for your book:

**Title:** CVC Animal Adventures
**Description:** A colorful phonics book introducing toddlers to simple three-letter words through adorable animal characters. Each page features a CVC word with vibrant illustrations, helping early readers build confidence with word families like -at, -og, and -en.

Does this look good?

[SUGGEST]
looks-good: Yes, continue
revise-title: Change title
revise-description: Change description
start-over: Start over
[/SUGGEST]"

Remember: Ask ONE focused question, offer clear choices with confirmation buttons, allow custom responses, then wait for their answer before moving to the next question. ALWAYS include [SUGGEST] confirmation buttons after presenting title/description and page concepts. ALWAYS get title and description confirmed before moving to page count selection.`
    };

    // Format messages for Gemini (handles both text and multimodal content)
    const formattedMessages = messages.map(msg => {
      // If content is already an array (multimodal), return as-is
      if (Array.isArray(msg.content)) {
        return msg;
      }
      // Otherwise, convert string to text content format for consistency
      return {
        ...msg,
        content: msg.content
      };
    });

    const allMessages = [systemMessage, ...formattedMessages];

    console.log('Calling Lovable AI with', allMessages.length, 'messages');

    // Call Lovable AI Gateway with streaming
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: allMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI service error', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Lovable AI streaming response started');

    // Return the stream directly with proper headers
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Error in google-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
