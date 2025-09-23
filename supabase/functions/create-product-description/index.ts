import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Create Product Description Function Started ===');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
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

    // Create sales-focused prompt for toddler audience
    const prompt = `Create a compelling product description for this children's ABC book that will drive sales. 

Book Title: "${bookData.book_name}"
Book Description: "${bookData.book_description || 'Educational ABC book for children'}"
Category: "${bookData.category || 'Early Learning'}"

TARGET AUDIENCE: Parents of toddlers (ages 1-3)

REQUIREMENTS:
- Sales-focused and persuasive tone
- Emphasize immediate benefits for toddlers
- Include urgency elements ("get today", "limited time", etc.)
- Highlight educational value and development benefits
- Use emotional appeal to parents
- Include key benefits and features
- Add a strong call-to-action
- Keep it under 200 words
- Make it engaging and easy to read

Focus on how this book will help toddlers learn, grow, and have fun while developing essential early literacy skills. Make parents feel this is a must-have educational tool they should get today.`;

    console.log('Making OpenAI API call with sales-focused prompt');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'system',
            content: 'You are a expert copywriter specializing in children\'s educational products. Create compelling, sales-driven product descriptions that convert browsers into buyers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received:', { hasChoices: !!data.choices, choicesLength: data.choices?.length });

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response generated from OpenAI');
    }

    const productDescription = data.choices[0].message.content.trim();
    console.log('Generated product description length:', productDescription.length);

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
      error: error.message,
      details: 'Failed to generate product description'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});