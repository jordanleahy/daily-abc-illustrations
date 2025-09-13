import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { ProcessStatus, corsHeaders, log, generateRequestId } from '../_shared/types.ts';

serve(async (req) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  log('INFO', ProcessStatus.IN_PROGRESS, 'REQUEST', `Starting image generation`, { requestId, method: req.method });

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

    const { prompt, pageId, userId, size = "1024x1024", quality = "high" } = await req.json();

    if (!prompt || !pageId || !userId) {
      const errorMsg = 'Missing required parameters: prompt, pageId, or userId';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        receivedParams: { prompt: !!prompt, pageId: !!pageId, userId: !!userId } 
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Request parsed successfully', { 
      requestId, 
      duration: Date.now() - parseStartTime,
      pageId: pageId?.substring(0, 8) + '...',
      userId: userId?.substring(0, 8) + '...',
      promptLength: prompt?.length,
      size,
      quality
    });

    currentStep = 'VERIFY_PAGE_ACCESS';
    const verifyStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Verifying page access...', { requestId });

    // Verify user has access to this page
    const { data: pageData, error: pageError } = await supabaseClient
      .from('pages')
      .select(`
        id,
        book_id,
        books!inner(user_id)
      `)
      .eq('id', pageId)
      .single();

    const verifyDuration = Date.now() - verifyStartTime;

    if (pageError) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'Failed to verify page access', { 
        requestId, 
        duration: verifyDuration,
        error: pageError.message,
        pageId: pageId?.substring(0, 8) + '...'
      });
      throw new Error(`Failed to verify page access: ${pageError.message}`);
    }

    if (!pageData || pageData.books.user_id !== userId) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'Page not found or access denied', { 
        requestId, 
        duration: verifyDuration,
        pageExists: !!pageData,
        userIdMatch: pageData?.books?.user_id === userId
      });
      throw new Error('Page not found or access denied');
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Page access verified successfully', { 
      requestId, 
      duration: verifyDuration,
      bookId: pageData.book_id?.substring(0, 8) + '...'
    });

    currentStep = 'OPENAI_IMAGE_API';
    const imageStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Calling OpenAI Image API...', { 
      requestId,
      model: 'gpt-image-1',
      size,
      quality,
      promptLength: prompt.length
    });

    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'OpenAI API key not configured', { requestId });
      throw new Error('OpenAI API key not configured');
    }

    // Call OpenAI Image Generation API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: size,
        quality: quality,
        output_format: 'png'
      }),
    });

    const imageDuration = Date.now() - imageStartTime;

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = `OpenAI Image API error: ${errorData.error?.message || response.statusText}`;
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        duration: imageDuration,
        statusCode: response.status,
        error: errorData
      });
      throw new Error(errorMsg);
    }

    const imageData = await response.json();
    
    // gpt-image-1 returns base64 encoded images
    const generatedImage = imageData.data[0];
    
    if (!generatedImage || !generatedImage.b64_json) {
      const errorMsg = 'No image data returned from OpenAI';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        duration: imageDuration,
        responseData: imageData
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Image generated successfully', { 
      requestId, 
      duration: imageDuration,
      imageSize: generatedImage.b64_json.length,
      revised_prompt: generatedImage.revised_prompt ? 'Revised prompt provided' : 'No revision'
    });

    const totalDuration = Date.now() - startTime;
    log('INFO', ProcessStatus.COMPLETE, 'COMPLETE', 'Image generation completed successfully!', { 
      requestId,
      totalDuration,
      imageGenerated: true,
      pageId: pageId?.substring(0, 8) + '...'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        image: generatedImage.b64_json,
        revised_prompt: generatedImage.revised_prompt || null,
        pageId 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    log('ERROR', ProcessStatus.ERROR, currentStep || 'UNKNOWN', 'Image generation failed', { 
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