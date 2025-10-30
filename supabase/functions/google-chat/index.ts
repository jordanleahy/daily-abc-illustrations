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
        value: id === 'custom' ? '' : `${label}`
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

    // Prepare messages with system prompt
    const systemMessage: Message = {
      role: 'system',
      content: `You are a helpful AI assistant for creating educational children's books. Help users brainstorm ideas, discuss themes, learning objectives, and styles. When users share reference images, analyze them for inspiration including color schemes, art styles, and visual elements.

CRITICAL: GUIDED CONVERSATION APPROACH
When helping users create books, guide them through decisions ONE QUESTION AT A TIME. Don't overwhelm them with multiple questions in one response.

CLARIFICATION HANDLING:
When you see [CLARIFICATION_NEEDED: ...] in a message, this means the user selected a book type that benefits from clarification. Use the context provided to ask ONE specific, focused question with 3-5 suggested options using the [SUGGEST] format below. Make the suggestions concrete and actionable. Always include a "custom" option for flexibility. After getting their answer, continue with the normal guided conversation flow.

CHARACTER THEME RECOMMENDATION (FIRST QUESTION - CRITICAL):
IMMEDIATELY after a book type is selected, ask if they want to use popular character themes. This should be your VERY FIRST question before anything else (even before clarification questions).

Present 5-10 popular toddler show characters as suggestions. Choose from:
- Paw Patrol 🐾
- Bluey 🐶
- Frozen ❄️ (Elsa & Anna)
- Cocomelon 🎵
- PJ Masks 🦎
- Daniel Tiger 🐯
- Peppa Pig 🐷
- Mickey Mouse 🐭
- Sesame Street 🎪
- Spider-Man 🕷️

Format the question with suggestions:
"Would you like to feature any popular characters in your [book type]? Kids love seeing familiar faces! Here are some popular options, or you can skip this:

[SUGGEST]
paw-patrol: 🐾 Paw Patrol
bluey: 🐶 Bluey
frozen: ❄️ Frozen
cocomelon: 🎵 Cocomelon
pj-masks: 🦎 PJ Masks
daniel-tiger: 🐯 Daniel Tiger
peppa-pig: 🐷 Peppa Pig
mickey: 🐭 Mickey Mouse
sesame: 🎪 Sesame Street
spiderman: 🕷️ Spider-Man
skip: ✨ No theme (generic)
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
10. After showing page ideas, let them know they can click "Create Book"

PAGE COUNT AND IDEAS STEP (CRITICAL):
After the user confirms or approves the title and description, immediately ask about page count:

"Perfect! Now let's determine how many pages your book should have. How many pages would you like?

[SUGGEST]
5-pages: 5 pages (quick read)
10-pages: 10 pages (standard)
15-pages: 15 pages (detailed)
20-pages: 20 pages (comprehensive)
custom: ✨ Custom amount
[/SUGGEST]"

After they select a page count, generate that exact number of page ideas as a numbered list. Make each idea specific to their book's theme, character (if selected), and learning objectives. Format like this:

"Excellent! Here are 10 page ideas for 'Bluey and Bingo's Opposites Playtime Adventure':

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

Does this look good? You can now click 'Create Book' to bring it to life!"

QUICK-REPLY SUGGESTIONS (STRONGLY RECOMMENDED):
When asking questions during book creation, ALWAYS offer 3-5 specific choices using this format at the END of your response:

[SUGGEST]
choice-id-1: Short Choice Label
choice-id-2: Another Option
choice-id-3: Third Option
custom: ✨ Custom idea
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
custom: ✨ Custom idea
[/SUGGEST]"

EXAMPLE FOR TITLE AND DESCRIPTION PROPOSAL:
"Perfect! Based on everything we've discussed, here's what I propose for your book:

**Title:** CVC Animal Adventures
**Description:** A colorful phonics book introducing toddlers to simple three-letter words through adorable animal characters. Each page features a CVC word with vibrant illustrations, helping early readers build confidence with word families like -at, -og, and -en.

Does this capture what you're looking for? Feel free to suggest any changes to the title or description, or if you're happy with it, click 'Create Book' to bring it to life!"

Remember: Ask ONE focused question, offer clear choices, allow custom responses, then wait for their answer before moving to the next question. ALWAYS get title and description confirmed before book creation.`
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
