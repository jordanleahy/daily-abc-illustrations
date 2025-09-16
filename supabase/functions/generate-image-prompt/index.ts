/**
 * Generate Image Prompt Edge Function
 * 
 * This edge function generates detailed image prompts for individual ABC book pages using
 * the user's Graphics Design Agent configuration and applies safe space rules. It fetches
 * page data, calls OpenAI to generate contextual image prompts, and saves them to the database.
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

// Safe space configuration - Content moderation and safety rules
// appendSafeSpaceRules: Applies family-friendly content guidelines to generated prompts
// Ensures all image prompts meet content safety standards for children's books
import { appendSafeSpaceRules } from '../_shared/safeSpaceConfig.ts';

// Remove hardcoded instructions - will fetch from agents table instead

serve(async (req) => {
  const requestId = generateRequestId();
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

    const { pageId, userId } = await req.json();

    if (!pageId || !userId) {
      const errorMsg = 'Missing required parameters: pageId, userId';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        receivedParams: { pageId: !!pageId, userId: !!userId } 
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Request parsed successfully', { 
      requestId, 
      duration: Date.now() - parseStartTime,
      pageId: pageId?.substring(0, 8) + '...',
      userId: userId?.substring(0, 8) + '...'
    });

    currentStep = 'FETCH_PAGE_AND_PROMPT';
    const fetchStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Fetching page data and system prompt from database...', { requestId });

    // Fetch the specific page data along with book system prompt
    const { data: pageData, error: pageError } = await supabaseClient
      .from('pages')
      .select(`
        id,
        letter,
        title,
        description,
        content,
        book_id,
        books!inner(
          user_id,
          book_system_prompts!book_system_prompts_book_id_fkey(
            id,
            content,
            is_deployed
          )
        )
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

    // Find the deployed book system prompt
    const deployedPrompt = pageData.books.book_system_prompts?.find((prompt: any) => prompt.is_deployed);
    if (!deployedPrompt) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'No deployed book system prompt found', { 
        requestId, 
        duration: fetchDuration,
        pageId: pageId?.substring(0, 8) + '...',
        bookId: pageData.book_id?.substring(0, 8) + '...',
        availablePrompts: pageData.books.book_system_prompts?.length || 0
      });
      throw new Error('No deployed book system prompt found. Please create and deploy a system prompt for this book first.');
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Page data and book system prompt fetched successfully', { 
      requestId, 
      duration: fetchDuration,
      letter: pageData.letter,
      title: pageData.title?.substring(0, 30) + '...',
      bookId: pageData.book_id?.substring(0, 8) + '...',
      hasSystemPrompt: !!deployedPrompt,
      promptLength: deployedPrompt.content?.length || 0
    });


    currentStep = 'FETCH_AGENT';
    const agentStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Fetching Graphics Design Agent configuration...', { requestId });

    // Fetch user's Graphics Design Agent configuration (now just for model settings)
    const { data: agentConfig, error: agentError } = await supabaseClient
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'graphic-designer')
      .eq('is_latest', true)
      .single();

    const agentDuration = Date.now() - agentStartTime;

    if (agentError || !agentConfig) {
      const errorMsg = 'No Graphics Design Agent configuration found for user';
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
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Preparing content for AI processing...', { requestId });

    // Prepare the content for the AI using the book system prompt directly
    const pageContent = `
Page Details:
Letter: ${pageData.letter}
Title: ${pageData.title}
Description: ${pageData.description || 'No description'}
Content: ${JSON.stringify(pageData.content, null, 2)}
    `.trim();

    // Extract aspect ratio from the book system prompt if specified
    const extractAspectRatio = (prompt: string): string => {
      const aspectRatioMatches = prompt.match(/aspect[_\s]*ratio[:\s]*([0-9]+:[0-9]+)/i) || 
                                prompt.match(/([0-9]+:[0-9]+)\s*(aspect|format|ratio)/i) ||
                                prompt.match(/\b([0-9]+:[0-9]+)\b/);
      return aspectRatioMatches ? aspectRatioMatches[1] : '1:1';
    };

    const aspectRatio = extractAspectRatio(deployedPrompt.content);

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
      model: agentConfig.model,
      maxTokens: agentConfig.max_completion_tokens,
      topP: agentConfig.top_p
    });

    // Call OpenAI API using the agent's configuration and instructions from database
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
            content: deployedPrompt.content
          },
          {
            role: 'user',
            content: `Create a detailed image prompt for this ABC book page:

${pageContent}

Please generate a specific, detailed image prompt that captures the visual elements and incorporates the page details (letter, title, description, content).`
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

    // Append safe space rules to the generated image prompt using extracted aspect ratio
    const enhancedImagePrompt = appendSafeSpaceRules(imagePrompt, aspectRatio);

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Image prompt generated successfully with safe space rules', { 
      requestId, 
      duration: aiDuration,
      originalPromptLength: imagePrompt.length,
      enhancedPromptLength: enhancedImagePrompt.length,
      tokensUsed: data.usage?.total_tokens,
      letter: pageData.letter,
      aspectRatio: aspectRatio
    });

    // Save the generated prompt to page_system_prompts table
    currentStep = 'SAVE_TO_DATABASE';
    const saveStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Saving generated prompt to database...', { requestId });

    // Get the next version number for this page
    const { data: versionData, error: versionError } = await supabaseClient
      .rpc('get_next_page_prompt_version_number', { p_page_id: pageId });

    if (versionError) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'Failed to get version number', { 
        requestId, 
        error: versionError.message 
      });
      throw new Error(`Failed to get version number: ${versionError.message}`);
    }

    const versionNumber = versionData || 1;

    // Insert the generated prompt into page_system_prompts table with individual metadata columns
    const { error: insertError } = await supabaseClient
      .from('page_system_prompts')
      .insert({
        page_id: pageId,
        book_id: pageData.book_id,
        user_id: userId,
        content: enhancedImagePrompt,
        version_number: versionNumber,
        source_type: 'image_generation',
        is_latest: true,
        is_deployed: true,
        deployed_at: new Date().toISOString(),
        prompt_status: 'complete',
        // Individual metadata columns
        prompt_type: 'image_generation',
        model: agentConfig.model,
        agent_name: agentConfig.name,
        agent_version: agentConfig.version,
        request_id: requestId,
        tokens_used: data.usage?.total_tokens || 0,
        generation_duration_ms: aiDuration,
        generated_at: new Date().toISOString(),
        page_letter: pageData.letter,
        page_title: pageData.title,
        safe_space_rules_applied: true,
        original_prompt_length: imagePrompt.length,
        enhanced_prompt_length: enhancedImagePrompt.length
      });

    if (insertError) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'Failed to save prompt to database', { 
        requestId, 
        error: insertError.message 
      });
      throw new Error(`Failed to save prompt to database: ${insertError.message}`);
    }

    const saveDuration = Date.now() - saveStartTime;
    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Generated prompt saved to database successfully', { 
      requestId, 
      duration: saveDuration,
      versionNumber,
      promptLength: enhancedImagePrompt.length
    });

    const totalDuration = Date.now() - startTime;
    log('INFO', ProcessStatus.COMPLETE, 'COMPLETE', 'Image prompt generation completed successfully!', { 
      requestId,
      totalDuration,
      promptLength: enhancedImagePrompt.length,
      pageInfo: {
        letter: pageData.letter,
        title: pageData.title
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        imagePrompt: enhancedImagePrompt,
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