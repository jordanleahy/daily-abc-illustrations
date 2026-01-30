import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { 
  IMAGE_GENERATION_MODEL,
  IMAGE_GENERATION_MODEL_PRO,
  getImageCostByModel,
  logImageGenerationUsage,
  buildImageGenerationMetadata
} from "../_shared/aiModelConstants.ts";
import { OPPOSITES_SPLIT_SCREEN_RULES } from "../_shared/safeSpaceConfig.ts";
import { 
  generateCoverTitleInstruction,
  COVER_ASPECT_RATIOS 
} from "../_shared/coverPromptConstants.ts";
import { corsHeaders } from '../_shared/cors.ts';

// Page types that use the pro model for better text accuracy
const PRO_MODEL_PAGE_TYPES = ['cover', 'educational'];

// Strong negative prompt to prevent text in generated images
const NEGATIVE_PROMPT = 'No text overlays. DO NOT add any text, labels, signs, words, letters, captions, or written content. Clean illustration only.';

/**
 * Add negative prompt enforcement to sanitized prompts
 * Prompts are now pre-sanitized at extraction time on the client.
 * This function just adds the negative prompt as a safety net.
 */
function addNegativePrompt(prompt: string): string {
  if (!prompt) return '';
  
  // If negative prompt already exists, return as-is
  if (prompt.toLowerCase().includes('do not add any text')) {
    return prompt;
  }
  
  // Append negative prompt
  return prompt.replace(/\.?\s*$/, '. ' + NEGATIVE_PROMPT);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pageId, bookId, prompt, pageType, bookTitle } = await req.json();

    if (!pageId || !bookId || !prompt) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: pageId, bookId, prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch book category to determine if this is an opposites book
    const { data: bookData } = await supabase
      .from('books')
      .select('category')
      .eq('id', bookId)
      .single();
    
    const bookCategory = bookData?.category || '';
    const isOppositesBook = bookCategory === 'opposites';

    // Determine which model to use based on page type
    const useProModel = pageType && PRO_MODEL_PAGE_TYPES.includes(pageType);
    const selectedModel = useProModel ? IMAGE_GENERATION_MODEL_PRO : IMAGE_GENERATION_MODEL;
    
    // Enforce 1:1 aspect ratio for cover and educational pages using shared constants
    const requiresSquareFormat = pageType && PRO_MODEL_PAGE_TYPES.includes(pageType);
    const aspectRatioPrefix = requiresSquareFormat 
      ? `${COVER_ASPECT_RATIOS.square}\n\n`
      : '';
    
    // For cover pages, ensure the book title is prominently featured using shared utility
    const isCoverPage = pageType === 'cover';
    const coverTitlePrefix = isCoverPage && bookTitle
      ? `CRITICAL - BOOK COVER: This is a COVER PAGE for the book titled "${bookTitle}". ${generateCoverTitleInstruction(bookTitle)}\n\n`
      : '';
    
    // Apply split-screen composition rules for opposites book content pages
    const isOppositesContentPage = isOppositesBook && pageType === 'content';
    const oppositesSuffix = isOppositesContentPage ? OPPOSITES_SPLIT_SCREEN_RULES : '';
    
    // Prompts are pre-sanitized at extraction time on the client
    // Add negative prompt as defense-in-depth safety net
    const promptWithNegative = addNegativePrompt(prompt);
    
    const enhancedPrompt = aspectRatioPrefix + coverTitlePrefix + promptWithNegative + oppositesSuffix;
    
    console.log('🎨 Generating color image for page:', pageId);
    console.log('📄 Page type:', pageType || 'unknown');
    console.log('📚 Book category:', bookCategory || 'unknown');
    console.log('🔀 Opposites split-screen rules applied:', isOppositesContentPage);
    console.log('🤖 Using model:', selectedModel, useProModel ? '(PRO - better text accuracy)' : '(standard)');
    console.log('📐 Square format enforced:', requiresSquareFormat);
    console.log('📕 Cover title included:', isCoverPage && bookTitle ? bookTitle : 'N/A');
    console.log('📝 Prompt length:', enhancedPrompt.length);

    // Call Lovable AI to generate the color image with retry logic for transient errors
    const MAX_RETRIES = 2;
    let lastError: Error | null = null;
    let generatedImageUrl: string | null = null;
    let aiData: any = null;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${MAX_RETRIES} after transient error`);
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              {
                role: "user",
                content: enhancedPrompt
              }
            ],
            modalities: ["image", "text"]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Lovable AI error:', response.status, errorText);
          
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          if (response.status === 402) {
            return new Response(
              JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits.' }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // Retry on 5xx errors
          if (response.status >= 500) {
            lastError = new Error(`AI gateway error: ${response.status}`);
            continue;
          }
          
          throw new Error(`AI gateway error: ${response.status}`);
        }

        aiData = await response.json();
        
        // Check for upstream provider errors (like network issues)
        const choiceError = aiData.choices?.[0]?.error;
        if (choiceError) {
          console.warn('AI provider error:', choiceError.message, '- code:', choiceError.code);
          // Retry on network errors (502, 503, etc.)
          if (choiceError.code >= 500 || choiceError.message?.includes('Network')) {
            lastError = new Error(`Provider error: ${choiceError.message}`);
            continue;
          }
        }
        
        // Extract the generated image from the response
        generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (generatedImageUrl) {
          // Success! Break out of retry loop
          break;
        } else {
          console.warn('No image in AI response (attempt', attempt + 1, '):', JSON.stringify(aiData).substring(0, 500));
          lastError = new Error('No image generated by AI');
          // Continue to retry
        }
      } catch (fetchError) {
        console.error('Fetch error (attempt', attempt + 1, '):', fetchError);
        lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
      }
    }
    
    if (!generatedImageUrl) {
      console.error('Failed after all retries. Last error:', lastError?.message);
      throw lastError || new Error('No image generated by AI after retries');
    }
    
    // Extract and log usage/cost information
    const usage = aiData?.usage;
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const totalTokens = usage?.total_tokens || inputTokens + outputTokens;
    
    // Use dynamic pricing based on selected model
    const { cents: costCents } = getImageCostByModel(selectedModel);
    
    logImageGenerationUsage(inputTokens, outputTokens, totalTokens, selectedModel);

    // Convert base64 to blob
    const base64Data = generatedImageUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const imageBlob = new Blob([imageBytes], { type: 'image/png' });

    // Upload to Supabase Storage
    const fileName = `color-${pageId}-${Date.now()}.png`;
    const filePath = `${user.id}/${bookId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('page-images')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload color image');
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('page-images')
      .getPublicUrl(filePath);

    const colorImageUrl = publicUrlData.publicUrl;
    console.log('🖼️ Color image uploaded:', colorImageUrl);

    // Update the page_image_urls table with cost tracking
    const { data: existingRecord } = await supabase
      .from('page_image_urls')
      .select('id, color_generation_cost_cents, usage_metadata')
      .eq('page_id', pageId)
      .eq('is_latest', true)
      .single();

    if (existingRecord) {
      // Update existing record with color image and cost
      const { error: updateError } = await supabase
        .from('page_image_urls')
        .update({ 
          image_url: colorImageUrl,
          color_generation_cost_cents: (existingRecord.color_generation_cost_cents || 0) + costCents,
          usage_metadata: {
            ...(existingRecord.usage_metadata || {}),
            ...buildImageGenerationMetadata(inputTokens, outputTokens, 'color_generation', selectedModel)
          }
        })
        .eq('id', existingRecord.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error('Failed to update color image URL');
      }
    } else {
      // Create new record with cost tracking
      const { error: insertError } = await supabase
        .from('page_image_urls')
        .insert({
          page_id: pageId,
          book_id: bookId,
          user_id: user.id,
          image_url: colorImageUrl,
          is_latest: true,
          version_number: 1,
          source_type: 'ai_generated',
          color_generation_cost_cents: costCents,
          usage_metadata: buildImageGenerationMetadata(inputTokens, outputTokens, 'color_generation', selectedModel)
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Failed to create color image record');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: colorImageUrl,
        costCents
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating color image:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to generate color image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
