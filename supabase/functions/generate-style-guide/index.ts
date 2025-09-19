/**
 * Generate Style Guide Edge Function
 * 
 * This Supabase Edge Function generates a visual style guide for ABC books using OpenAI.
 * It fetches the user's Illustration Director Agent configuration and creates a comprehensive
 * style guide that is then used to update the Graphics Design Agent's instructions.
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { ProcessStatus, corsHeaders, log, generateRequestId } from '../_shared/types.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Safely processes agent template by substituting variables with book-specific data
 */
function processAgentTemplate(
  template: string, 
  bookMetadata: any, 
  requestId: string
): { processedTemplate: string; variables: Record<string, string> } {
  if (!template || typeof template !== 'string') {
    console.log(`[${requestId}] Invalid template input, using original`);
    return { processedTemplate: template || '', variables: {} };
  }

  const sanitizeValue = (value: string | undefined | null, maxLength = 100): string => {
    if (!value) return '';
    
    let sanitized = String(value).trim()
      .replace(/[<>]/g, '')
      .replace(/\$\{.*?\}/g, '')
      .replace(/`/g, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '');
    
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength).trim();
    }
    
    return sanitized;
  };

  const templateVariables: Record<string, string> = {
    '<Category>': sanitizeValue(bookMetadata.category) || 'Educational',
    '<Theme>': sanitizeValue(bookMetadata.book_name) || 'ABC Learning',
    '<CATEGORY>': sanitizeValue(bookMetadata.category) || 'Educational',
    '<THEME>': sanitizeValue(bookMetadata.book_name) || 'ABC Learning',
    '<BOOK_NAME>': sanitizeValue(bookMetadata.book_name) || 'ABC Learning',
    '<BOOK_CATEGORY>': sanitizeValue(bookMetadata.category) || 'Educational',
    '<BOOK_DESCRIPTION>': sanitizeValue(bookMetadata.book_description, 200) || 'An educational ABC learning book',
  };

  try {
    let processedTemplate = template;
    const usedVariables: Record<string, string> = {};

    const escapeRegExp = (string: string): string => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    for (const variable of Object.keys(templateVariables)) {
      const value = templateVariables[variable];
      
      if (processedTemplate.includes(variable)) {
        processedTemplate = processedTemplate.replace(new RegExp(escapeRegExp(variable), 'g'), value);
        usedVariables[variable] = value;
      }
    }
    
    return { processedTemplate, variables: usedVariables };

  } catch (error) {
    console.error(`[${requestId}] Error processing template:`, error);
    return { processedTemplate: template, variables: {} };
  }
}

serve(async (req) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  log('INFO', ProcessStatus.IN_PROGRESS, 'REQUEST', `Starting style guide generation`, { requestId });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request
    const { bookId, userId, bookMetadata } = await req.json();
    
    if (!bookId || !userId || !bookMetadata) {
      const errorMsg = 'Missing required parameters: bookId, userId, or bookMetadata';
      log('ERROR', ProcessStatus.ERROR, 'VALIDATION', errorMsg, { requestId });
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log('INFO', ProcessStatus.IN_PROGRESS, 'PARSE', 'Request parsed successfully', { 
      requestId, 
      bookId: bookId?.substring(0, 8) + '...'
    });

    // Get next version number and create initial record
    const { data: nextVersionNumber } = await supabase.rpc('get_next_version_number', { p_book_id: bookId });
    
    const { data: newPrompt, error: createError } = await supabase
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

    if (createError || !newPrompt) {
      const errorMsg = `Failed to create style guide record: ${createError?.message}`;
      log('ERROR', ProcessStatus.ERROR, 'CREATE_RECORD', errorMsg, { requestId });
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const promptId = newPrompt.id;
    log('INFO', ProcessStatus.COMPLETE, 'CREATE_RECORD', 'Created style guide record', { 
      requestId, 
      promptId: promptId?.substring(0, 8) + '...' 
    });

    // Fetch user's Illustration Director Agent configuration
    const { data: agentConfig, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'illustration-director')
      .eq('is_latest', true)
      .single();

    if (agentError || !agentConfig) {
      const errorMsg = 'No Illustration Director Agent configuration found';
      log('ERROR', ProcessStatus.ERROR, 'FETCH_AGENT', errorMsg, { requestId });
      
      // Update record with error
      await supabase
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

      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log('INFO', ProcessStatus.COMPLETE, 'FETCH_AGENT', `Found agent: ${agentConfig.name}`, { 
      requestId, 
      model: agentConfig.model,
      version: agentConfig.version
    });

    // Prepare the prompt for OpenAI
    const styleGuidePrompt = `Please create your visual style guide for this ABC book:

Book Information:
- Name: ${bookMetadata.book_name}
- Category: ${bookMetadata.category || 'General'}
- Description: ${bookMetadata.book_description || 'ABC learning book'}`;

    // Process agent instructions template with book-specific variables
    const { processedTemplate: processedInstructions } = processAgentTemplate(
      agentConfig.instructions,
      bookMetadata,
      requestId
    );

    log('INFO', ProcessStatus.IN_PROGRESS, 'OPENAI_CALL', 'Calling OpenAI API', { 
      requestId,
      model: agentConfig.model
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

    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = `OpenAI API error: ${response.status} - ${errorText}`;
      log('ERROR', ProcessStatus.ERROR, 'OPENAI_ERROR', errorMsg, { requestId });
      
      // Update record with error
      await supabase
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

      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const styleGuide = data.choices[0].message.content;

    log('INFO', ProcessStatus.COMPLETE, 'OPENAI_SUCCESS', 'Style guide generated successfully', { 
      requestId,
      styleGuideLength: styleGuide.length
    });

    // Update the book system prompt record with the generated style guide
    const { error: updateError } = await supabase
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
          variables_used: Object.keys(processAgentTemplate(agentConfig.instructions, bookMetadata, requestId).variables)
        }
      })
      .eq('id', promptId);

    if (updateError) {
      log('ERROR', ProcessStatus.ERROR, 'UPDATE_RECORD', `Failed to update style guide: ${updateError.message}`, { requestId });
    }

    // Update book metadata
    const { error: bookUpdateError } = await supabase
      .from('books')
      .update({
        current_system_prompt_id: promptId,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookId);

    if (bookUpdateError) {
      log('ERROR', ProcessStatus.WARNING, 'UPDATE_BOOK', `Failed to update book metadata: ${bookUpdateError.message}`, { requestId });
    }

    const totalDuration = Date.now() - startTime;
    log('INFO', ProcessStatus.COMPLETE, 'SUCCESS', 'Style guide generation completed', { 
      requestId, 
      totalDuration,
      styleGuideLength: styleGuide.length
    });

    return new Response(JSON.stringify({
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
    const errorMsg = `Unexpected error: ${error.message}`;
    log('ERROR', ProcessStatus.ERROR, 'UNEXPECTED', errorMsg, { requestId, error: error.stack });
    
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});