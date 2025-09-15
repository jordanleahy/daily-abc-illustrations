/**
 * Generate Graphics Designer System Prompt Edge Function
 * 
 * This edge function generates a comprehensive system prompt for the Graphics Designer Agent
 * based on book metadata (name, category, description) using the user's Illustration Director Agent.
 * 
 * @requires OPENAI_API_KEY - OpenAI API key for GPT model access
 * @requires SUPABASE_URL - Supabase project URL
 * @requires SUPABASE_ANON_KEY - Supabase anonymous key for database access
 */

// XMLHttpRequest polyfill - Required for OpenAI API calls in Deno runtime
// Provides browser-compatible XMLHttpRequest functionality that some libraries expect
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Deno HTTP server - Core server functionality for handling HTTP requests
// Used to create the edge function endpoint that responds to HTTP requests
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Supabase JavaScript client - Database and auth operations
// Provides type-safe access to Supabase database, auth, and other services
// Version pinned to ensure consistent behavior across deployments
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

// Shared utilities and types - Common functionality across edge functions
// ProcessStatus: Enum for tracking operation states (IN_PROGRESS, COMPLETE, ERROR)
// corsHeaders: CORS headers for browser compatibility
// log: Structured logging utility for debugging and monitoring
// generateRequestId: Creates unique identifiers for request tracking
import { ProcessStatus, corsHeaders, log, generateRequestId } from '../_shared/types.ts';

serve(async (req) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  log('INFO', ProcessStatus.IN_PROGRESS, 'REQUEST', `Starting Graphics Designer system prompt generation`, { requestId, method: req.method });

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
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Fetching book data...', { requestId });

    // Fetch book data
    const { data: bookData, error: bookError } = await supabaseClient
      .from('books')
      .select('id, book_name, category, book_description, user_id')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single();

    const fetchDuration = Date.now() - fetchStartTime;

    if (bookError || !bookData) {
      const errorMsg = 'Book not found or access denied';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        duration: fetchDuration,
        error: bookError?.message,
        bookId: bookId?.substring(0, 8) + '...'
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Book data fetched successfully', { 
      requestId, 
      duration: fetchDuration,
      bookName: bookData.book_name?.substring(0, 30) + '...',
      category: bookData.category
    });

    currentStep = 'FETCH_ILLUSTRATION_DIRECTOR';
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
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Preparing book data for AI processing...', { requestId });

    const bookDataPrompt = `
Book Data:
- Book Name: ${bookData.book_name}
- Category: ${bookData.category || 'General Children\'s Book'}
- Description: ${bookData.book_description || 'An educational ABC book for children'}

Please generate a comprehensive system prompt for the Graphics Designer Agent that will be used to create image prompts for individual pages of this book.
    `.trim();

    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'OpenAI API key not configured', { requestId });
      throw new Error('OpenAI API key not configured');
    }

    const promptDuration = Date.now() - promptStartTime;
    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Book data prepared for AI processing', { 
      requestId, 
      duration: promptDuration,
      contentLength: bookDataPrompt.length
    });

    currentStep = 'OPENAI_API';
    const aiStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Calling OpenAI API for system prompt generation...', { 
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
            content: bookDataPrompt
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
    let systemPrompt = '';

    if (Array.isArray(msg.content)) {
      systemPrompt = msg.content
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
      systemPrompt = (msg.content as string).trim();
    }

    // Validate that we got a system prompt
    if (!systemPrompt) {
      const errorMsg = 'OpenAI returned empty system prompt';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, {
        requestId,
        duration: aiDuration,
        rawMessage: choice,
        bookName: bookData.book_name
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'System prompt generated successfully', { 
      requestId, 
      duration: aiDuration,
      promptLength: systemPrompt.length,
      tokensUsed: data.usage?.total_tokens,
      bookName: bookData.book_name
    });

    const totalDuration = Date.now() - startTime;
    log('INFO', ProcessStatus.COMPLETE, 'COMPLETE', 'Graphics Designer system prompt generation completed successfully!', { 
      requestId,
      totalDuration,
      promptLength: systemPrompt.length,
      bookInfo: {
        name: bookData.book_name,
        category: bookData.category
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        systemPrompt: systemPrompt,
        bookId 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    log('ERROR', ProcessStatus.ERROR, currentStep || 'UNKNOWN', 'Graphics Designer system prompt generation failed', { 
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