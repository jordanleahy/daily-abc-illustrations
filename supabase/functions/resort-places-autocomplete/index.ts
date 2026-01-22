import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI enrichment prompt template for ski resorts
function buildEnrichmentPrompt(resortName: string, state: string, country: string): string {
  return `You are a ski resort expert. Provide detailed information about "${resortName}" ski resort in ${state}, ${country}.

Return ONLY a valid JSON object with these fields (no markdown, no explanation):
{
  "terrain": "Brief description of terrain type (e.g., 'Legendary back bowls, groomed corduroy runs, and challenging chutes')",
  "difficulty_levels": ["array of difficulty levels available, e.g., 'Beginner', 'Intermediate', 'Advanced', 'Expert'"],
  "signature_runs": ["array of 3-5 famous runs or areas, e.g., 'Back Bowls', 'Blue Sky Basin'"],
  "atmosphere": "2-3 sentence description of the resort's vibe and character for AI illustration generation (e.g., 'European-inspired alpine village with upscale lodges and a sophisticated après-ski scene. Snow-covered peaks frame charming cobblestone streets lined with boutique shops.')",
  "color_palette": "Suggested color palette for illustrations (e.g., 'Deep forest greens, pristine white snow, warm amber lodge lighting, and crisp blue skies')"
}

If you don't have specific information about this resort, provide reasonable general ski resort attributes based on the location.`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!googleApiKey) {
      console.error('GOOGLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: Autocomplete search for ski resorts
    if (action === 'autocomplete') {
      const input = url.searchParams.get('input');
      
      if (!input || input.length < 2) {
        return new Response(
          JSON.stringify({ predictions: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[Resort Autocomplete] Searching for: ${input}`);

      // Search for ski resorts specifically using Google Places API
      const response = await fetch(
        'https://places.googleapis.com/v1/places:autocomplete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': googleApiKey,
          },
          body: JSON.stringify({
            input: `${input} ski resort`,
            includedPrimaryTypes: ['ski_resort', 'tourist_attraction', 'point_of_interest'],
            regionCode: 'US', // Prioritize US results
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        console.error('[Resort Autocomplete] Google API error:', data.error);
        return new Response(
          JSON.stringify({ error: data.error.message || 'API error' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const predictions = (data.suggestions || []).map((s: any) => ({
        place_id: s.placePrediction?.placeId || '',
        description: s.placePrediction?.text?.text || '',
        main_text: s.placePrediction?.structuredFormat?.mainText?.text || '',
        secondary_text: s.placePrediction?.structuredFormat?.secondaryText?.text || '',
      })).filter((p: any) => p.place_id);

      console.log(`[Resort Autocomplete] Found ${predictions.length} results`);

      return new Response(
        JSON.stringify({ predictions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: Get place details for a ski resort
    if (action === 'details') {
      const placeId = url.searchParams.get('place_id');
      
      if (!placeId) {
        return new Response(
          JSON.stringify({ error: 'place_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[Resort Details] Fetching details for place_id: ${placeId}`);

      const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}?languageCode=en`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': googleApiKey,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents',
          },
        }
      );

      const data = await response.json();

      if (data.error) {
        console.error('[Resort Details] Google API error:', data.error);
        return new Response(
          JSON.stringify({ error: data.error.message || 'API error' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract location details
      let name = data.displayName?.text || '';
      let state = '';
      let country = '';

      for (const component of data.addressComponents || []) {
        const types = component.types || [];
        if (types.includes('administrative_area_level_1')) {
          state = component.longText || '';
        }
        if (types.includes('country')) {
          country = component.longText || '';
        }
      }

      // Clean up resort name (remove "Ski Resort" suffix if present)
      name = name.replace(/\s*ski\s*resort\s*$/i, '').trim();

      const details = {
        place_id: data.id || placeId,
        name,
        formatted_address: data.formattedAddress || '',
        latitude: data.location?.latitude,
        longitude: data.location?.longitude,
        state,
        country,
        location: state ? `${name}, ${state}` : name,
      };

      console.log(`[Resort Details] Parsed resort data:`, details);

      return new Response(
        JSON.stringify({ details }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: AI enrichment for ski resort metadata
    if (action === 'enrich') {
      if (!openaiApiKey) {
        console.error('OPENAI_API_KEY not configured');
        return new Response(
          JSON.stringify({ error: 'OpenAI API key not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const resortName = url.searchParams.get('name');
      const state = url.searchParams.get('state') || '';
      const country = url.searchParams.get('country') || 'USA';

      if (!resortName) {
        return new Response(
          JSON.stringify({ error: 'Resort name required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[Resort Enrich] Generating AI metadata for: ${resortName}, ${state}, ${country}`);

      const prompt = buildEnrichmentPrompt(resortName, state, country);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that provides ski resort information in JSON format only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error('[Resort Enrich] OpenAI API error:', data.error);
        return new Response(
          JSON.stringify({ error: data.error.message || 'AI enrichment failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const aiContent = data.choices?.[0]?.message?.content || '';
      
      // Parse the JSON response
      let enrichedData;
      try {
        // Try to extract JSON from the response (handle potential markdown wrapping)
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          enrichedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('[Resort Enrich] Failed to parse AI response:', aiContent);
        // Return defaults if parsing fails
        enrichedData = {
          terrain: 'Varied terrain with groomed runs and natural features',
          difficulty_levels: ['Beginner', 'Intermediate', 'Advanced'],
          signature_runs: [],
          atmosphere: 'Mountain resort with stunning alpine views and welcoming ski village atmosphere.',
          color_palette: 'White snow, evergreen forest, blue sky',
        };
      }

      console.log(`[Resort Enrich] Generated metadata:`, enrichedData);

      return new Response(
        JSON.stringify({ enrichment: enrichedData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use ?action=autocomplete, ?action=details, or ?action=enrich' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Error]', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
