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
    
    // Handle both string and array content from GPT-5
    let imagePrompt = data.choices[0].message.content;
    if (Array.isArray(imagePrompt)) {
      // GPT-5 returns content as array, extract text content
      imagePrompt = imagePrompt.find(item => item.type === 'text')?.text || '';
    }

    // Validate that we got a prompt
    if (!imagePrompt || imagePrompt.trim().length === 0) {
      const errorMsg = 'OpenAI returned empty image prompt';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        duration: aiDuration,
        rawContent: data.choices[0].message.content,
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