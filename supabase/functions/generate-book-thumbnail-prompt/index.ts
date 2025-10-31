import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { appendSafeSpaceRules } from '../_shared/safeSpaceConfig.ts';
import { extractColorsFromStyleGuide, generateColorEnforcementInstructions, validateColorPalette } from '../_shared/colorExtractor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Generate Book Thumbnail Prompt Function Started ===');
    
    // Log incoming request details
    const requestBody = await req.json();
    const { bookId, userId } = requestBody;
    console.log('Request parameters:', { bookId, userId, hasAuth: !!req.headers.get('Authorization') });

    // Validate required parameters
    if (!bookId || !userId) {
      console.error('Missing required parameters:', { bookId: !!bookId, userId: !!userId });
      throw new Error('Missing required parameters: bookId, userId');
    }

    // Check Lovable API key availability (without logging the actual key)
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    console.log('Lovable API key available:', !!lovableApiKey);
    if (!lovableApiKey) {
      console.error('Lovable API key not configured in environment');
      throw new Error('Lovable API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    console.log('Supabase config available:', { url: !!supabaseUrl, key: !!supabaseAnonKey });
    
    const supabase = createClient(
      supabaseUrl ?? '',
      supabaseAnonKey ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    console.log('Fetching book data for bookId:', bookId);
    
    // Fetch book data and deployed style guide
    const { data: book, error } = await supabase
      .from('books')
      .select('book_name, category, book_description, current_system_prompt_id')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!book) {
      console.error('Book not found or access denied for:', { bookId, userId });
      throw new Error('Book not found or access denied');
    }

    console.log('Book data retrieved:', { 
      name: book.book_name, 
      category: book.category, 
      hasDescription: !!book.book_description,
      hasStyleGuide: !!book.current_system_prompt_id
    });

    // Validate style guide exists
    if (!book.current_system_prompt_id) {
      console.error('No deployed style guide found for book:', bookId);
      throw new Error('You must generate and deploy a style guide before creating a thumbnail');
    }

    // Fetch the deployed style guide
    console.log('Fetching deployed style guide...');
    const { data: styleGuidePrompt, error: styleGuideError } = await supabase
      .from('book_system_prompts')
      .select('content, illustration_config')
      .eq('id', book.current_system_prompt_id)
      .single();

    if (styleGuideError || !styleGuidePrompt) {
      console.error('Failed to fetch style guide:', styleGuideError);
      throw new Error('Failed to fetch style guide');
    }

    console.log('Style guide retrieved successfully');

    // Parse style guide JSON
    let styleGuideJSON: any = null;
    try {
      styleGuideJSON = JSON.parse(styleGuidePrompt.illustration_config || '{}');
    } catch (parseError) {
      console.error('Failed to parse style guide JSON:', parseError);
      throw new Error('Style guide JSON is malformed');
    }

    // Extract and validate colors
    console.log('Extracting colors from style guide...');
    const colors = extractColorsFromStyleGuide(styleGuideJSON);
    if (!colors) {
      throw new Error('Style guide missing required color palette');
    }

    const colorValidation = validateColorPalette(colors);
    if (!colorValidation.valid) {
      console.error('Invalid colors in palette:', colorValidation.invalidColors);
      throw new Error(`Style guide has invalid color formats: ${colorValidation.invalidColors.join(', ')}`);
    }

    console.log('Colors extracted and validated successfully');

    // Determine target audience from description or category
    const targetAudience = book.book_description?.match(/(for |aged |ages |targeting )([^.,!]+)/i)?.[2] || 
                          (book.category?.toLowerCase().includes('toddler') ? 'toddlers' : 
                           book.category?.toLowerCase().includes('preschool') ? 'preschoolers' : 
                           'young learners');

    // Extract style guide elements
    const artStyle = styleGuideJSON.styleRequirements?.artStyle || 'educational illustration';
    const tone = styleGuideJSON.styleRequirements?.tone || 'playful and engaging';
    const visualMetaphors = styleGuideJSON.visualMetaphors?.concepts?.join(', ') || '';
    const layoutFlow = styleGuideJSON.compositionGuidelines?.layoutFlow || 'balanced composition';
    const focusHierarchy = styleGuideJSON.compositionGuidelines?.focusHierarchy || 'centered focal point';

    // Generate color enforcement instructions
    const colorInstructions = generateColorEnforcementInstructions(colors);

    // Create comprehensive prompt that incorporates style guide
    const prompt = `Generate a book thumbnail image for "${book.book_name}".
${book.book_description ? `Book context: ${book.book_description}` : ''}
Target audience: ${targetAudience}

STYLE GUIDE REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎨 Art Style: ${artStyle}
🎭 Tone: ${tone}
${visualMetaphors ? `🔮 Visual Metaphors: ${visualMetaphors}` : ''}

${colorInstructions}

📐 COMPOSITION GUIDELINES:
- Layout Flow: ${layoutFlow}
- Focus Hierarchy: ${focusHierarchy}
- Ensure text elements are readable and prominent
- Safe space: Keep key elements away from edges

📝 REQUIRED TEXT ELEMENTS:
- Large, bold title: "${book.book_name}" (centered, highly visible)
- Smaller subtitle: "for ${targetAudience}" (centered below title)

🎯 TECHNICAL SPECS:
- Aspect ratio: 3:2
- Resolution: High quality for web display
- Text must be legible and professional
- Thumbnail should be instantly recognizable

Your output must be a SINGLE, DIRECT image generation prompt paragraph. Do not provide options or explanations. The prompt must be ready to send directly to an image generator and must strictly follow all color palette requirements above.`;

    console.log('Generated comprehensive style-aware prompt');
    console.log('Prompt length:', prompt.length);
    console.log('Target audience:', targetAudience);
    console.log('Art style:', artStyle);
    console.log('Colors validated:', Object.keys(colors).length);

    // Prepare Lovable AI request
    const lovableAIRequest = {
      model: 'google/gemini-2.5-flash-lite',
      max_completion_tokens: 1000,
      messages: [
        { 
          role: 'system', 
          content: 'You generate SINGLE, DIRECT image prompts for an image generation model. Output only one paragraph describing the image - no options, no explanations, no formatting. The prompt should be ready to send directly to an image generator. Always include the exact title text and subtitle "for [audience]" centered in the composition.' 
        },
        { role: 'user', content: prompt }
      ],
    };

    console.log('Making Lovable AI Gateway call with:', { 
      model: lovableAIRequest.model, 
      max_completion_tokens: lovableAIRequest.max_completion_tokens,
      messagesCount: lovableAIRequest.messages.length 
    });

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lovableAIRequest),
    });

    console.log('Lovable AI response status:', response.status, response.statusText);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      let errorData;
      try {
        errorData = await response.json();
        console.error('Lovable AI Gateway error response:', errorData);
      } catch (parseError) {
        console.error('Failed to parse Lovable AI error response:', parseError);
        errorData = { error: { message: `HTTP ${response.status}: ${response.statusText}` } };
      }
      throw new Error(`Lovable AI Gateway error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Lovable AI response received:', { 
      hasChoices: !!data.choices, 
      choicesLength: data.choices?.length,
      hasContent: !!data.choices?.[0]?.message?.content 
    });

    const generatedPrompt = data?.choices?.[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      console.error('No content generated from Lovable AI response:', data);
      throw new Error('Failed to generate prompt - no content in response');
    }

    console.log('Generated prompt length:', generatedPrompt.length);

    // Apply safe space rules for 3:2 aspect ratio
    const enhancedPrompt = appendSafeSpaceRules(generatedPrompt, '3:2');
    console.log('Enhanced prompt with safe space rules applied');

    const successResponse = {
      success: true, 
      thumbnailPrompt: enhancedPrompt,
      originalPrompt: generatedPrompt,
      bookId,
      aspectRatio: '3:2'
    };

    console.log('=== Function completed successfully ===');
    
    return new Response(
      JSON.stringify(successResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('=== Function error ===');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorResponse = { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});