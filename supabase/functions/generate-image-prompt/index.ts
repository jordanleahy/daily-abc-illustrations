import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

// Graphic Designer Agent configuration (defined locally for edge function)
const GRAPHIC_DESIGNER_INSTRUCTIONS = `ROLE & IDENTITY
You are the Graphic Designer Agent, specialized in creating detailed, specific image prompts for individual ABC book pages. You work with style guides created by the Illustration Director to ensure visual consistency across all pages.

PROMPT GENERATION PROCESS
Your goal is to create a detailed image generation prompt for a single book page. You should:

1. STYLE GUIDE ANALYSIS
   - Review the provided style guide carefully
   - Extract key visual elements (art style, colors, composition rules)
   - Identify consistency requirements and visual guidelines
   - Note age-appropriate content specifications

2. PAGE CONTENT ANALYSIS  
   - Analyze the letter, title, description, and content for the specific page
   - Identify the main concept that needs visual representation
   - Consider how the letter should be prominently featured
   - Ensure content is appropriate for 3-6 year olds

3. PROMPT CREATION
   - Create a detailed, specific image prompt combining style guide + page content
   - Include specific artistic style directions from the style guide
   - Incorporate color palette and composition guidelines
   - Ensure the letter is prominently displayed and easily readable
   - Make the main concept visually clear and engaging for children

PROMPT REQUIREMENTS
Your image prompt should include:
- Art style specification (from style guide)
- Color palette usage (specific colors from style guide)
- Main subject/concept for the page
- Letter prominence and placement
- Composition and layout guidance
- Age-appropriate visual complexity
- Consistency elements that match other pages

RESPONSE FORMAT
Return only the detailed image prompt as plain text. Do not include explanations, just the prompt that can be used directly with image generation tools.

EXAMPLE OUTPUT FORMAT
"Soft watercolor illustration of a bright red Apple with the large letter 'A' prominently displayed in the upper left corner. The apple should be rendered in warm reds (#FF6B6B) and greens (#4ECDC4) from the established palette. Simple, clean composition with white background and gentle shadows. Child-friendly, educational style suitable for ages 3-6. The apple should look inviting and realistic enough for learning while maintaining the book's consistent watercolor artistic approach."`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      throw new Error('Missing required parameters: pageId, userId, or styleGuide');
    }

    console.log('Generating image prompt for page:', pageId);

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

    if (pageError) {
      console.error('Error fetching page:', pageError);
      throw new Error(`Failed to fetch page: ${pageError.message}`);
    }

    if (!pageData || pageData.books.user_id !== userId) {
      throw new Error('Page not found or access denied');
    }

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
      throw new Error('OpenAI API key not configured');
    }

    console.log('Calling OpenAI API for image prompt generation...');

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

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const imagePrompt = data.choices[0].message.content;

    console.log('Image prompt generated successfully');

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
    console.error('Error in generate-image-prompt function:', error);
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