import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';
import { 
  COLORING_IMAGE_MODEL,
  getImageCostByModel,
  logImageGenerationUsage,
  buildImageGenerationMetadata
} from "../_shared/aiModelConstants.ts";

async function convertToGrayscale(imageBytes: Uint8Array): Promise<Uint8Array> {
  try {
    const { Buffer } = await import("node:buffer");
    const { PNG } = await import("npm:pngjs@7.0.0");
    
    return new Promise((resolve, reject) => {
      const png = new PNG();
      
      png.parse(Buffer.from(imageBytes), (error: Error | null, data: any) => {
        if (error) {
          console.error('PNG parse error:', error);
          resolve(imageBytes);
          return;
        }
        
        for (let y = 0; y < data.height; y++) {
          for (let x = 0; x < data.width; x++) {
            const idx = (data.width * y + x) << 2;
            const r = data.data[idx];
            const g = data.data[idx + 1];
            const b = data.data[idx + 2];
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            data.data[idx] = gray;
            data.data[idx + 1] = gray;
            data.data[idx + 2] = gray;
          }
        }
        
        const outputBuffer = PNG.sync.write(data);
        resolve(new Uint8Array(outputBuffer));
      });
    });
  } catch (error) {
    console.error('Grayscale conversion error:', error);
    return imageBytes;
  }
}

interface ColoringImageRequest {
  pageId: string;
  bookId: string;
  textImageUrl?: string;
  sourceImageUrl?: string;
  sourceType?: string;
}

