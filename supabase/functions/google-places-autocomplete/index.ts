import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to generate visual cues based on place types and name
function extractVisualCues(types: string[], name: string): string[] {
  const cues: string[] = [];
  
  // Type-based visual cues
  const typeVisuals: Record<string, string[]> = {
    'park': ['green spaces', 'trees', 'walking paths', 'benches'],
    'national_park': ['natural scenery', 'hiking trails', 'wildlife', 'scenic views'],
    'museum': ['grand entrance', 'classical architecture', 'exhibition halls'],
    'art_gallery': ['modern architecture', 'art displays', 'gallery lighting'],
    'church': ['steeple', 'stained glass', 'religious architecture'],
    'tourist_attraction': ['iconic landmark', 'visitors', 'photo spots'],
    'bridge': ['spanning structure', 'water views', 'architectural cables'],
    'stadium': ['large arena', 'seating tiers', 'sports field'],
    'performing_arts_theater': ['marquee', 'grand lobby', 'stage curtains'],
  };

  for (const type of types) {
    const normalized = type.toLowerCase();
    if (typeVisuals[normalized]) {
      cues.push(...typeVisuals[normalized]);
    }
  }

  // Name-based visual cues
  const nameLower = name.toLowerCase();
  if (nameLower.includes('bridge')) cues.push('bridge structure', 'spanning water');
  if (nameLower.includes('park')) cues.push('parkland', 'outdoor recreation');
  if (nameLower.includes('tower')) cues.push('tall structure', 'observation deck');
  if (nameLower.includes('statue') || nameLower.includes('monument')) cues.push('sculptural monument', 'commemorative');
  if (nameLower.includes('garden')) cues.push('landscaped gardens', 'flowers', 'manicured lawns');
  if (nameLower.includes('pier') || nameLower.includes('waterfront')) cues.push('waterfront views', 'wooden pier');
  if (nameLower.includes('square') || nameLower.includes('plaza')) cues.push('urban plaza', 'gathering space');

  // Deduplicate and limit
  return [...new Set(cues)].slice(0, 5);
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

    if (action === 'nearby') {
      const lat = url.searchParams.get('lat');
      const lng = url.searchParams.get('lng');
      const cityId = url.searchParams.get('city_id');
      
      if (!lat || !lng) {
        return new Response(
          JSON.stringify({ error: 'lat and lng required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[Nearby] Fetching landmarks near: ${lat}, ${lng}`);

      // Define place types to search for, mapped to our categories
      // Note: Google Places API (New) only supports specific types
      // See: https://developers.google.com/maps/documentation/places/web-service/place-types
      const searchConfigs = [
        { types: ['park', 'national_park', 'hiking_area'], category: 'natural' },
        { types: ['historical_landmark', 'monument', 'city_hall', 'library'], category: 'architectural' },
        { types: ['museum', 'art_gallery', 'performing_arts_theater', 'cultural_center'], category: 'cultural' },
      ];

      const allLandmarks: any[] = [];

      for (const config of searchConfigs) {
        try {
          // Use Places API (New) - Nearby Search
          const response = await fetch(
            'https://places.googleapis.com/v1/places:searchNearby',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.types,places.editorialSummary,places.rating,places.userRatingCount',
              },
              body: JSON.stringify({
                includedTypes: config.types,
                maxResultCount: 10,
                locationRestriction: {
                  circle: {
                    center: {
                      latitude: parseFloat(lat),
                      longitude: parseFloat(lng),
                    },
                    radius: 8000, // 8km radius - tighter for city-specific results
                  },
                },
                rankPreference: 'POPULARITY',
              }),
            }
          );

          const data = await response.json();

          if (data.error) {
            console.error(`[Nearby] Error for ${config.category}:`, data.error);
            continue;
          }

          const places = (data.places || []).map((place: any) => ({
            google_place_id: place.id,
            name: place.displayName?.text || '',
            description: place.editorialSummary?.text || '',
            type: place.types?.[0]?.toLowerCase().replace(/_/g, ' ') || 'landmark',
            category: config.category,
            is_major: (place.userRatingCount || 0) > 1000 || (place.rating || 0) >= 4.5,
            visual_cues: extractVisualCues(place.types || [], place.displayName?.text || ''),
            city_id: cityId,
          }));

          allLandmarks.push(...places);
          console.log(`[Nearby] Found ${places.length} ${config.category} places`);

        } catch (err) {
          console.error(`[Nearby] Error fetching ${config.category}:`, err);
        }
      }

      // Deduplicate by google_place_id
      const uniqueLandmarks = allLandmarks.filter((landmark, index, self) =>
        index === self.findIndex(l => l.google_place_id === landmark.google_place_id)
      );

      // Sort by importance (is_major first)
      uniqueLandmarks.sort((a, b) => (b.is_major ? 1 : 0) - (a.is_major ? 1 : 0));

      console.log(`[Nearby] Returning ${uniqueLandmarks.length} unique landmarks`);

      return new Response(
        JSON.stringify({ landmarks: uniqueLandmarks }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use ?action=autocomplete, ?action=details, or ?action=nearby' }),
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
