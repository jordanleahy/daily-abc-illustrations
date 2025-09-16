import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizationRequest {
  contentTitle: string;
  bookDescription?: string;
  category?: string;
  timeRemaining?: string;
  currentPage?: number;
  totalPages?: number;
}

interface OptimizationResponse {
  optimizedTitle: string;
  optimizedDescription: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { contentTitle, bookDescription, category, timeRemaining, currentPage, totalPages }: OptimizationRequest = await req.json();

    console.log('Optimizing OpenGraph for:', { contentTitle, category, timeRemaining });

    // Build context for the AI
    let context = `Content: "${contentTitle}"`;
    if (bookDescription) {
      context += `\nBook Description: "${bookDescription}"`;
    }
    if (category) {
      context += `\nCategory: ${category}`;
    }
    if (currentPage && totalPages) {
      context += `\nPage: ${currentPage} of ${totalPages}`;
    }
    if (timeRemaining) {
      context += `\nTime Remaining: ${timeRemaining}`;
    }

    const prompt = `${context}

Create an SEO-optimized title and description for this educational children's content:

Requirements:
- Title: Maximum 60 characters, engaging and click-worthy
- Description: Maximum 160 characters, compelling and informative
- Focus on educational value and child appeal
- Include urgency if time-limited
- Use emojis sparingly but effectively
- Make parents want to click for their kids

Return only JSON format:
{
  "title": "optimized title here",
  "description": "optimized description here"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a SEO specialist.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    console.log('AI Response:', aiResponse);

    // Parse the JSON response
    const parsed = JSON.parse(aiResponse);
    
    const result: OptimizationResponse = {
      optimizedTitle: parsed.title,
      optimizedDescription: parsed.description,
    };

    console.log('Optimization result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in optimize-opengraph function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      optimizedTitle: null,
      optimizedDescription: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});