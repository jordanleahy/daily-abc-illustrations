import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Create Product Description Function Started ===');
    
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    const { bookId } = await req.json();
    console.log('Request parameters:', { bookId });

    if (!bookId) {
      throw new Error('Book ID is required');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch book data
    console.log('Fetching book data for bookId:', bookId);
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('book_name, book_description, category')
      .eq('id', bookId)
      .single();

    if (bookError) {
      console.error('Error fetching book:', bookError);
      throw new Error('Failed to fetch book data');
    }

    if (!bookData) {
      throw new Error('Book not found');
    }

    console.log('Book data retrieved:', {
      name: bookData.book_name,
      category: bookData.category,
      hasDescription: !!bookData.book_description
    });

    // Helper function to try generating with Lovable AI
    const tryLovableAI = async (model: string, systemPrompt: string, userPrompt: string, attempt: number = 1, maxTokens: number = 1500) => {
      console.log(`Attempt ${attempt}: Making Lovable AI Gateway call with model ${model}, max_completion_tokens: ${maxTokens}`);
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_completion_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (response.status === 402) {
          throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
        }
        const errorData = await response.json();
        console.error(`Lovable AI Gateway error (attempt ${attempt}):`, errorData);
        throw new Error(`Lovable AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      
      // Log token usage for monitoring
      if (data.usage) {
        console.log(`Token usage (attempt ${attempt}):`, {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
          model: model
        });
      }
      
      console.log(`Lovable AI response (attempt ${attempt}):`, {
        hasChoices: !!data.choices, 
        choicesLength: data.choices?.length,
        finishReason: data.choices?.[0]?.finish_reason,
        hasContent: !!data.choices?.[0]?.message?.content,
        contentLength: data.choices?.[0]?.message?.content?.length || 0
      });

      if (!data.choices || data.choices.length === 0) {
        throw new Error(`No response generated from Lovable AI (attempt ${attempt})`);
      }

      const choice = data.choices[0];
      const content = choice.message?.content;
      
      // Log detailed response info for debugging
      console.log(`Raw content (attempt ${attempt}):`, { 
        content, 
        finishReason: choice.finish_reason,
        refusal: choice.message?.refusal || 'none'
      });

      if (!content || content.trim().length === 0) {
        console.warn(`Empty content received (attempt ${attempt}). Finish reason: ${choice.finish_reason}`);
        return null;
      }

      return content.trim();
    };

    // Simplified primary prompt - concise for token efficiency
    const primaryPrompt = `Create a product description for "${bookData.book_name}" - ${bookData.category} ABC book for toddlers (ages 1-3).

Description: ${bookData.book_description || 'Educational ABC book for children'}

Write 150 words highlighting:
- Educational benefits for toddlers
- Why parents should buy it
- Learning value and fun
- Key features

Make it compelling for parents.`;

    // Fallback prompt - simpler and safer
    const fallbackPrompt = `Write a product description for this educational ABC book for toddlers:

Title: "${bookData.book_name}"
Description: "${bookData.book_description || 'Educational ABC book for children'}"
Category: "${bookData.category || 'Early Learning'}"

Create a 150-word description that explains:
- What the book teaches
- Why it's good for toddlers (ages 1-3)
- How it helps with learning
- What makes it special

Write in a friendly, parent-focused tone.`;

    const systemPrompt = `You are an expert children's education copywriter specializing in marketing books to parents of toddlers (ages 1–3).  
Your job is to take a given TITLE and RAW DESCRIPTION of a toddler learning book and rewrite it into a polished, benefit-driven description that appeals to parents.  

OUTPUT REQUIREMENTS:  
- Start with a short, engaging headline that highlights the book's value for toddlers.  
- Clearly mention the target age range (1–3 years old) early in the description.  
- Focus on benefits for the child (letter recognition, language development, imagination, love of reading).  
- Use warm, encouraging, parent-friendly language that balances **educational value** and **emotional appeal**.  
- If relevant, include 3–4 short bullet points showing how the book supports learning.  
- End with a closing line that ties the theme of the book to a child's learning journey.  
- Keep the tone clear, inspiring, and easy to scan for online shoppers (e.g., Amazon product listings).  

Always rewrite into a version that is:  
- Parent-focused (why they should buy)  
- Child-benefit oriented (how it helps development)  
- Concise but emotionally engaging  

Do not copy text directly—restructure and reframe it to highlight what parents care about most.`;
    const fallbackSystemPrompt = 'You are a helpful writer creating educational product descriptions. Write clear, informative descriptions for parents.';

    let productDescription: string | null = null;

    try {
      // First attempt with primary model (Gemini Pro) and 1500 tokens
      productDescription = await tryLovableAI('google/gemini-2.5-pro', systemPrompt, primaryPrompt, 1, 1500);
      
      if (!productDescription) {
        console.log('Primary attempt returned empty content, trying with more tokens...');
        // Second attempt with higher token limit
        productDescription = await tryLovableAI('google/gemini-2.5-pro', systemPrompt, primaryPrompt, 2, 2500);
      }
      
      if (!productDescription) {
        console.log('Still empty, trying flash model with fallback prompt...');
        // Third attempt with flash model and simpler prompt
        productDescription = await tryLovableAI('google/gemini-2.5-flash', fallbackSystemPrompt, fallbackPrompt, 3, 2000);
      }
      
    } catch (error) {
      console.error('Gemini Pro/Flash attempts failed:', error);
      console.log('Trying final fallback with lite model...');
      
      try {
        // Final fallback with lite model
        productDescription = await tryLovableAI('google/gemini-2.5-flash-lite', fallbackSystemPrompt, fallbackPrompt, 4, 1000);
      } catch (finalError) {
        console.error('All attempts failed:', finalError);
        throw new Error('All AI generation attempts failed including final fallback');
      }
    }

    if (!productDescription || productDescription.length === 0) {
      console.error('All generation attempts returned empty content');
      return new Response(JSON.stringify({ 
        error: 'Generation failed - no content produced',
        details: 'AI model returned empty response despite successful API calls',
        bookTitle: bookData.book_name,
        debug: 'Check edge function logs for detailed response information'
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Final product description length:', productDescription.length);

    console.log('=== Function completed successfully ===');

    return new Response(JSON.stringify({ 
      productDescription,
      bookTitle: bookData.book_name,
      bookCategory: bookData.category
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-product-description function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to generate product description'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});