import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

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

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${apiKey}`
      );

      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('[Autocomplete] Google API error:', data.status, data.error_message);
        return new Response(
          JSON.stringify({ error: data.error_message || data.status }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const predictions = (data.predictions || []).map((p: PlacePrediction) => ({
        place_id: p.place_id,
        description: p.description,
        main_text: p.structured_formatting?.main_text || p.description,
        secondary_text: p.structured_formatting?.secondary_text || '',
      }));

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

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry,address_components&key=${apiKey}`
      );

      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('[Details] Google API error:', data.status, data.error_message);
        return new Response(
          JSON.stringify({ error: data.error_message || data.status }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = data.result as PlaceDetails;
      
      // Extract city, state, country from address_components
      let city = result.name;
      let state = '';
      let country = '';

      for (const component of result.address_components || []) {
        if (component.types.includes('locality')) {
          city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name; // Use short_name for states (e.g., "NJ" instead of "New Jersey")
        }
        if (component.types.includes('country')) {
          country = component.long_name;
        }
      }

      const details = {
        place_id: result.place_id,
        name: city,
        formatted_address: result.formatted_address,
        latitude: result.geometry?.location?.lat,
        longitude: result.geometry?.location?.lng,
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
