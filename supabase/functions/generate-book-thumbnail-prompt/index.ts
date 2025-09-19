/**
 * Generate Book Thumbnail Prompt Edge Function
 * 
 * This edge function generates specialized thumbnail prompts for SEO and social media
 * based on book metadata and style guide, optimized for 3:2 aspect ratio (1536x1024).
 * 
 * @requires OPENAI_API_KEY - OpenAI API key for GPT model access
 * @requires SUPABASE_URL - Supabase project URL
 * @requires SUPABASE_ANON_KEY - Supabase anonymous key for database access
 */

// XMLHttpRequest polyfill - Required for OpenAI API calls in Deno runtime
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Deno HTTP server - Core server functionality for handling HTTP requests
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Supabase JavaScript client - Database and auth operations
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

// Shared utilities and types
import { ProcessStatus, corsHeaders, log, generateRequestId } from '../_shared/types.ts';
import { appendSafeSpaceRules } from '../_shared/safeSpaceConfig.ts';

serve(async (req) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  log('INFO', ProcessStatus.IN_PROGRESS, 'REQUEST', `Starting book thumbnail prompt generation`, { requestId, method: req.method });

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

    const { bookId, userId } = await req.json();

    if (!bookId || !userId) {
      const errorMsg = 'Missing required parameters: bookId, userId';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        receivedParams: { bookId: !!bookId, userId: !!userId } 
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Request parsed successfully', { 
      requestId, 
      duration: Date.now() - parseStartTime,
      bookId: bookId?.substring(0, 8) + '...',
      userId: userId?.substring(0, 8) + '...'
    });

    currentStep = 'FETCH_BOOK_DATA';
    const fetchStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Fetching book data and style guide...', { requestId });

    // Fetch book data and latest style guide in parallel
    const [bookResult, styleGuideResult] = await Promise.all([
      supabaseClient
        .from('books')
        .select('id, book_name, category, book_description, user_id')
        .eq('id', bookId)
        .eq('user_id', userId)
        .single(),
      
      supabaseClient
        .from('book_system_prompts')
        .select('content')
        .eq('book_id', bookId)
        .eq('is_latest', true)
        .maybeSingle()
    ]);

    const fetchDuration = Date.now() - fetchStartTime;

    if (bookResult.error || !bookResult.data) {
      const errorMsg = 'Book not found or access denied';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        duration: fetchDuration,
        error: bookResult.error?.message,
        bookId: bookId?.substring(0, 8) + '...'
      });
      throw new Error(errorMsg);
    }

    const bookData = bookResult.data;
    const styleGuide = styleGuideResult.data?.content || null;

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Book data and style guide fetched successfully', { 
      requestId, 
      duration: fetchDuration,
      bookName: bookData.book_name?.substring(0, 30) + '...',
      category: bookData.category,
      hasStyleGuide: !!styleGuide
    });

    currentStep = 'FETCH_AGENT';
    const agentStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Fetching Illustration Director Agent configuration...', { requestId });

    // Fetch user's Illustration Director Agent configuration
    const { data: agentConfig, error: agentError } = await supabaseClient
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'illustration-director')
      .eq('is_latest', true)
      .single();

    const agentDuration = Date.now() - agentStartTime;

    if (agentError || !agentConfig) {
      const errorMsg = 'No Illustration Director Agent configuration found for user';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        duration: agentDuration,
        error: agentError?.message,
        userId: userId?.substring(0, 8) + '...'
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, `Found agent config: ${agentConfig.name}`, { 
      requestId, 
      duration: agentDuration,
      agentId: agentConfig.id?.substring(0, 8) + '...',
      model: agentConfig.model,
      version: agentConfig.version
    });

    currentStep = 'PREPARE_PROMPT';
    const promptStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Preparing thumbnail generation context...', { requestId });

    const thumbnailPrompt = `
Generate an SEO-optimized thumbnail image prompt for this book that will be used for social media sharing and search engine previews.

Book Information:
- Title: ${bookData.book_name}
- Category: ${bookData.category || 'Children\'s Educational Book'}
- Description: ${bookData.book_description || 'An engaging educational book for children'}

${styleGuide ? `
Existing Style Guide:
${styleGuide}

Please incorporate the established visual style from the style guide while optimizing for thumbnail format.
` : ''}

Generate a detailed image generation prompt that will create an effective thumbnail for this book.
    `.trim();

    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'OpenAI API key not configured', { requestId });
      throw new Error('OpenAI API key not configured');
    }

    const promptDuration = Date.now() - promptStartTime;
    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Thumbnail generation context prepared', { 
      requestId, 
      duration: promptDuration,
      contentLength: thumbnailPrompt.length,
      bookName: bookData.book_name
    });

    currentStep = 'OPENAI_API';
    const aiStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Calling OpenAI API for thumbnail prompt generation...', { 
      requestId,
      model: agentConfig.model,
      maxTokens: agentConfig.max_completion_tokens,
      topP: agentConfig.top_p
    });

    // Call OpenAI API using the Illustration Director agent's configuration
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agentConfig.model,
        max_completion_tokens: agentConfig.max_completion_tokens,
        top_p: parseFloat(agentConfig.top_p),
        messages: [
          {
            role: 'system',
            content: agentConfig.instructions
          },
          {
            role: 'user',
            content: thumbnailPrompt
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
    
    // Robustly extract text from GPT response
    const choice = data?.choices?.[0] ?? {};
    const msg = choice.message ?? {};
    let generatedPrompt = '';

    if (Array.isArray(msg.content)) {
      generatedPrompt = msg.content
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
      generatedPrompt = (msg.content as string).trim();
    }

    // Validate that we got a prompt
    if (!generatedPrompt) {
      const errorMsg = 'OpenAI returned empty thumbnail prompt';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, {
        requestId,
        duration: aiDuration,
        rawMessage: choice,
        bookName: bookData.book_name
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Thumbnail prompt generated successfully', { 
      requestId, 
      duration: aiDuration,
      originalPromptLength: generatedPrompt.length,
      tokensUsed: data.usage?.total_tokens,
      bookName: bookData.book_name
    });

    currentStep = 'APPLY_SAFE_SPACE';
    const safeSpaceStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Applying 3:2 aspect ratio safe space rules...', { requestId });

    // Apply 3:2 safe space rules for thumbnail optimization
    const enhancedPrompt = appendSafeSpaceRules(generatedPrompt, '3:2');

    const safeSpaceDuration = Date.now() - safeSpaceStartTime;
    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Safe space rules applied successfully', { 
      requestId, 
      duration: safeSpaceDuration,
      originalLength: generatedPrompt.length,
      enhancedLength: enhancedPrompt.length,
      aspectRatio: '3:2'
    });

    const totalDuration = Date.now() - startTime;
    log('INFO', ProcessStatus.COMPLETE, 'COMPLETE', 'Book thumbnail prompt generation completed successfully!', { 
      requestId,
      totalDuration,
      promptLength: enhancedPrompt.length,
      bookInfo: {
        name: bookData.book_name,
        category: bookData.category
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        thumbnailPrompt: enhancedPrompt,
        originalPrompt: generatedPrompt,
        bookId,
        aspectRatio: '3:2'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    log('ERROR', ProcessStatus.ERROR, currentStep || 'UNKNOWN', 'Book thumbnail prompt generation failed', { 
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