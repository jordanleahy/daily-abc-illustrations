/**
 * Generate Page-Specific Image Prompt Edge Function
 * 
 * This function uses the Graphics Designer Agent to create detailed, page-specific
 * image generation prompts based on the book's style guide and page content.
 * 
 * Workflow:
 * 1. Fetch page details (letter, title, description, content)
 * 2. Fetch book's deployed style guide from book_system_prompts
 * 3. Fetch Graphics Designer Agent configuration for the user
 * 4. Call Lovable AI Gateway with combined context
 * 5. Parse and store JSON response in page_system_prompts
 * 
 * @requires LOVABLE_API_KEY - Lovable AI Gateway API key
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders, log, generateRequestId } from '../_shared/types.ts';

// Response types
interface SuccessResponse {
  success: true;
  pagePromptId: string;
  pageId: string;
  content: string;
  versionNumber: number;
  message: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    log('info', 'in-progress', 'REQUEST', 'Starting page prompt generation', { requestId, method: req.method });

    // Parse request body
    const { pageId, userId, bookId } = await req.json();

    if (!pageId || !userId || !bookId) {
      log('error', 'complete', 'VALIDATION', 'Missing required parameters', { requestId, pageId, userId, bookId });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: pageId, userId, and bookId are required' 
        } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('info', 'complete', 'PARSE_REQUEST', 'Request parsed successfully', { 
      requestId, 
      pageId: pageId.substring(0, 8) + '...', 
      userId: userId.substring(0, 8) + '...',
      bookId: bookId.substring(0, 8) + '...'
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch page details
    log('info', 'in-progress', 'FETCH_PAGE', 'Fetching page details from database', { requestId });
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .eq('book_id', bookId)
      .single();

    if (pageError || !page) {
      log('error', 'complete', 'FETCH_PAGE', 'Page not found or access denied', { requestId, error: pageError });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Page not found or access denied',
          details: pageError?.message 
        } as ErrorResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('info', 'complete', 'FETCH_PAGE', 'Page details fetched successfully', { 
      requestId, 
      letter: page.letter, 
      title: page.title?.substring(0, 20) + '...' 
    });

    // Fetch book's deployed style guide
    log('info', 'in-progress', 'FETCH_STYLE_GUIDE', 'Fetching book style guide', { requestId });
    const { data: styleGuide, error: styleGuideError } = await supabase
      .from('book_system_prompts')
      .select('*')
      .eq('book_id', bookId)
      .eq('is_deployed', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (styleGuideError || !styleGuide) {
      log('error', 'complete', 'FETCH_STYLE_GUIDE', 'No deployed style guide found', { requestId, error: styleGuideError });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No deployed style guide found for this book. Generate a style guide first.',
          details: styleGuideError?.message 
        } as ErrorResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('info', 'complete', 'FETCH_STYLE_GUIDE', 'Style guide fetched successfully', { 
      requestId, 
      versionNumber: styleGuide.version_number 
    });

    // Fetch Graphics Designer Agent configuration
    log('info', 'in-progress', 'FETCH_AGENT', 'Fetching Graphics Designer Agent configuration', { requestId });
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'graphic-designer')
      .eq('is_latest', true)
      .single();

    if (agentError || !agent) {
      log('error', 'complete', 'FETCH_AGENT', 'Graphics Designer Agent not found', { requestId, error: agentError });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Graphics Designer Agent not configured for this user',
          details: agentError?.message 
        } as ErrorResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('info', 'complete', 'FETCH_AGENT', 'Agent configuration fetched successfully', { 
      requestId, 
      agentName: agent.name,
      model: agent.model 
    });

    // Prepare user prompt with style guide and page details
    const userPrompt = `Book Style Guide (follow this for visual consistency):
${styleGuide.content}

Generate a detailed, structured image prompt for this specific page:

Letter: ${page.letter}
Title: ${page.title}
Description: ${page.description || 'No description provided'}
Content: ${JSON.stringify(page.content, null, 2)}

Create a comprehensive JSON prompt that:
1. References colors, art style, and character designs from the style guide
2. Describes the specific scene for this page
3. Specifies composition, layout, and visual hierarchy
4. Ensures this page will be visually consistent with other pages in the book

Return your response as a JSON object with this structure:
{
  "subject": {
    "primary": "main subject/character",
    "characterDetails": "detailed description referencing style guide"
  },
  "scene": {
    "setting": "specific environment for this page",
    "description": "detailed scene description",
    "style": "art style from style guide"
  },
  "colors": {
    "primary": "main color (from style guide palette)",
    "secondary": "secondary color",
    "background": "background color",
    "accent": "accent colors"
  },
  "composition": {
    "layout": "composition structure",
    "focusPoint": "where viewer's eye should go",
    "characterPosition": "where character should be placed"
  },
  "technicalSpecs": {
    "aspectRatio": "aspect ratio",
    "resolution": "recommended resolution"
  }
}`;

    // Call Lovable AI Gateway with Graphics Designer Agent
    log('info', 'in-progress', 'CALL_AI', 'Calling Lovable AI Gateway', { 
      requestId, 
      model: agent.model,
      provider: agent.provider 
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiStartTime = Date.now();
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agent.model,
        messages: [
          {
            role: 'system',
            content: agent.instructions
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_completion_tokens: agent.max_completion_tokens || 4000,
        top_p: agent.top_p || 1.0
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      log('error', 'complete', 'CALL_AI', 'AI Gateway request failed', { 
        requestId, 
        status: aiResponse.status, 
        error: errorText 
      });

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Rate limit exceeded. Please try again later.' 
          } as ErrorResponse),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Payment required. Please add credits to your Lovable AI workspace.' 
          } as ErrorResponse),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiDuration = Date.now() - aiStartTime;
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error('No content returned from AI Gateway');
    }

    log('info', 'complete', 'CALL_AI', 'AI response received', { 
      requestId, 
      duration: aiDuration,
      contentLength: rawContent.length 
    });

    // Parse JSON from response (handle markdown code blocks)
    log('info', 'in-progress', 'PARSE_JSON', 'Parsing JSON from AI response', { requestId });
    let pagePromptContent = rawContent.trim();
    
    // Try to extract JSON from markdown code blocks
    const jsonBlockMatch = pagePromptContent.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      pagePromptContent = jsonBlockMatch[1].trim();
    } else {
      // Try to extract from any code block
      const codeBlockMatch = pagePromptContent.match(/```\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        pagePromptContent = codeBlockMatch[1].trim();
      }
    }

    // Validate JSON
    let parsedJson;
    try {
      parsedJson = JSON.parse(pagePromptContent);
      log('info', 'complete', 'PARSE_JSON', 'JSON parsed successfully', { 
        requestId, 
        keys: Object.keys(parsedJson) 
      });
    } catch (parseError) {
      log('error', 'complete', 'PARSE_JSON', 'Failed to parse JSON, storing raw content', { 
        requestId, 
        error: parseError.message 
      });
      // Store raw content if JSON parsing fails
      parsedJson = null;
    }

    // Get next version number for this page
    log('info', 'in-progress', 'GET_VERSION', 'Getting next version number', { requestId });
    const { data: versionData, error: versionError } = await supabase
      .rpc('get_next_page_prompt_version_number', { p_page_id: pageId });

    if (versionError) {
      throw new Error(`Failed to get version number: ${versionError.message}`);
    }

    const nextVersion = versionData || 1;
    log('info', 'complete', 'GET_VERSION', 'Version number determined', { 
      requestId, 
      versionNumber: nextVersion 
    });

    // Store in page_system_prompts table
    log('info', 'in-progress', 'SAVE_PROMPT', 'Saving page prompt to database', { requestId });
    const { data: savedPrompt, error: saveError } = await supabase
      .from('page_system_prompts')
      .insert({
        page_id: pageId,
        book_id: bookId,
        user_id: userId,
        content: pagePromptContent, // Store as string (JSON or raw text)
        version_number: nextVersion,
        is_latest: true,
        is_deployed: true,
        deployed_at: new Date().toISOString(),
        source_type: 'ai_generated',
        generation_metadata: {
          agentId: agent.id,
          agentName: agent.name,
          model: agent.model,
          provider: agent.provider,
          tokensUsed: aiData.usage?.total_tokens || 0,
          styleGuideVersion: styleGuide.version_number,
          generatedAt: new Date().toISOString(),
          parseSuccess: !!parsedJson
        },
        prompt_status: parsedJson ? 'complete' : 'error'
      })
      .select()
      .single();

    if (saveError) {
      log('error', 'complete', 'SAVE_PROMPT', 'Failed to save page prompt', { 
        requestId, 
        error: saveError 
      });
      throw new Error(`Failed to save page prompt: ${saveError.message}`);
    }

    const totalDuration = Date.now() - startTime;
    log('info', 'complete', 'COMPLETE', 'Page prompt generation completed successfully!', { 
      requestId, 
      totalDuration,
      pagePromptId: savedPrompt.id,
      versionNumber: nextVersion,
      pageInfo: {
        letter: page.letter,
        title: page.title
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        pagePromptId: savedPrompt.id,
        pageId: pageId,
        content: pagePromptContent,
        versionNumber: nextVersion,
        message: `Page-specific prompt generated successfully for ${page.letter}: ${page.title}`
      } as SuccessResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    log('error', 'complete', 'ERROR', 'Page prompt generation failed', { 
      requestId, 
      totalDuration,
      error: error.message 
    });

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to generate page prompt',
        details: error.message 
      } as ErrorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
