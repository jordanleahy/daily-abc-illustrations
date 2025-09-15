/**
 * Generate Style Guide Edge Function
 * 
 * This Supabase Edge Function generates a visual style guide for ABC books using OpenAI.
 * It fetches the user's Illustration Director Agent configuration and creates a comprehensive
 * style guide that is then used to update the Graphics Design Agent's instructions.
 * 
 * @function generateStyleGuide
 * 
 * @description
 * The function supports both streaming and non-streaming modes:
 * - Streaming mode: Returns Server-Sent Events (SSE) with real-time progress updates
 * - Non-streaming mode: Returns a standard JSON response with the final result
 * 
 * @param {Object} requestBody - The request payload
 * @param {string} requestBody.bookId - UUID of the book to generate style guide for
 * @param {string} requestBody.userId - UUID of the user creating the style guide
 * @param {Object} requestBody.bookMetadata - Book information
 * @param {string} requestBody.bookMetadata.book_name - Name of the book
 * @param {string} [requestBody.bookMetadata.category] - Book category (optional)
 * @param {string} [requestBody.bookMetadata.book_description] - Book description (optional)
 * 
 * @param {URLSearchParams} queryParams - URL query parameters
 * @param {boolean} [queryParams.stream=false] - Whether to use streaming mode
 * 
 * @returns {Response} 
 * - Streaming mode: Server-Sent Events stream with progress updates
 * - Non-streaming mode: JSON response with style guide and agent info
 * 
 * @example
 * // Non-streaming request
 * POST /functions/v1/generate-style-guide
 * {
 *   "bookId": "123e4567-e89b-12d3-a456-426614174000",
 *   "userId": "456e7890-e89b-12d3-a456-426614174000", 
 *   "bookMetadata": {
 *     "book_name": "My ABC Book",
 *     "category": "Educational",
 *     "book_description": "A fun learning book for children"
 *   }
 * }
 * 
 * @example
 * // Streaming request
 * POST /functions/v1/generate-style-guide?stream=true
 * // Returns SSE stream with events like:
 * // data: {"step":"Agent Configuration","message":"Found agent: Illustration Director (gpt-4o)","status":"complete","progress":35}
 * // data: {"step":"Style Guide Generation","message":"Style guide generated successfully!","status":"complete","styleGuide":"..."}
 * 
 * @workflow
 * 1. Parse and validate request parameters
 * 2. Fetch user's Illustration Director Agent configuration from database
 * 3. Prepare style guide prompt using book metadata
 * 4. Call OpenAI API using agent's model settings and instructions
 * 5. Update Graphics Design Agent's instructions with generated style guide
 * 6. Update book metadata in database
 * 7. Return result (streaming events or JSON response)
 * 
 * @dependencies
 * - OpenAI API (requires OPENAI_API_KEY environment variable)
 * - Supabase database (agents and books tables)
 * - User must have an active Illustration Director Agent configuration
 * 
 * @errors
 * - 400: Missing required parameters (bookId, userId, bookMetadata)
 * - 404: No Illustration Director Agent found for user
 * - 500: OpenAI API errors, database errors, or other server errors
 * 
 * @author Lovable AI Assistant
 * @version 1.0.0
 * @since 2024-01-01
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { ProcessStatus, corsHeaders, log, generateRequestId } from '../_shared/types.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const requestId = generateRequestId();
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
      let promptId: string | undefined = undefined;
      
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

        // Send initialization event
        currentStep = 'INITIALIZATION';
        const initTimestamp = log('INFO', ProcessStatus.NOT_STARTED, currentStep, 'Initializing style guide generation process', { requestId });
        sendEvent({ 
          step: 'Style Guide Generation', 
          message: 'Initializing style guide generation process', 
          timestamp: initTimestamp, 
          status: ProcessStatus.NOT_STARTED,
          progress: 0,
          totalSteps: 4
        });

        // Create initial prompt record with in-progress status
        currentStep = 'CREATE_RECORD';
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
            status: ProcessStatus.IN_PROGRESS,
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
          log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { requestId, error: createError });
          sendEvent({ step: 'error', message: errorMsg, timestamp: new Date().toISOString(), status: ProcessStatus.ERROR });
          return;
        }

        promptId = newPrompt.id;
        log('INFO', ProcessStatus.COMPLETE, currentStep, 'Created style guide record', { requestId, promptId: promptId?.substring(0, 8) + '...' });

        log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Starting style guide generation process (Step 1 of 4)', { requestId });
        sendEvent({ 
          step: 'Style Guide Generation', 
          message: 'Starting style guide generation process (Step 1 of 4)', 
          timestamp: new Date().toISOString(), 
          status: ProcessStatus.IN_PROGRESS,
          progress: 10,
          totalSteps: 4
        });

        currentStep = 'FETCH_CONFIG';
        const configStartTime = Date.now();
        log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Fetching Illustration Director Agent configuration (Step 2 of 4)...', { requestId });
        sendEvent({ 
          step: 'Agent Configuration', 
          message: 'Fetching Illustration Director Agent configuration (Step 2 of 4)...', 
          timestamp: new Date().toISOString(), 
          status: ProcessStatus.IN_PROGRESS,
          progress: 25,
          totalSteps: 4
        });

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
        sendEvent({ 
          step: 'Agent Configuration', 
          message: `Found agent: ${agentConfig.name} (${agentConfig.model})`, 
          timestamp: new Date().toISOString(), 
          status: ProcessStatus.COMPLETE,
          progress: 35,
          totalSteps: 4
        });

        currentStep = 'PREPARE_PROMPT';
        const promptStartTime = Date.now();
        log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Preparing style guide prompt (Step 3 of 4)...', { requestId });
        sendEvent({ 
          step: 'Prompt Preparation', 
          message: 'Preparing style guide prompt (Step 3 of 4)...', 
          timestamp: new Date().toISOString(), 
          status: ProcessStatus.IN_PROGRESS,
          progress: 45,
          totalSteps: 4
        });

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
        sendEvent({ 
          step: 'Prompt Preparation', 
          message: `Prompt prepared (${styleGuidePrompt.length} characters)`, 
          timestamp: new Date().toISOString(), 
          status: ProcessStatus.COMPLETE,
          progress: 55,
          totalSteps: 4
        });

        currentStep = 'OPENAI_API';
        const aiStartTime = Date.now();
        log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Calling OpenAI API to generate style guide (Step 4 of 4)...', { 
          requestId,
          model: agentConfig.model,
          maxTokens: agentConfig.max_completion_tokens,
          topP: agentConfig.top_p
        });
        sendEvent({ 
          step: 'AI Generation', 
          message: `Generating style guide with ${agentConfig.model} (Step 4 of 4)...`, 
          timestamp: new Date().toISOString(), 
          status: ProcessStatus.IN_PROGRESS,
          progress: 65,
          totalSteps: 4
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
        sendEvent({ 
          step: 'AI Generation', 
          message: `Style guide generated successfully (${styleGuide.length} characters, ${data.usage?.total_tokens || 'N/A'} tokens)`, 
          timestamp: new Date().toISOString(), 
          status: ProcessStatus.COMPLETE,
          progress: 85,
          totalSteps: 4
        });

        currentStep = 'SAVE_METADATA';
        const saveStartTime = Date.now();
        log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Updating book metadata...', { requestId });
        sendEvent({ 
          step: 'Save Metadata', 
          message: 'Saving book metadata...', 
          timestamp: new Date().toISOString(), 
          status: ProcessStatus.IN_PROGRESS,
          progress: 90,
          totalSteps: 4
        });

        // Update the existing prompt record with completion
        const { data: promptData, error: saveError } = await supabase
          .from('book_system_prompts')
          .update({
            content: `You are a creative director and graphic designer specializing in children's ABC books. Your role is to create beautiful, engaging illustrations that help children learn letters and words.

Style Guide for "${bookMetadata.book_name}":
${styleGuide}

Use this style guide consistently across all illustrations for this book. Each illustration should be educational, age-appropriate, and aligned with the visual style described above.`,
            status: ProcessStatus.COMPLETE,
            is_deployed: true,
            generation_metadata: {
              model: agentConfig.model,
              agent_name: agentConfig.name,
              agent_version: agentConfig.version,
              prompt_length: styleGuidePrompt.length,
              style_guide_length: styleGuide.length,
              generation_duration_ms: aiDuration,
              tokens_used: data.usage?.total_tokens || null,
              completion_tokens: data.usage?.completion_tokens || null,
              prompt_tokens: data.usage?.prompt_tokens || null,
              completed_at: new Date().toISOString(),
              request_id: requestId
            }
          })
          .eq('id', promptId)
          .select()
          .single();

        if (saveError) {
          throw new Error(`Failed to save style guide: ${saveError.message}`);
        }

        log('INFO', ProcessStatus.COMPLETE, 'save-style-guide', `Style guide updated for book ${bookId}`);

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
          sendEvent({ 
            step: 'Save Metadata', 
            message: 'Warning: Failed to update book metadata but style guide was generated', 
            timestamp: new Date().toISOString(), 
            status: ProcessStatus.WARNING,
            progress: 95,
            totalSteps: 4
          });
        } else {
          log('INFO', ProcessStatus.COMPLETE, currentStep, 'Book metadata updated successfully', { 
            requestId, 
            duration: saveDuration
          });
          sendEvent({ 
            step: 'Save Metadata', 
            message: 'Book metadata saved successfully', 
            timestamp: new Date().toISOString(), 
            status: ProcessStatus.COMPLETE,
            progress: 95,
            totalSteps: 4
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

        sendEvent({ 
          step: 'Style Guide Generation', 
          message: `Style guide generated successfully! (${(totalDuration / 1000).toFixed(1)}s total)`, 
          timestamp: new Date().toISOString(),
          status: ProcessStatus.COMPLETE,
          progress: 100,
          totalSteps: 4,
          styleGuide: styleGuide,
          systemPrompt: {
            id: promptData.id,
            version_number: promptData.version_number,
            content: promptData.content,
            source_type: promptData.source_type,
            is_deployed: promptData.is_deployed,
            created_at: promptData.created_at
          }
        });

      } catch (error) {
        console.error('Streaming error:', error);
        
        // Update prompt record with error status if we have the promptId
        if (typeof promptId !== 'undefined') {
          try {
            await supabase
              .from('book_system_prompts')
              .update({
                status: ProcessStatus.ERROR,
                generation_metadata: {
                  error_message: error.message,
                  failed_at: new Date().toISOString(),
                  request_id: requestId
                }
              })
              .eq('id', promptId);
          } catch (updateError) {
            console.error('Error updating prompt with error status:', updateError);
          }
        }
        
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
    log('INFO', ProcessStatus.IN_PROGRESS, 'SAVE_METADATA', 'Saving style guide and updating book metadata...', { requestId });

    // Save the style guide to the book_system_prompts table
    const nextVersionResult = await supabase.rpc('get_next_version_number', { 
      p_book_id: bookId 
    });
    
    const nextVersion = nextVersionResult.data || 1;
    
    const { data: promptData, error: promptError } = await supabase
      .from('book_system_prompts')
      .insert({
        book_id: bookId,
        user_id: userId,
        content: `You are a creative director and graphic designer specializing in children's ABC books. Your role is to create beautiful, engaging illustrations that help children learn letters and words.

Style Guide for "${bookMetadata.book_name}":
${styleGuide}

Use this style guide consistently across all illustrations for this book. Each illustration should be educational, age-appropriate, and aligned with the visual style described above.`,
        version_number: nextVersion,
        source_type: 'generated',
        is_latest: true,
        is_deployed: true,
        status: ProcessStatus.COMPLETE,
        generation_metadata: {
          model: agentConfig.model,
          generated_at: new Date().toISOString(),
          book_metadata: {
            name: bookMetadata.book_name,
            description: bookMetadata.book_description,
            category: bookMetadata.category,
            total_pages: bookMetadata.total_pages
          }
        }
      })
      .select()
      .single();

    if (promptError) {
      throw new Error(`Failed to save style guide: ${promptError.message}`);
    }

    log('INFO', ProcessStatus.COMPLETE, 'save-style-guide', `Style guide saved as version ${nextVersion} for book ${bookId}`);

    // Store the generated style guide in the book's metadata
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
      systemPrompt: {
        id: promptData.id,
        version_number: promptData.version_number,
        content: promptData.content,
        source_type: promptData.source_type,
        is_deployed: promptData.is_deployed,
        created_at: promptData.created_at
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