Deno.serve(createHandler({
  name: 'generate-coloring-image',
  clientMode: 'service',
  requireAuth: true,
}, async ({ supabase, user, req }) => {
  const { pageId, bookId, textImageUrl, sourceImageUrl, sourceType } = await parseBody<ColoringImageRequest>(req);

  const imageUrl = sourceImageUrl || textImageUrl;
  const imageSourceType = sourceType || 'text';

  if (!pageId || !bookId || !imageUrl) {
    return errors.badRequest('Missing required parameters: pageId, bookId, and image URL');
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

  console.log(`🎨 Generating coloring book image for page: ${pageId}`);
  console.log(`🤖 Using model: ${COLORING_IMAGE_MODEL}`);
  console.log(`📸 Source type: ${imageSourceType}`);

  const basePromptRules = `STYLE REFERENCE: Dover Publications coloring book, dollar store coloring book, rubber stamp line art, clip art outline, vector stroke-only illustration.

TARGET AUDIENCE: Pre-K children (ages 3-5) who color with chunky crayons and have developing fine motor skills.

OUTPUT FORMAT: 2-bit color depth - ONLY pure black lines (#000000) on pure white background (#FFFFFF). No anti-aliasing.

NEGATIVE (DO NOT INCLUDE): color, grayscale, shading, gradients, fills, shadows, texture, photorealistic details, gray pixels, brown, tan, beige, intricate patterns, overlapping elements, background clutter, any RGB values other than 000000 and FFFFFF.

Create a brand new BLACK AND WHITE LINE DRAWING based on this image. Do NOT filter or adjust - redraw as simple outline art.

PRE-K SIMPLIFICATION RULES:
- Maximum 3-5 main objects per illustration
- NO intricate patterns, textures, or fine details
- NO overlapping elements that confuse shape boundaries
- NO background clutter - focus on main subject only
- Each colorable area must be LARGE enough for chunky crayons
- Simple, recognizable shapes a 3-year-old can identify
- One clear focal point per illustration

LINE REQUIREMENTS FOR SMALL HANDS:
1. Extra bold outlines: 5-6px stroke width (thicker than standard coloring books)
2. Smooth, continuous lines - no scratchy or broken strokes
3. Clear, widely-spaced shapes so small hands don't color outside lines
4. Round, friendly shapes preferred over sharp angular forms
5. Every shape is HOLLOW/EMPTY inside - pure outlines only

PURPOSE: A Pre-K child will PRINT this on white paper and COLOR IT WITH CHUNKY CRAYONS. If any area has color, gray fill, or is too small/detailed, the child cannot color it successfully.`;

  const textImageSuffix = `

TEXT BAR AT BOTTOM - PRESERVE EXACTLY:
- The text bar at the very bottom must remain unchanged with its original colors
- Only convert the ILLUSTRATION AREA above it to line art

SELF-CHECK: In the illustration area, is there ANY pixel that is not pure black or pure white? Are shapes large and simple enough for a 3-year-old? If not, FIX IT.`;

  const colorImageSuffix = `

Note: Convert the ENTIRE image to line art. There is no text bar to preserve.

SELF-CHECK: Is every pixel pure black or pure white? Are shapes large and simple enough for a 3-year-old? If not, FIX IT.`;

  const prompt = basePromptRules + (imageSourceType === 'color' ? colorImageSuffix : textImageSuffix);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: COLORING_IMAGE_MODEL,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
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
  const { cents: costCents } = getImageCostByModel(COLORING_IMAGE_MODEL);
  
  logImageGenerationUsage(inputTokens, outputTokens, inputTokens + outputTokens, COLORING_IMAGE_MODEL);

  const generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!generatedImageUrl) throw new Error('No image generated by AI');

  const base64Data = generatedImageUrl.replace(/^data:image\/\w+;base64,/, '');
  let imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  
  console.log('🔲 Converting image to pure grayscale...');
  imageBytes = await convertToGrayscale(imageBytes);
  console.log('✅ Grayscale conversion complete');
  
  const imageBlob = new Blob([imageBytes], { type: 'image/png' });
  const fileName = `coloring-${pageId}-${Date.now()}.png`;
  const filePath = `${user!.userId}/${bookId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('page-images')
    .upload(filePath, imageBlob, { contentType: 'image/png', upsert: true });

  if (uploadError) throw new Error('Failed to upload coloring image');

  const { data: publicUrlData } = supabase.storage.from('page-images').getPublicUrl(filePath);
  const coloringImageUrl = publicUrlData.publicUrl;
  console.log('Coloring image uploaded:', coloringImageUrl);

  // Update page_image_urls table
  const { data: existingRecord } = await supabase
    .from('page_image_urls')
    .select('id, bw_generation_cost_cents, usage_metadata')
    .eq('page_id', pageId)
    .eq('is_latest', true)
    .single();

  if (existingRecord) {
    await supabase.from('page_image_urls').update({ 
      coloring_image_url: coloringImageUrl,
      bw_generation_cost_cents: (existingRecord.bw_generation_cost_cents || 0) + costCents,
      usage_metadata: {
        ...(existingRecord.usage_metadata || {}),
        ...buildImageGenerationMetadata(inputTokens, outputTokens, 'coloring_generation', COLORING_IMAGE_MODEL)
      }
    }).eq('id', existingRecord.id);
  } else {
    await supabase.from('page_image_urls').insert({
      page_id: pageId,
      book_id: bookId,
      user_id: user!.userId,
      coloring_image_url: coloringImageUrl,
      is_latest: true,
      version_number: 1,
      source_type: 'ai_generated',
      bw_generation_cost_cents: costCents,
      usage_metadata: buildImageGenerationMetadata(inputTokens, outputTokens, 'coloring_generation', COLORING_IMAGE_MODEL)
    });
  }

  // Check if all pages complete for auto-generating printable coloring book
  console.log('📊 Checking if all pages are complete for printable generation...');
  
  const { data: bookPages } = await supabase
    .from('pages')
    .select('id')
    .eq('book_id', bookId);
  
  const totalPages = bookPages?.length || 0;
  
  if (totalPages > 0) {
    const { data: completedPages } = await supabase
      .from('page_image_urls')
      .select('page_id')
      .eq('book_id', bookId)
      .eq('is_latest', true)
      .not('image_url', 'is', null)
      .not('coloring_image_url', 'is', null);
    
    const completedCount = completedPages?.length || 0;
    console.log(`📖 Book progress: ${completedCount}/${totalPages} pages complete`);
    
    if (completedCount === totalPages) {
      console.log('🎉 All pages complete! Triggering printable coloring book generation...');
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const printableResponse = await fetch(
        `${supabaseUrl}/functions/v1/generate-printable-coloring-image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bookId, batchProcess: true })
        }
      );
      
      if (printableResponse.ok) {
        console.log('✅ Printable coloring book generated:', await printableResponse.json());
      } else {
        console.error('⚠️ Printable generation failed:', await printableResponse.text());
      }
    }
  }

  return successResponse({ success: true, coloringImageUrl });
}));
