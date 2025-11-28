import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'LOVABLE_API_KEY not configured' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('🧪 Testing Lovable AI Gateway embeddings endpoint...');

    // Test 1: Try /v1/embeddings endpoint
    const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: 'This is a test sentence for embeddings.',
        model: 'text-embedding-3-small', // Try OpenAI format first
      }),
    });

    const responseText = await embeddingResponse.text();
    console.log('Response status:', embeddingResponse.status);
    console.log('Response body:', responseText);

    if (embeddingResponse.ok) {
      const data = JSON.parse(responseText);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: '✅ Lovable AI Gateway supports embeddings!',
          model: 'text-embedding-3-small',
          dimensions: data.data?.[0]?.embedding?.length || 'unknown',
          sample: data.data?.[0]?.embedding?.slice(0, 5) || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: '❌ Embeddings endpoint not supported or different format required',
          status: embeddingResponse.status,
          response: responseText,
          suggestion: 'Will need to use OpenAI API directly with OPENAI_API_KEY'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Test error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
