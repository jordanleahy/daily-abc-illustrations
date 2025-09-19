/**
 * Generate Style Guide Edge Function
 * 
 * This Supabase Edge Function generates a visual style guide for ABC books using OpenAI.
 * It fetches the user's Illustration Director Agent configuration and creates a comprehensive
 * style guide that is then used to update the Graphics Design Agent's instructions.
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { ProcessStatus, corsHeaders, log, generateRequestId } from '../_shared/types.ts';
import { processAgentTemplate } from '../_shared/templateProcessor.ts';

serve(async (req) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  log('INFO', ProcessStatus.IN_PROGRESS, 'REQUEST', `Starting style guide generation`, { requestId, method: req.method });

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    const { bookId, userId, bookMetadata } = await req.json();
    
    if (!bookId || !userId || !bookMetadata) {
      const errorMsg = 'Missing required parameters: bookId, userId, or bookMetadata';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        receivedParams: { bookId: !!bookId, userId: !!userId, bookMetadata: !!bookMetadata } 
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Request parsed successfully', { 
      requestId, 
      duration: Date.now() - parseStartTime,
      bookId: bookId?.substring(0, 8) + '...',
      userId: userId?.substring(0, 8) + '...'
    });

    currentStep = 'CREATE_RECORD';
    const recordStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Creating style guide record...', { requestId });

    // Get next version number and create initial record
    const { data: nextVersionNumber } = await supabaseClient.rpc('get_next_version_number', { p_book_id: bookId });
    
    const { data: newPrompt, error: createError } = await supabaseClient
      .from('book_system_prompts')
      .insert({
        book_id: bookId,
        user_id: userId,
        content: 'Style guide generation in progress...',
        version_number: nextVersionNumber || 1,
        is_latest: true,
        is_deployed: false,
        prompt_status: ProcessStatus.IN_PROGRESS,
        source_type: 'generated',
        generation_metadata: {
          started_at: new Date().toISOString(),
          request_id: requestId
        }
      })
      .select()
      .single();

    const recordDuration = Date.now() - recordStartTime;

    if (createError || !newPrompt) {
      const errorMsg = `Failed to create style guide record: ${createError?.message}`;
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        duration: recordDuration,
        error: createError 
      });
      throw new Error(errorMsg);
    }

    const promptId = newPrompt.id;
    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Style guide record created', { 
      requestId, 
      duration: recordDuration,
      promptId: promptId?.substring(0, 8) + '...' 
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
      const errorMsg = 'No Illustration Director Agent configuration found';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        duration: agentDuration,
        error: agentError?.message,
        userId: userId?.substring(0, 8) + '...'
      });
      
      // Update record with error
      await supabaseClient
        .from('book_system_prompts')
        .update({
          prompt_status: ProcessStatus.ERROR,
          generation_metadata: {
            error_message: errorMsg,
            failed_at: new Date().toISOString(),
            request_id: requestId
          }
        })
        .eq('id', promptId);

      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, `Found agent: ${agentConfig.name}`, { 
      requestId, 
      duration: agentDuration,
      agentId: agentConfig.id?.substring(0, 8) + '...',
      model: agentConfig.model,
      version: agentConfig.version
    });

    currentStep = 'PREPARE_PROMPT';
    const promptStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Preparing style guide prompt...', { requestId });

    // Prepare the prompt for OpenAI
    const styleGuidePrompt = `Please create your visual style guide for this ABC book:

Book Information:
- Name: ${bookMetadata.book_name}
- Category: ${bookMetadata.category || 'General'}
- Description: ${bookMetadata.book_description || 'ABC learning book'}`;

    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'OpenAI API key not configured', { requestId });
      throw new Error('OpenAI API key not configured');
    }

    // Process agent instructions template with book-specific variables
    const { processedTemplate: processedInstructions } = processAgentTemplate(
      agentConfig.instructions,
      bookMetadata,
      requestId
    );

    const promptDuration = Date.now() - promptStartTime;
    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Style guide prompt prepared', { 
      requestId, 
      duration: promptDuration,
      promptLength: styleGuidePrompt.length,
      bookName: bookMetadata.book_name?.substring(0, 20) + '...'
    });

    currentStep = 'OPENAI_API';
    const aiStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Calling OpenAI API for style guide generation...', { 
      requestId,
      model: agentConfig.model,
      maxTokens: agentConfig.max_completion_tokens,
      topP: agentConfig.top_p
    });

    // Call OpenAI API using the agent's model settings
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agentConfig.model,
        messages: [
          { role: 'system', content: processedInstructions },
          { role: 'user', content: styleGuidePrompt }
        ],
        max_completion_tokens: agentConfig.max_completion_tokens,
        top_p: parseFloat(agentConfig.top_p),
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
      
      // Update record with error
      await supabaseClient
        .from('book_system_prompts')
        .update({
          prompt_status: ProcessStatus.ERROR,
          generation_metadata: {
            error_message: errorMsg,
            failed_at: new Date().toISOString(),
            request_id: requestId
          }
        })
        .eq('id', promptId);

      throw new Error(errorMsg);
    }

    const data = await response.json();
    
    // Robustly extract text from GPT response
    const choice = data?.choices?.[0] ?? {};
    const msg = choice.message ?? {};
    let styleGuide = '';

    if (Array.isArray(msg.content)) {
      styleGuide = msg.content
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
      styleGuide = (msg.content as string).trim();
    }

    // Validate that we got a style guide
    if (!styleGuide) {
      const errorMsg = 'OpenAI returned empty style guide';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, {
        requestId,
        duration: aiDuration,
        rawMessage: choice,
        bookName: bookMetadata.book_name
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Style guide generated successfully', { 
      requestId, 
      duration: aiDuration,
      styleGuideLength: styleGuide.length,
      tokensUsed: data.usage?.total_tokens,
      bookName: bookMetadata.book_name
    });

    currentStep = 'UPDATE_RECORDS';
    const updateStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Updating database records...', { requestId });

    // Update the book system prompt record with the generated style guide
    const { error: updateError } = await supabaseClient
      .from('book_system_prompts')
      .update({
        content: styleGuide,
        prompt_status: ProcessStatus.COMPLETE,
        is_deployed: true,
        deployed_at: new Date().toISOString(),
        generation_metadata: {
          model: agentConfig.model,
          generated_at: new Date().toISOString(),
          request_id: requestId,
          agent_version: agentConfig.version,
          tokens_used: data.usage?.total_tokens
        }
      })
      .eq('id', promptId);

    if (updateError) {
      log('ERROR', ProcessStatus.WARNING, currentStep, `Failed to update style guide: ${updateError.message}`, { requestId });
    }

    // Update book metadata
    const { error: bookUpdateError } = await supabaseClient
      .from('books')
      .update({
        current_system_prompt_id: promptId,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookId);

    if (bookUpdateError) {
      log('ERROR', ProcessStatus.WARNING, currentStep, `Failed to update book metadata: ${bookUpdateError.message}`, { requestId });
    }

    const updateDuration = Date.now() - updateStartTime;
    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Database records updated', { 
      requestId, 
      duration: updateDuration
    });

    const totalDuration = Date.now() - startTime;
    log('INFO', ProcessStatus.COMPLETE, 'COMPLETE', 'Style guide generation completed successfully!', { 
      requestId, 
      totalDuration,
      styleGuideLength: styleGuide.length,
      bookInfo: {
        name: bookMetadata.book_name,
        category: bookMetadata.category
      }
    });

    return new Response(JSON.stringify({
      success: true,
      styleGuide,
      agentUsed: {
        id: agentConfig.id,
        name: agentConfig.name,
        model: agentConfig.model,
        version: agentConfig.version
      },
      promptId,
      processingTime: totalDuration
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    log('ERROR', ProcessStatus.ERROR, currentStep || 'UNKNOWN', 'Style guide generation failed', { 
      requestId,
      totalDuration,
      error: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});