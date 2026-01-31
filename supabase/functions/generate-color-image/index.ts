import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';
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

// Page types that use the pro model for better text accuracy
const PRO_MODEL_PAGE_TYPES = ['cover', 'educational'];

// Strong negative prompt to prevent text in generated images
const NEGATIVE_PROMPT = 'No text overlays. DO NOT add any text, labels, signs, words, letters, captions, or written content. Clean illustration only.';

function addNegativePrompt(prompt: string): string {
  if (!prompt) return '';
  if (prompt.toLowerCase().includes('do not add any text')) return prompt;
  return prompt.replace(/\.?\s*$/, '. ' + NEGATIVE_PROMPT);
}

interface ColorImageRequest {
  pageId: string;
  bookId: string;
  prompt: string;
  pageType?: string;
  bookTitle?: string;
}

Deno.serve(createHandler({
  name: 'generate-color-image',
  clientMode: 'service',
  requireAuth: true,
}, async ({ supabase, user, req }) => {
  const { pageId, bookId, prompt, pageType, bookTitle } = await parseBody<ColorImageRequest>(req);

  if (!pageId || !bookId || !prompt) {
    return errors.badRequest('Missing required parameters: pageId, bookId, prompt');
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

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
  
  // Enforce 1:1 aspect ratio for cover and educational pages
  const requiresSquareFormat = pageType && PRO_MODEL_PAGE_TYPES.includes(pageType);
  const aspectRatioPrefix = requiresSquareFormat 
    ? `${COVER_ASPECT_RATIOS.square}\n\n`
    : '';
  
  // For cover pages, ensure the book title is prominently featured
  const isCoverPage = pageType === 'cover';
  const coverTitlePrefix = isCoverPage && bookTitle
    ? `CRITICAL - BOOK COVER: This is a COVER PAGE for the book titled "${bookTitle}". ${generateCoverTitleInstruction(bookTitle)}\n\n`
    : '';
  
  // Apply split-screen composition rules for opposites book content pages
  const isOppositesContentPage = isOppositesBook && pageType === 'content';
  const oppositesSuffix = isOppositesContentPage ? OPPOSITES_SPLIT_SCREEN_RULES : '';
  
  const promptWithNegative = addNegativePrompt(prompt);
  const enhancedPrompt = aspectRatioPrefix + coverTitlePrefix + promptWithNegative + oppositesSuffix;
  
  console.log('🎨 Generating color image for page:', pageId);
  console.log('📄 Page type:', pageType || 'unknown');
  console.log('🤖 Using model:', selectedModel, useProModel ? '(PRO)' : '(standard)');

  // Call Lovable AI with retry logic
  const MAX_RETRIES = 2;
  let lastError: Error | null = null;
  let generatedImageUrl: string | null = null;
  let aiData: any = null;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.log(`🔄 Retry attempt ${attempt}/${MAX_RETRIES}`);
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
          messages: [{ role: "user", content: enhancedPrompt }],
          modalities: ["image", "text"]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lovable AI error:', response.status, errorText);
        
        if (response.status === 429) return errors.rateLimit('Rate limit exceeded. Please try again later.');
        if (response.status === 402) return errors.paymentRequired('AI credits exhausted. Please add credits.');
        if (response.status >= 500) {
          lastError = new Error(`AI gateway error: ${response.status}`);
          continue;
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      aiData = await response.json();
      
      const choiceError = aiData.choices?.[0]?.error;
      if (choiceError && (choiceError.code >= 500 || choiceError.message?.includes('Network'))) {
        lastError = new Error(`Provider error: ${choiceError.message}`);
        continue;
      }
      
      generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (generatedImageUrl) break;
      
      lastError = new Error('No image generated by AI');
    } catch (fetchError) {
      lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
    }
  }
  
  if (!generatedImageUrl) throw lastError || new Error('No image generated after retries');
  
  // Extract usage/cost
  const usage = aiData?.usage;
  const inputTokens = usage?.prompt_tokens || 0;
  const outputTokens = usage?.completion_tokens || 0;
  const { cents: costCents } = getImageCostByModel(selectedModel);
  
  logImageGenerationUsage(inputTokens, outputTokens, inputTokens + outputTokens, selectedModel);

  // Convert base64 to blob and upload
  const base64Data = generatedImageUrl.replace(/^data:image\/\w+;base64,/, '');
  const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const imageBlob = new Blob([imageBytes], { type: 'image/png' });

  const fileName = `color-${pageId}-${Date.now()}.png`;
  const filePath = `${user!.userId}/${bookId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('page-images')
    .upload(filePath, imageBlob, { contentType: 'image/png', upsert: true });

  if (uploadError) throw new Error('Failed to upload color image');

  const { data: publicUrlData } = supabase.storage.from('page-images').getPublicUrl(filePath);
  const colorImageUrl = publicUrlData.publicUrl;
  console.log('🖼️ Color image uploaded:', colorImageUrl);

  // Update page_image_urls table
  const { data: existingRecord } = await supabase
    .from('page_image_urls')
    .select('id, color_generation_cost_cents, usage_metadata')
    .eq('page_id', pageId)
    .eq('is_latest', true)
    .single();

  if (existingRecord) {
    await supabase.from('page_image_urls').update({ 
      image_url: colorImageUrl,
      color_generation_cost_cents: (existingRecord.color_generation_cost_cents || 0) + costCents,
      usage_metadata: {
        ...(existingRecord.usage_metadata || {}),
        ...buildImageGenerationMetadata(inputTokens, outputTokens, 'color_generation', selectedModel)
      }
    }).eq('id', existingRecord.id);
  } else {
    await supabase.from('page_image_urls').insert({
      page_id: pageId,
      book_id: bookId,
      user_id: user!.userId,
      image_url: colorImageUrl,
      is_latest: true,
      version_number: 1,
      source_type: 'ai_generated',
      color_generation_cost_cents: costCents,
      usage_metadata: buildImageGenerationMetadata(inputTokens, outputTokens, 'color_generation', selectedModel)
    });
  }

  return successResponse({ success: true, imageUrl: colorImageUrl, costCents });
}));
