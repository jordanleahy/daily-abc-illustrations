import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errors, handleException } from '../_shared/response.ts';
import { extractJSON } from '../_shared/jsonExtractor.ts';

interface SEORequest {
  bookId: string;
  dailyPublishedId?: string;
  contentTitle: string;
  bookDescription?: string;
  ogImageUrl?: string;
  userId?: string;
}

interface OptimizationResponse {
  title: string;
  description: string;
}

Deno.serve(createHandler({
  name: 'generate-seo-metadata',
  clientMode: 'service',
  requireAuth: false,
  methods: ['POST'],
}, async ({ supabase, req }) => {
  const { 
    bookId, 
    dailyPublishedId, 
    contentTitle, 
    bookDescription, 
    ogImageUrl,
    userId 
  } = await parseBody<SEORequest>(req);

  console.log('[GENERATE-SEO-METADATA] Generating for book:', bookId, 'daily published:', dailyPublishedId);

  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    throw new Error('Missing LOVABLE_API_KEY');
  }

  if (!bookId || !contentTitle) {
    return errors.badRequest('Missing required parameters: bookId and contentTitle');
  }

  // If userId not provided, get it from the book
  let finalUserId = userId;
  if (!finalUserId) {
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('user_id')
      .eq('id', bookId)
      .single();

    if (bookError || !bookData) {
      return errors.notFound('Failed to find book or get user_id');
    }
    finalUserId = bookData.user_id;
  }

  // Build context for the AI
  let context = `Content Title: "${contentTitle}"`;
  if (bookDescription) {
    context += `\nBook Description: "${bookDescription}"`;
  }

  const prompt = `${context}

Create an SEO-optimized title and description for this educational children's content:

Requirements:
- Title: Maximum 60 characters, engaging and click-worthy
- Description: Maximum 160 characters, compelling and informative
- Focus on educational value and child appeal
- Use emojis sparingly but effectively
- Make parents want to click for their kids

Return only JSON format:
{
  "title": "optimized title here",
  "description": "optimized description here"
}`;

  console.log('[GENERATE-SEO-METADATA] Calling Lovable AI Gateway...');
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a SEO specialist.' },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 300,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return errors.rateLimit('Rate limit exceeded. Please try again later.');
    } else if (response.status === 402) {
      return errors.paymentRequired('Payment required. Please add credits to your Lovable AI workspace.');
    }
    throw new Error(`Lovable AI Gateway error: ${response.statusText}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0].message.content.trim();
  
  console.log('[GENERATE-SEO-METADATA] AI Response:', aiResponse);

  // Extract and parse the JSON response
  const extracted = extractJSON<OptimizationResponse>(
    aiResponse,
    (data): data is OptimizationResponse => {
      return typeof data === 'object' && 
             data !== null && 
             'title' in data && 
             'description' in data &&
             typeof data.title === 'string' &&
             typeof data.description === 'string';
    }
  );

  if (!extracted.isValid || !extracted.data) {
    console.error('[GENERATE-SEO-METADATA] Failed to extract valid JSON:', {
      rawText: extracted.rawText,
      extractionMethod: extracted.extractionMethod,
      parseError: extracted.parseError
    });
    throw new Error(`AI response was not valid JSON: ${extracted.parseError || 'Unknown parsing error'}`);
  }

  const parsed = extracted.data;
  console.log('[GENERATE-SEO-METADATA] Optimization result:', parsed);

  // Get the next version number
  let versionNumber = 1;
  if (dailyPublishedId) {
    const { data: nextVersion } = await supabase.rpc('get_next_seo_version_number', {
      p_daily_published_id: dailyPublishedId
    });
    versionNumber = nextVersion || 1;
  }

  // Store in seo_metadata table
  const { data: seoMetadata, error: seoError } = await supabase
    .from('seo_metadata')
    .insert({
      book_id: bookId,
      daily_published_id: dailyPublishedId || null,
      user_id: finalUserId,
      version_number: versionNumber,
      seo_title: parsed.title,
      seo_description: parsed.description,
      og_image_url: ogImageUrl || null,
      optimization_status: 'complete',
      is_latest: true,
      is_active: true,
      source_data: {
        bookId,
        contentTitle,
        bookDescription
      },
      generation_metadata: {
        model: 'google/gemini-2.5-flash',
        prompt_tokens: data.usage?.prompt_tokens,
        completion_tokens: data.usage?.completion_tokens,
        total_tokens: data.usage?.total_tokens
      }
    })
    .select()
    .single();

  if (seoError) {
    console.error('[GENERATE-SEO-METADATA] Error storing SEO metadata:', seoError);
    throw new Error(`Failed to store SEO metadata: ${seoError.message}`);
  }

  console.log('[GENERATE-SEO-METADATA] SEO metadata stored with ID:', seoMetadata.id);

  // Generate OG image from book cover
  let generatedOgImageUrl = ogImageUrl || null;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    // Get the cover image (first page) for this book
    const { data: coverImage } = await supabase
      .from('page_image_urls')
      .select('image_url')
      .eq('book_id', bookId)
      .eq('is_latest', true)
      .not('image_url', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (coverImage?.image_url) {
      console.log('[GENERATE-SEO-METADATA] Generating OG image from cover:', coverImage.image_url);
      
      const ogResponse = await fetch(`${supabaseUrl}/functions/v1/generate-og-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coverImageUrl: coverImage.image_url,
          bookId: bookId,
          dailyPublishedId: dailyPublishedId,
          seoMetadataId: seoMetadata.id
        }),
      });

      if (ogResponse.ok) {
        const ogResult = await ogResponse.json();
        if (ogResult.success && ogResult.ogImageUrl) {
          generatedOgImageUrl = ogResult.ogImageUrl;
          console.log('[GENERATE-SEO-METADATA] OG image generated:', generatedOgImageUrl);
        }
      } else {
        console.error('[GENERATE-SEO-METADATA] OG image generation failed:', await ogResponse.text());
      }
    } else {
      console.log('[GENERATE-SEO-METADATA] No cover image found for OG generation');
    }
  } catch (ogError) {
    console.error('[GENERATE-SEO-METADATA] Error generating OG image:', ogError);
  }

  return successResponse({
    success: true,
    seoMetadataId: seoMetadata.id,
    version: versionNumber,
    optimizedTitle: parsed.title,
    optimizedDescription: parsed.description,
    ogImageUrl: generatedOgImageUrl
  });
}));
