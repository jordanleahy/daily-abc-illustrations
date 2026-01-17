import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const apiKey = Deno.env.get('GOOGLE_API_KEY');

    if (!apiKey) {
      console.error('GOOGLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'autocomplete') {
      const input = url.searchParams.get('input');
      
      if (!input || input.length < 2) {
        return new Response(
          JSON.stringify({ predictions: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[Autocomplete] Searching for: ${input}`);

      // Use Places API (New) - Autocomplete endpoint
      const response = await fetch(
        'https://places.googleapis.com/v1/places:autocomplete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
          },
          body: JSON.stringify({
            input: input,
            includedPrimaryTypes: ['locality', 'administrative_area_level_3'],
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        console.error('[Autocomplete] Google API error:', data.error);
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

      console.log(`[Autocomplete] Found ${predictions.length} results`);

      return new Response(
        JSON.stringify({ predictions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'details') {
      const placeId = url.searchParams.get('place_id');
      
      if (!placeId) {
        return new Response(
          JSON.stringify({ error: 'place_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[Details] Fetching details for place_id: ${placeId}`);

      // Use Places API (New) - Place Details endpoint
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}?languageCode=en`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents',
          },
        }
      );

      const data = await response.json();

      if (data.error) {
        console.error('[Details] Google API error:', data.error);
        return new Response(
          JSON.stringify({ error: data.error.message || 'API error' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract city, state, country from addressComponents
      let city = data.displayName?.text || '';
      let state = '';
      let country = '';

      for (const component of data.addressComponents || []) {
        const types = component.types || [];
        if (types.includes('locality')) {
          city = component.longText || city;
        }
        if (types.includes('administrative_area_level_1')) {
          state = component.shortText || ''; // Use shortText for states (e.g., "NJ")
        }
        if (types.includes('country')) {
          country = component.longText || '';
        }
      }

      const details = {
        place_id: data.id || placeId,
        name: city,
        formatted_address: data.formattedAddress || '',
        latitude: data.location?.latitude,
        longitude: data.location?.longitude,
        city,
        state,
        country,
      };

      console.log(`[Details] Parsed city data:`, details);

      return new Response(
        JSON.stringify({ details }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use ?action=autocomplete or ?action=details' }),
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
