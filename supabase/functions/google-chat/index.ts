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

For example, if creating a CVC word book, ask questions in this order:
1. First, ask about theme/concept (with suggestions)
2. Then, ask about target age group (with suggestions)
3. Then, ask about art style (with suggestions)
4. Then, ask about additional learning objectives (with suggestions)
5. Then, ask about book structure (with suggestions)
6. **PROPOSE TITLE AND DESCRIPTION** - Based on all the information gathered, propose a book title and 2-3 sentence description
7. After user confirms the title and description, let them know they can click "Create Book"

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

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: allMessages,
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

    const aiResponse = await response.json();
    const rawContent = aiResponse.choices?.[0]?.message?.content || 'No response generated';

    console.log('Lovable AI response received, length:', rawContent.length);

    // Parse optional suggestions
    const { cleanContent, suggestedActions } = parseSuggestions(rawContent);

    return new Response(
      JSON.stringify({ 
        content: cleanContent,
        ...(suggestedActions && { suggestedActions })
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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
