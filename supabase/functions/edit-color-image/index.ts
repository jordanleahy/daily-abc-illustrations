import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';
import { 
  IMAGE_GENERATION_MODEL, 
  IMAGE_GENERATION_COST_CENTS,
  logImageGenerationUsage,
  buildImageGenerationMetadata
} from "../_shared/aiModelConstants.ts";

interface EditImageRequest {
  pageId: string;
  bookId: string;
  imageUrl: string;
  editPrompt: string;
}

Deno.serve(createHandler({
  name: 'edit-color-image',
  clientMode: 'service',
  requireAuth: true,
}, async ({ supabase, user, req }) => {
  const { pageId, bookId, imageUrl, editPrompt } = await parseBody<EditImageRequest>(req);

  if (!pageId || !bookId || !imageUrl || !editPrompt) {
    return errors.badRequest('Missing required parameters: pageId, bookId, imageUrl, editPrompt');
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

  console.log('✏️ Editing color image for page:', pageId);
  console.log('📝 Edit prompt:', editPrompt);
  console.log('🖼️ Source image URL:', imageUrl.substring(0, 100) + '...');

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: IMAGE_GENERATION_MODEL,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: editPrompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }],
      modalities: ["image", "text"]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lovable AI error:', response.status, errorText);
    if (response.status === 429) return errors.rateLimit('Rate limit exceeded. Please try again later.');
    if (response.status === 402) return errors.paymentRequired('AI credits exhausted. Please add credits.');
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const aiData = await response.json();
  
  const usage = aiData.usage;
  const inputTokens = usage?.prompt_tokens || 0;
  const outputTokens = usage?.completion_tokens || 0;
  const costCents = IMAGE_GENERATION_COST_CENTS;
  
  logImageGenerationUsage(inputTokens, outputTokens, inputTokens + outputTokens);

  const generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  if (!generatedImageUrl) {
    console.error('No image in AI response:', JSON.stringify(aiData).substring(0, 500));
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'The AI couldn\'t generate the edited image. Try a different edit prompt.',
        errorCode: 'NO_IMAGE_GENERATED'
      }),
      { status: 422, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Convert base64 to blob and upload
  const base64Data = generatedImageUrl.replace(/^data:image\/\w+;base64,/, '');
  const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const imageBlob = new Blob([imageBytes], { type: 'image/png' });

  const fileName = `edited-${pageId}-${Date.now()}.png`;
  const filePath = `${user!.userId}/${bookId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('page-images')
    .upload(filePath, imageBlob, { contentType: 'image/png', upsert: true });

  if (uploadError) throw new Error('Failed to upload edited image');

  const { data: publicUrlData } = supabase.storage.from('page-images').getPublicUrl(filePath);
  const editedImageUrl = publicUrlData.publicUrl;
  console.log('🖼️ Edited image uploaded:', editedImageUrl);

  // Update page_image_urls table
  const { data: existingRecord } = await supabase
    .from('page_image_urls')
    .select('id, color_generation_cost_cents, usage_metadata')
    .eq('page_id', pageId)
    .eq('is_latest', true)
    .single();

  if (existingRecord) {
    await supabase.from('page_image_urls').update({ 
      image_url: editedImageUrl,
      color_generation_cost_cents: (existingRecord.color_generation_cost_cents || 0) + costCents,
      usage_metadata: {
        ...(existingRecord.usage_metadata || {}),
        ...buildImageGenerationMetadata(inputTokens, outputTokens, 'image_edit', { edit_prompt: editPrompt })
      }
    }).eq('id', existingRecord.id);
  } else {
    await supabase.from('page_image_urls').insert({
      page_id: pageId,
      book_id: bookId,
      user_id: user!.userId,
      image_url: editedImageUrl,
      is_latest: true,
      version_number: 1,
      source_type: 'ai_edited',
      color_generation_cost_cents: costCents,
      usage_metadata: buildImageGenerationMetadata(inputTokens, outputTokens, 'image_edit', { edit_prompt: editPrompt })
    });
  }

  return successResponse({ success: true, imageUrl: editedImageUrl, costCents });
}));
