/**
 * Generate Graphics Designer System Prompt Edge Function
 * 
 * This edge function implements a two-stage process:
 * 1. Uses the Illustration Director Agent to generate a JSON style guide
 * 2. Parses the JSON and transforms it into a Graphics Designer system prompt
 * 
 * This ensures consistent, structured visual guidelines across all image prompts.
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

// Shared utilities and types - Common functionality across edge functions
import { ProcessStatus, corsHeaders, log, generateRequestId } from '../_shared/types.ts';

// Style Guide Types - For JSON validation and parsing
interface StyleGuideJSON {
  metadata: {
    category: string;
    theme: string;
    audience: string;
    useCases: string[];
    styleTags: string[];
    status: 'active' | 'draft' | 'archived';
    version: string;
    generatedAt: string;
  };
  colorPalette: {
    primary: { hex: string; hsl: string; usage: string; };
    secondary: { hex: string; hsl: string; usage: string; };
    accent: { hex: string; hsl: string; usage: string; };
    supporting: { hex: string; hsl: string; usage: string; };
    background: { hex: string; hsl: string; usage: string; };
    text: { hex: string; hsl: string; usage: string; };
  };
  visualElements: {
    foregroundElements: { required: string[]; optional: string[]; style: string; };
    midgroundContext: { connectors: string[]; workflows: string[]; contextual: string[]; };
    backgroundFoundation: { setting: string; gradients: string[]; textures: string[]; whitespace: string; };
  };
  styleRequirements: {
    artStyle: string;
    subjects: string[];
    flowIndicators: string[];
    tone: 'gentle' | 'practical' | 'trustworthy' | 'empathetic' | 'playful' | 'educational';
    technicalSpecs: { aspectRatio: string; resolution: string; format: string; };
  };
  compositionGuidelines: {
    layoutFlow: 'triangular' | 'left-to-right' | 'modular-cards' | 'centered' | 'grid';
    focusHierarchy: string[];
    spacingRules: string;
    balanceStrategy: string;
  };
  visualMetaphors: {
    metaphor1: { concept: string; visualRepresentation: string; implementation: string; };
    metaphor2: { concept: string; visualRepresentation: string; implementation: string; };
    metaphor3: { concept: string; visualRepresentation: string; implementation: string; };
  };
  contentAnalysisFramework: {
    lens1: { name: string; description: string; checkpoints: string[]; };
    lens2: { name: string; description: string; checkpoints: string[]; };
    lens3: { name: string; description: string; checkpoints: string[]; };
  };
  outputInstructions: {
    visualFocus: string[];
    textConstraints: string[];
    educationalApproach: string[];
  };
  safetyGuidelines: {
    prohibited: string[];
    required: string[];
    ageAppropriate: string[];
  };
}

// Validation function
function validateStyleGuide(data: any): data is StyleGuideJSON {
  return (
    data &&
    typeof data === 'object' &&
    data.metadata &&
    data.colorPalette &&
    data.visualElements &&
    data.styleRequirements &&
    data.compositionGuidelines &&
    data.visualMetaphors &&
    data.contentAnalysisFramework &&
    data.outputInstructions &&
    data.safetyGuidelines
  );
}

// JSON-to-Prompt transformer function
function createGraphicsDesignerPrompt(styleGuide: StyleGuideJSON): string {
  const { colorPalette, styleRequirements } = styleGuide;
  
  return `🎨 Graphics Designer AI - Children's ABC Book Illustration Specialist

Create simple JSON responses for educational ABC book illustrations.

## Your Task
Generate a simple JSON structure for each page illustration request:

\`\`\`json
{
  "subject": {
    "primary": "main item/character for the letter",
    "letter": "the target letter (A-Z)"
  },
  "scene": {
    "setting": "where the scene takes place",
    "style": "${styleRequirements.artStyle} style with ${styleRequirements.tone} tone"
  },
  "colors": {
    "primary": "${colorPalette.primary.hex}",
    "background": "${colorPalette.background.hex}"
  },
  "educational": {
    "letterEmphasis": "how to emphasize the letter sound/recognition",
    "ageAppropriate": true
  }
}
\`\`\`

## Style Consistency
- Always use primary color: ${colorPalette.primary.hex}
- Always use background: ${colorPalette.background.hex}
- Style: ${styleRequirements.artStyle}
- Tone: ${styleRequirements.tone}

## Key Rules
1. Keep descriptions simple and child-friendly
2. Focus on the letter being taught
3. Use consistent colors across all pages
4. Ensure age-appropriate content (3-5 years old)
5. Response must be valid JSON only

Your JSON will be transformed into optimized image generation prompts automatically.`;
}

serve(async (req) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  log('INFO', ProcessStatus.IN_PROGRESS, 'REQUEST', `Starting two-stage Graphics Designer prompt generation`, { requestId, method: req.method });

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
      model: agentConfig.model_settings?.model || agentConfig.model,
      version: agentConfig.version
    });

    // ===== STAGE 1: Generate JSON Style Guide using Illustration Director =====
    currentStep = 'STAGE1_PREPARE_PROMPT';
    const stage1StartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Stage 1: Preparing JSON style guide generation prompt...', { requestId });

    const styleGuidePrompt = `Generate a comprehensive JSON style guide for this children's ABC book:

Book Details:
- Name: ${bookData.book_name}
- Category: ${bookData.category || 'General Children\'s Book'}
- Description: ${bookData.book_description || 'An educational ABC book for children'}

Please provide your response as valid JSON following the exact schema structure you are designed to output. This style guide will be used to ensure visual consistency across all illustrations in the book.`;

    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'OpenAI API key not configured', { requestId });
      throw new Error('OpenAI API key not configured');
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Stage 1 prompt prepared', { 
      requestId, 
      duration: Date.now() - stage1StartTime,
      contentLength: styleGuidePrompt.length
    });

    currentStep = 'STAGE1_OPENAI_API';
    const stage1ApiStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Stage 1: Calling OpenAI API for JSON style guide generation...', { 
      requestId,
      model: agentConfig.model_settings?.model || agentConfig.model,
      maxTokens: agentConfig.model_settings?.max_completion_tokens || agentConfig.max_completion_tokens,
      topP: agentConfig.model_settings?.top_p || agentConfig.top_p
    });

    // Call OpenAI API using the Illustration Director agent's configuration
    const stage1Response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agentConfig.model_settings?.model || agentConfig.model,
        max_completion_tokens: agentConfig.model_settings?.max_completion_tokens || agentConfig.max_completion_tokens,
        top_p: parseFloat(agentConfig.model_settings?.top_p || agentConfig.top_p),
        messages: [
          {
            role: 'system',
            content: agentConfig.instructions
          },
          {
            role: 'user',
            content: styleGuidePrompt
          }
        ],
      }),
    });

    const stage1Duration = Date.now() - stage1ApiStartTime;

    if (!stage1Response.ok) {
      const errorData = await stage1Response.json();
      const errorMsg = `Stage 1 OpenAI API error: ${errorData.error?.message || stage1Response.statusText}`;
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        duration: stage1Duration,
        statusCode: stage1Response.status,
        error: errorData
      });
      throw new Error(errorMsg);
    }

    const stage1Data = await stage1Response.json();
    
    // Extract JSON style guide from response
    const choice = stage1Data?.choices?.[0] ?? {};
    const msg = choice.message ?? {};
    let rawStyleGuide = '';

    if (Array.isArray(msg.content)) {
      rawStyleGuide = msg.content
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
      rawStyleGuide = (msg.content as string).trim();
    }

    if (!rawStyleGuide) {
      const errorMsg = 'Stage 1: OpenAI returned empty style guide';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, {
        requestId,
        duration: stage1Duration,
        rawMessage: choice,
        bookName: bookData.book_name
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Stage 1: JSON style guide generated successfully', { 
      requestId, 
      duration: stage1Duration,
      rawLength: rawStyleGuide.length,
      tokensUsed: stage1Data.usage?.total_tokens,
      bookName: bookData.book_name
    });

    // ===== STAGE 2: Parse JSON and Create Graphics Designer Prompt =====
    currentStep = 'STAGE2_PARSE_JSON';
    const stage2StartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Stage 2: Parsing JSON style guide...', { requestId });

    let graphicsDesignerPrompt = '';
    let isJsonValid = false;

    try {
      // Try to parse as JSON
      const parsedStyleGuide = JSON.parse(rawStyleGuide);
      
      if (validateStyleGuide(parsedStyleGuide)) {
        log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Valid JSON style guide detected, creating structured prompt', { requestId });
        graphicsDesignerPrompt = createGraphicsDesignerPrompt(parsedStyleGuide);
        isJsonValid = true;
      } else {
        log('WARN', ProcessStatus.WARNING, currentStep, 'JSON structure validation failed, using fallback approach', { requestId });
        graphicsDesignerPrompt = `🎨 Graphics Designer AI - Children's ABC Book Illustration Specialist

Based on the style guide generated for "${bookData.book_name}" (${bookData.category}):

${rawStyleGuide}

Your mission is to create consistent, beautiful image prompts for each page of this ABC book. Follow the style guidelines above precisely to ensure visual consistency across all illustrations.

CRITICAL: Always reference the specific colors, design elements, and visual metaphors defined in the style guide above when creating image prompts.`;
      }
    } catch (parseError) {
      log('WARN', ProcessStatus.WARNING, currentStep, 'JSON parsing failed, using fallback text-based prompt', { 
        requestId, 
        parseError: parseError instanceof Error ? parseError.message : 'Parse error' 
      });
      
      // Fallback for non-JSON response
      graphicsDesignerPrompt = `🎨 Graphics Designer AI - Children's ABC Book Illustration Specialist

Based on the style guide generated for "${bookData.book_name}" (${bookData.category}):

${rawStyleGuide}

Your mission is to create consistent, beautiful image prompts for each page of this ABC book. Follow the style guidelines above precisely to ensure visual consistency across all illustrations.

CRITICAL: Always reference the specific colors, design elements, and visual metaphors defined in the style guide above when creating image prompts.`;
    }

    const stage2Duration = Date.now() - stage2StartTime;
    
    log('INFO', ProcessStatus.COMPLETE, currentStep, `Stage 2: Graphics Designer prompt created successfully (JSON: ${isJsonValid})`, { 
      requestId, 
      duration: stage2Duration,
      promptLength: graphicsDesignerPrompt.length,
      wasJsonValid: isJsonValid,
      bookName: bookData.book_name
    });

    const totalDuration = Date.now() - startTime;
    log('INFO', ProcessStatus.COMPLETE, 'COMPLETE', 'Two-stage Graphics Designer prompt generation completed successfully!', { 
      requestId,
      totalDuration,
      stage1Duration,
      stage2Duration,
      promptLength: graphicsDesignerPrompt.length,
      jsonValid: isJsonValid,
      bookInfo: {
        name: bookData.book_name,
        category: bookData.category
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        systemPrompt: graphicsDesignerPrompt,
        bookId,
        metadata: {
          jsonStyleGuideGenerated: true,
          jsonValid: isJsonValid,
          stage1Tokens: stage1Data.usage?.total_tokens,
          processingTime: totalDuration
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    log('ERROR', ProcessStatus.ERROR, currentStep || 'UNKNOWN', 'Two-stage Graphics Designer prompt generation failed', { 
      requestId,
      totalDuration,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});