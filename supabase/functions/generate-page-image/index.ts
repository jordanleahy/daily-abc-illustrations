/**
 * Generate Page Image Edge Function
 * 
 * This edge function generates images directly for individual ABC book pages using
 * Gemini's image generation capability with the book's style guide.
 * 
 * @requires LOVABLE_API_KEY - Lovable AI Gateway API key
 * @requires SUPABASE_URL - Supabase project URL
 * @requires SUPABASE_ANON_KEY - Supabase anonymous key for database access
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { ProcessStatus, corsHeaders, log, generateRequestId } from '../_shared/types.ts';
import { appendSafeSpaceRules } from '../_shared/safeSpaceConfig.ts';

serve(async (req) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  log('INFO', ProcessStatus.IN_PROGRESS, 'REQUEST', `Starting page image generation`, { requestId, method: req.method });

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

    currentStep = 'VALIDATE_PREREQUISITES';
    const validateStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Validating prerequisites...', { requestId });

    // **CRITICAL: Check for deployed page-specific prompt first**
    const { data: pagePrompt, error: pagePromptError } = await supabaseClient
      .from('page_system_prompts')
      .select('*')
      .eq('page_id', pageId)
      .eq('is_deployed', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // **ENFORCE: Page prompt must exist for image generation**
    if (!pagePrompt) {
      const errorMsg = 'No deployed page-specific prompt found. You must generate page prompts before creating images.';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        duration: Date.now() - validateStartTime,
        pageId: pageId?.substring(0, 8) + '...',
        hasPagePrompt: false
      });
      throw new Error(errorMsg);
    }

    // Fetch the specific page data along with book data and style guide
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

    const validateDuration = Date.now() - validateStartTime;

    if (pageError) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'Failed to fetch page data', { 
        requestId, 
        duration: validateDuration,
        error: pageError.message,
        pageId: pageId?.substring(0, 8) + '...'
      });
      throw new Error(`Failed to fetch page: ${pageError.message}`);
    }

    if (!pageData || (pageData as any).books?.user_id !== userId) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'Page not found or access denied', { 
        requestId, 
        duration: validateDuration,
        pageExists: !!pageData,
        userIdMatch: (pageData as any)?.books?.user_id === userId
      });
      throw new Error('Page not found or access denied');
    }

    // Find the deployed book system prompt (style guide)
    const deployedPrompt = (pageData as any).books.book_system_prompts?.find((prompt: any) => prompt.is_deployed);
    
    if (!deployedPrompt) {
      const errorMsg = 'No deployed style guide found. You must generate a style guide first.';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        duration: validateDuration,
        pageId: pageId?.substring(0, 8) + '...',
        bookId: pageData.book_id?.substring(0, 8) + '...'
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, '✅ All prerequisites validated', { 
      requestId, 
      duration: validateDuration,
      letter: pageData.letter,
      title: pageData.title?.substring(0, 30) + '...',
      bookId: pageData.book_id?.substring(0, 8) + '...',
      hasPagePrompt: true,
      hasStyleGuide: true,
      pagePromptVersion: pagePrompt.version_number,
      styleGuideVersion: deployedPrompt.version_number
    });

    currentStep = 'EXTRACT_COLORS';
    const colorStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Extracting color palette from style guide...', { requestId });

    // Import color extraction utilities
    const { extractColorsFromStyleGuide, generateColorEnforcementInstructions, validateColorPalette } = await import('../_shared/colorExtractor.ts');
    
    // Parse style guide JSON and extract colors
    let styleGuideJSON: any;
    let colors: any;
    let colorEnforcement = '';
    
    try {
      styleGuideJSON = JSON.parse(deployedPrompt.content);
      colors = extractColorsFromStyleGuide(styleGuideJSON);
      
      if (!colors) {
        throw new Error('Failed to extract color palette from style guide');
      }
      
      // Validate color formats
      const colorValidation = validateColorPalette(colors);
      if (!colorValidation.valid) {
        log('WARN', ProcessStatus.WARNING, currentStep, 'Some colors have invalid format', {
          requestId,
          invalidColors: colorValidation.invalidColors
        });
      }
      
      // Generate mandatory color enforcement instructions
      colorEnforcement = generateColorEnforcementInstructions(colors);
      
      log('INFO', ProcessStatus.COMPLETE, currentStep, 'Colors extracted and validated', { 
        requestId, 
        duration: Date.now() - colorStartTime,
        primaryColor: colors.primary.hex,
        secondaryColor: colors.secondary.hex,
        accentColor: colors.accent.hex,
        backgroundColor: colors.background.hex
      });
      
    } catch (error) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'Failed to extract colors from style guide', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        styleGuideLength: deployedPrompt.content.length
      });
      // Continue without color enforcement if extraction fails
      colorEnforcement = '';
    }

    currentStep = 'PREPARE_CONTENT';
    const prepareStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Preparing content for image generation...', { requestId });

    // Use page-specific prompt as the complete instruction
    const pageContent = `Generate the image exactly as specified in the system prompt for page "${pageData.letter}: ${pageData.title}".`;

    // Get Lovable AI API key
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'Lovable AI API key not configured', { requestId });
      throw new Error('Lovable AI API key not configured');
    }

    const prepareDuration = Date.now() - prepareStartTime;
    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Content prepared for image generation', { 
      requestId, 
      duration: prepareDuration,
      contentLength: pageContent.length,
      hasColorEnforcement: colorEnforcement.length > 0,
      letter: pageData.letter
    });

    currentStep = 'GENERATE_IMAGE';
    const aiStartTime = Date.now();
    const model = 'google/gemini-2.5-flash-image';

    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Calling Gemini Nano banana to generate image with locked colors...', { 
      requestId,
      model,
      letter: pageData.letter,
      colorsLocked: colors ? true : false
    });

    // Combine page prompt with mandatory color enforcement
    const enhancedSystemPrompt = colorEnforcement 
      ? `${pagePrompt.content}\n\n${colorEnforcement}`
      : pagePrompt.content;

    // Call Lovable AI Gateway with Gemini image generation model
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: enhancedSystemPrompt // Page prompt + color enforcement
          },
          {
            role: 'user',
            content: pageContent
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    const aiDuration = Date.now() - aiStartTime;
    
    if (!response.ok) {
      let errorMsg = 'AI API error';
      if (response.status === 429) {
        errorMsg = 'Rate limit exceeded. Please try again later.';
      } else if (response.status === 402) {
        errorMsg = 'Payment required. Please add credits to your Lovable AI workspace.';
      } else {
        const raw = await response.text().catch(() => '');
        try {
          const parsed = raw ? JSON.parse(raw) : {};
          errorMsg = `AI API error: ${parsed.error?.message || parsed.message || response.statusText}`;
        } catch {
          errorMsg = `AI API error: ${raw || response.statusText}`;
        }
      }
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, { 
        requestId, 
        duration: aiDuration,
        statusCode: response.status
      });
      throw new Error(errorMsg);
    }

    const data = await response.json();
    
    // Extract base64 image from response
    const imageData = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData || !imageData.startsWith('data:image/')) {
      const errorMsg = 'No image data returned from AI';
      log('ERROR', ProcessStatus.ERROR, currentStep, errorMsg, {
        requestId,
        duration: aiDuration,
        hasImages: !!data?.choices?.[0]?.message?.images,
        letter: pageData.letter
      });
      throw new Error(errorMsg);
    }

    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Image generated successfully', { 
      requestId, 
      duration: aiDuration,
      imageDataLength: imageData.length,
      letter: pageData.letter
    });

    // Upload image to Supabase storage
    currentStep = 'UPLOAD_IMAGE';
    const uploadStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Uploading image to storage...', { requestId });

    // Convert base64 to blob
    const base64Data = imageData.split(',')[1];
    const mimeType = imageData.match(/data:(.*?);/)?.[1] || 'image/png';
    const imageBlob = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Generate unique filename with user_id as first folder (for RLS policy)
    const timestamp = Date.now();
    const filename = `${userId}/${pageData.book_id}/${pageId}-v${timestamp}.png`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('page-images')
      .upload(filename, imageBlob, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'Failed to upload image', { 
        requestId, 
        error: uploadError.message 
      });
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('page-images')
      .getPublicUrl(filename);

    const uploadDuration = Date.now() - uploadStartTime;
    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Image uploaded to storage', { 
      requestId, 
      duration: uploadDuration,
      filename,
      publicUrl: urlData.publicUrl
    });

    // Save to database
    currentStep = 'SAVE_TO_DATABASE';
    const saveStartTime = Date.now();
    log('INFO', ProcessStatus.IN_PROGRESS, currentStep, 'Saving image metadata to database...', { requestId });

    // Get the next version number for this page
    const { data: versionData, error: versionError } = await supabaseClient
      .rpc('get_next_page_image_version_number', { p_page_id: pageId });

    if (versionError) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'Failed to get version number', { 
        requestId, 
        error: versionError.message 
      });
      throw new Error(`Failed to get version number: ${versionError.message}`);
    }

    const versionNumber = versionData || 1;

    // Insert the image record
    const { error: insertError } = await supabaseClient
      .from('page_image_urls')
      .insert({
        page_id: pageId,
        book_id: pageData.book_id,
        user_id: userId,
        image_url: urlData.publicUrl,
        version_number: versionNumber,
        source_type: 'ai_generated',
        is_latest: true,
        generation_status: 'complete',
        generation_started_at: new Date(aiStartTime).toISOString(),
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: aiDuration,
        prompt_used: colors 
          ? `Page Prompt (v${pagePrompt.version_number}) + Color Locked: ${colors.primary.hex}, ${colors.secondary.hex}, ${colors.accent.hex}`
          : `Page Prompt (v${pagePrompt.version_number})`
      });

    if (insertError) {
      log('ERROR', ProcessStatus.ERROR, currentStep, 'Failed to save to database', { 
        requestId, 
        error: insertError.message 
      });
      throw new Error(`Failed to save to database: ${insertError.message}`);
    }

    const saveDuration = Date.now() - saveStartTime;
    log('INFO', ProcessStatus.COMPLETE, currentStep, 'Image metadata saved to database', { 
      requestId, 
      duration: saveDuration,
      versionNumber
    });

    const totalDuration = Date.now() - startTime;
    log('INFO', ProcessStatus.COMPLETE, 'COMPLETE', 'Page image generation completed successfully!', { 
      requestId,
      totalDuration,
      imageUrl: urlData.publicUrl,
      pageInfo: {
        letter: pageData.letter,
        title: pageData.title
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: urlData.publicUrl,
        pageId,
        versionNumber
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    log('ERROR', ProcessStatus.ERROR, currentStep || 'UNKNOWN', 'Page image generation failed', { 
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
