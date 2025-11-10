import type { Context } from "https://edge.netlify.com/";

/**
 * Edge function to inject critical image preload for LCP optimization
 * This makes the largest contentful paint image discoverable in initial HTML
 */
export default async (request: Request, context: Context) => {
  const response = await context.next();
  const page = await response.text();

  try {
    // Fetch landing page data to get the active daily published image
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[Landing Preload] Missing Supabase credentials');
      return new Response(page, response);
    }

    // Call the edge function to get landing page data
    const dataResponse = await fetch(`${supabaseUrl}/functions/v1/get-landing-page-data`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!dataResponse.ok) {
      console.error('[Landing Preload] Failed to fetch landing data');
      return new Response(page, response);
    }

    const data = await dataResponse.json();
    
    // Extract the first page image from active daily published (LCP element)
    const dailyPublished = data?.dailyPublished;
    const firstPageImage = dailyPublished?.pages?.[0]?.image_url;

    if (!firstPageImage) {
      console.log('[Landing Preload] No LCP image found');
      return new Response(page, response);
    }

    // Add optimization parameters for the preload
    const optimizedImageUrl = `${firstPageImage}?width=800&quality=85&format=webp`;

    // Create preload link tag
    const preloadLink = `
    <link rel="preload" as="image" href="${optimizedImageUrl}" fetchpriority="high" />
    <link rel="preconnect" href="https://foxdnspwzhjxjxuicute.supabase.co" />`;

    // Inject preload link before closing head tag
    const modifiedPage = page.replace('</head>', `${preloadLink}\n  </head>`);

    return new Response(modifiedPage, {
      ...response,
      headers: {
        ...Object.fromEntries(response.headers),
        'content-type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('[Landing Preload] Error:', error);
    return new Response(page, response);
  }
};

export const config = {
  path: "/",
};
