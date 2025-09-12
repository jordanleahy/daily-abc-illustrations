import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

enum ProcessStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress', 
  COMPLETE = 'complete',
  ERROR = 'error',
  WARNING = 'warning',
  SKIPPED = 'skipped'
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  
  log('INFO', ProcessStatus.IN_PROGRESS, 'REQUEST', `Starting request processing`, { requestId, method: req.method });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    log('INFO', ProcessStatus.COMPLETE, 'CORS', 'Handling CORS preflight request', { requestId });
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const stream = url.searchParams.get('stream') === 'true';
  
  log('INFO', ProcessStatus.IN_PROGRESS, 'CONFIG', `Request mode: ${stream ? 'streaming' : 'non-streaming'}`, { requestId, stream });

  if (stream) {
    log('INFO', ProcessStatus.IN_PROGRESS, 'STREAM', 'Initializing Server-Sent Events stream', { requestId });
    
    // Return Server-Sent Events stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    
    const sendEvent = (data: any) => {
      const eventData = `data: ${JSON.stringify(data)}\n\n`;
      writer.write(new TextEncoder().encode(eventData));
      // Also log to console for debugging
      log('INFO', data.status || ProcessStatus.IN_PROGRESS, 'STREAM_EVENT', data.message, { 
        requestId, 
        step: data.step, 
        status: data.status,
        extra: data.styleGuide ? { styleGuideLength: data.styleGuide.length } : data.agentUsed || null
      });
    };

    // Process streaming in the background
    (async () => {
      const stepStartTime = Date.now();
      let currentStep = 'INIT';
      
      try {
        currentStep = 'PARSE_REQUEST';
        const parseStartTime = Date.now();
        const { bookId, userId, bookMetadata } = await req.json();
        log('INFO', ProcessStatus.COMPLETE, currentStep, `Request parsed successfully`, { 
          requestId, 
          duration: Date.now() - parseStartTime,
          bookId: bookId?.substring(0, 8) + '...',
          userId: userId?.substring(0, 8) + '...'
        });

        if (!bookId || !userId || !bookMetadata) {
          const errorMsg = 'Missing required parameters: bookId, userId, or bookMetadata';
          log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { requestId, receivedParams: { bookId: !!bookId, userId: !!userId, bookMetadata: !!bookMetadata } });
          sendEvent({ step: 'error', message: errorMsg, timestamp: new Date().toISOString(), status: ProcessStatus.ERROR });
          return;
        }

        currentStep = 'INIT';
        const initTimestamp = log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Starting style guide generation...', { requestId });
        sendEvent({ step: 'init', message: 'Starting style guide generation...', timestamp: initTimestamp, status: ProcessStatus.IN_PROGRESS });

        currentStep = 'FETCH_CONFIG';
        const configStartTime = Date.now();
        log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Fetching Illustration Director Agent configuration...', { requestId });
        sendEvent({ step: 'config', message: 'Fetching Illustration Director Agent configuration...', timestamp: new Date().toISOString(), status: ProcessStatus.IN_PROGRESS });

        // Fetch user's Illustration Director Agent configuration
        const { data: agentConfig, error: agentError } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'illustration-director')
          .eq('is_latest', true)
          .single();

        const configDuration = Date.now() - configStartTime;
        
        if (agentError || !agentConfig) {
          const errorMsg = 'No Illustration Director Agent configuration found';
          log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
            requestId, 
            duration: configDuration,
            error: agentError?.message,
            userId: userId?.substring(0, 8) + '...'
          });
          sendEvent({ step: 'error', message: errorMsg, timestamp: new Date().toISOString(), status: ProcessStatus.ERROR });
          return;
        }

        log('INFO', ProcessStatus.COMPLETE, currentStep, `Found agent config: ${agentConfig.name}`, { 
          requestId, 
          duration: configDuration,
          agentId: agentConfig.id?.substring(0, 8) + '...',
          model: agentConfig.model,
          version: agentConfig.version
        });
        sendEvent({ step: 'config', message: `Found agent config: ${agentConfig.name}`, timestamp: new Date().toISOString(), status: ProcessStatus.COMPLETE });

        currentStep = 'PREPARE_PROMPT';
        const promptStartTime = Date.now();
        log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Preparing style guide prompt...', { requestId });
        sendEvent({ step: 'prompt', message: 'Preparing style guide prompt...', timestamp: new Date().toISOString(), status: ProcessStatus.IN_PROGRESS });

        // Prepare the prompt for OpenAI - Let the agent use its specialized instructions
        const styleGuidePrompt = `Please create your visual style guide for this ABC book:

Book Information:
- Name: ${bookMetadata.book_name}
- Category: ${bookMetadata.category || 'General'}
- Description: ${bookMetadata.book_description || 'ABC learning book'}`;

        const promptDuration = Date.now() - promptStartTime;
        log('INFO', ProcessStatus.COMPLETE, currentStep, 'Style guide prompt prepared', { 
          requestId, 
          duration: promptDuration,
          promptLength: styleGuidePrompt.length,
          bookName: bookMetadata.book_name?.substring(0, 20) + '...'
        });

        currentStep = 'OPENAI_API';
        const aiStartTime = Date.now();
        log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Calling OpenAI API to generate style guide...', { 
          requestId,
          model: agentConfig.model,
          maxTokens: agentConfig.max_completion_tokens,
          topP: agentConfig.top_p
        });
        sendEvent({ step: 'ai', message: 'Calling OpenAI API to generate style guide...', timestamp: new Date().toISOString(), status: ProcessStatus.IN_PROGRESS });

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
              { role: 'system', content: agentConfig.instructions },
              { role: 'user', content: styleGuidePrompt }
            ],
            max_completion_tokens: agentConfig.max_completion_tokens,
            top_p: parseFloat(agentConfig.top_p),
          }),
        });

        if (!response.ok) {
          const aiDuration = Date.now() - aiStartTime;
          const errorData = await response.json();
          const errorMsg = `OpenAI API error: ${errorData.error?.message}`;
          log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
            requestId, 
            duration: aiDuration,
            statusCode: response.status,
            error: errorData,
            model: agentConfig.model
          });
          sendEvent({ step: 'error', message: errorMsg, timestamp: new Date().toISOString(), status: ProcessStatus.ERROR });
          return;
        }

        const data = await response.json();
        const styleGuide = data.choices[0].message.content;
        const aiDuration = Date.now() - aiStartTime;

        log('INFO', ProcessStatus.COMPLETE, currentStep, `Generated style guide successfully`, { 
          requestId, 
          duration: aiDuration,
          styleGuideLength: styleGuide.length,
          tokensUsed: data.usage?.total_tokens,
          model: agentConfig.model
        });
        sendEvent({ step: 'ai', message: `Generated style guide (${styleGuide.length} characters)`, timestamp: new Date().toISOString(), status: ProcessStatus.COMPLETE });

        currentStep = 'SAVE_METADATA';
        const saveStartTime = Date.now();
        log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Updating book metadata...', { requestId });
        sendEvent({ step: 'save', message: 'Updating book metadata...', timestamp: new Date().toISOString(), status: ProcessStatus.IN_PROGRESS });

        // Store the generated style guide in the book's metadata or pages
        const { error: updateError } = await supabase
          .from('books')
          .update({ 
            book_description: bookMetadata.book_description,
            category: bookMetadata.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', bookId);

        const saveDuration = Date.now() - saveStartTime;
        
        if (updateError) {
          log('WARN', ProcessStatus.WARNING, currentStep, 'Failed to update book metadata', { 
            requestId, 
            duration: saveDuration,
            error: updateError.message,
            bookId: bookId?.substring(0, 8) + '...'
          });
          sendEvent({ step: 'warning', message: 'Failed to update book metadata', timestamp: new Date().toISOString(), status: ProcessStatus.WARNING });
        } else {
          log('INFO', ProcessStatus.COMPLETE, currentStep, 'Book metadata updated successfully', { 
            requestId, 
            duration: saveDuration
          });
          sendEvent({ step: 'save', message: 'Book metadata updated successfully', timestamp: new Date().toISOString(), status: ProcessStatus.COMPLETE });
        }

        const totalDuration = Date.now() - startTime;
        log('INFO', ProcessStatus.COMPLETE, 'COMPLETE', 'Style guide generated successfully!', { 
          requestId,
          totalDuration,
          styleGuideLength: styleGuide.length,
          agentUsed: {
            name: agentConfig.name,
            model: agentConfig.model,
            version: agentConfig.version
          }
        });

        sendEvent({ 
          step: 'complete', 
          message: 'Style guide generated successfully!', 
          timestamp: new Date().toISOString(),
          status: ProcessStatus.COMPLETE,
          styleGuide: styleGuide,
          agentUsed: {
            name: agentConfig.name,
            model: agentConfig.model,
            version: agentConfig.version
          }
        });

      } catch (error) {
        const totalDuration = Date.now() - startTime;
        log('ERROR', ProcessStatus.ERROR, currentStep || 'UNKNOWN', 'Streaming process failed', { 
          requestId,
          totalDuration,
          error: error.message,
          stack: error.stack
        });
        sendEvent({ step: 'error', message: error.message, timestamp: new Date().toISOString(), status: ProcessStatus.ERROR });
      } finally {
        writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  // Original non-streaming implementation as fallback
  try {
    log('INFO', ProcessStatus.IN_PROGRESS, 'NON_STREAM_START', 'Starting non-streaming mode processing', { requestId });
    
    const parseStartTime = Date.now();
    const { bookId, userId, bookMetadata } = await req.json();

    if (!bookId || !userId || !bookMetadata) {
      const errorMsg = 'Missing required parameters: bookId, userId, or bookMetadata';
      log('ERROR', ProcessStatus.ERROR, 'PARSE_REQUEST', errorMsg, { 
        requestId, 
        receivedParams: { bookId: !!bookId, userId: !!userId, bookMetadata: !!bookMetadata } 
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, 'PARSE_REQUEST', 'Request parsed successfully', { 
      requestId, 
      duration: Date.now() - parseStartTime,
      bookId: bookId?.substring(0, 8) + '...',
      userId: userId?.substring(0, 8) + '...'
    });

    const configStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, 'FETCH_CONFIG', 'Fetching Illustration Director Agent configuration...', { requestId });

    // Fetch user's Illustration Director Agent configuration
    const { data: agentConfig, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'illustration-director')
      .eq('is_latest', true)
      .single();

    const configDuration = Date.now() - configStartTime;

    if (agentError || !agentConfig) {
      const errorMsg = 'No Illustration Director Agent configuration found for user';
      log('ERROR', ProcessStatus.ERROR, 'FETCH_CONFIG', errorMsg, { 
        requestId, 
        duration: configDuration,
        error: agentError?.message,
        userId: userId?.substring(0, 8) + '...'
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, 'FETCH_CONFIG', `Found agent config: ${agentConfig.name}`, { 
      requestId, 
      duration: configDuration,
      agentId: agentConfig.id?.substring(0, 8) + '...',
      model: agentConfig.model,
      version: agentConfig.version
    });

    const promptStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, 'PREPARE_PROMPT', 'Preparing style guide prompt...', { requestId });

    // Prepare the prompt for OpenAI - Let the agent use its specialized instructions
    const styleGuidePrompt = `Please create your visual style guide for this ABC book:

Book Information:
- Name: ${bookMetadata.book_name}
- Category: ${bookMetadata.category || 'General'}
- Description: ${bookMetadata.book_description || 'ABC learning book'}`;

    const promptDuration = Date.now() - promptStartTime;
    log('INFO', ProcessStatus.COMPLETE, 'PREPARE_PROMPT', 'Style guide prompt prepared', { 
      requestId, 
      duration: promptDuration,
      promptLength: styleGuidePrompt.length,
      bookName: bookMetadata.book_name?.substring(0, 20) + '...'
    });

    const aiStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, 'OPENAI_API', 'Calling OpenAI API to generate style guide...', { 
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
          { role: 'system', content: agentConfig.instructions },
          { role: 'user', content: styleGuidePrompt }
        ],
        max_completion_tokens: agentConfig.max_completion_tokens,
        top_p: parseFloat(agentConfig.top_p),
      }),
    });

    const aiDuration = Date.now() - aiStartTime;

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`;
      log('ERROR', ProcessStatus.ERROR, 'OPENAI_API', errorMsg, { 
        requestId, 
        duration: aiDuration,
        statusCode: response.status,
        error: errorData,
        model: agentConfig.model
      });
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const styleGuide = data.choices[0].message.content;

    log('INFO', ProcessStatus.COMPLETE, 'OPENAI_API', 'Generated style guide successfully', { 
      requestId, 
      duration: aiDuration,
      styleGuideLength: styleGuide.length,
      tokensUsed: data.usage?.total_tokens,
      model: agentConfig.model
    });

    const saveStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, 'SAVE_METADATA', 'Updating book metadata...', { requestId });

    // Store the generated style guide in the book's metadata or pages
    const { error: updateError } = await supabase
      .from('books')
      .update({ 
        book_description: bookMetadata.book_description,
        category: bookMetadata.category,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookId);

    const saveDuration = Date.now() - saveStartTime;

    if (updateError) {
      log('WARN', ProcessStatus.WARNING, 'SAVE_METADATA', 'Failed to update book metadata', { 
        requestId, 
        duration: saveDuration,
        error: updateError.message,
        bookId: bookId?.substring(0, 8) + '...'
      });
    } else {
      log('INFO', ProcessStatus.COMPLETE, 'SAVE_METADATA', 'Book metadata updated successfully', { 
        requestId, 
        duration: saveDuration
      });
    }

    const totalDuration = Date.now() - startTime;
    log('INFO', ProcessStatus.COMPLETE, 'COMPLETE', 'Style guide generated successfully!', { 
      requestId,
      totalDuration,
      styleGuideLength: styleGuide.length,
      agentUsed: {
        name: agentConfig.name,
        model: agentConfig.model,
        version: agentConfig.version
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      styleGuide: styleGuide,
      agentUsed: {
        name: agentConfig.name,
        model: agentConfig.model,
        version: agentConfig.version
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    log('ERROR', ProcessStatus.ERROR, 'COMPLETE', 'Non-streaming process failed', { 
      requestId,
      totalDuration,
      error: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});