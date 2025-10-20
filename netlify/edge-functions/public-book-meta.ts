import type { Context } from "https://edge.netlify.com";

const SUPABASE_URL = "https://foxdnspwzhjxjxuicute.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI";

const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  'bingbot',
  'Googlebot',
  'Google-InspectionTool',
];

function isCrawler(userAgent: string): boolean {
  return CRAWLER_USER_AGENTS.some(bot => 
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  
  // Only intercept for crawlers
  if (!isCrawler(userAgent)) {
    return context.next();
  }

  // Extract slug from URL: /book/:slug
  const slugMatch = url.pathname.match(/\/book\/([^\/]+)/);
  if (!slugMatch) {
    return context.next();
  }

  const slug = slugMatch[1];

  try {
    // Fetch daily_published data by slug
    const dpResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_published?slug=eq.${encodeURIComponent(slug)}&is_publicly_visible=eq.true&status=in.(active,queued,expired)&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!dpResponse.ok) {
      console.error('Failed to fetch daily_published:', await dpResponse.text());
      return context.next();
    }

    const dpData = await dpResponse.json();
    if (!dpData || dpData.length === 0) {
      return context.next();
    }

    const dailyPublished = dpData[0];

    // Fetch SEO metadata by daily_published_id
    const seoResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/seo_metadata?daily_published_id=eq.${dailyPublished.id}&is_latest=eq.true&optimization_status=eq.complete&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    let seoMetadata = null;
    if (seoResponse.ok) {
      const seoData = await seoResponse.json();
      if (seoData && seoData.length > 0) {
        seoMetadata = seoData[0];
      }
    }

    // If no SEO metadata by daily_published_id, try by book_id
    if (!seoMetadata && dailyPublished.book_id) {
      const seoByBookResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/seo_metadata?source_data->>book_id=eq.${dailyPublished.book_id}&is_latest=eq.true&optimization_status=eq.complete&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (seoByBookResponse.ok) {
        const seoData = await seoByBookResponse.json();
        if (seoData && seoData.length > 0) {
          seoMetadata = seoData[0];
        }
      }
    }

    // Prepare metadata values
    const title = seoMetadata?.seo_title || dailyPublished.title || 'Daily ABC Illustrations';
    const description = seoMetadata?.seo_description || dailyPublished.description || 'Explore educational ABC illustrations';
    const imageUrl = seoMetadata?.og_image_url || `${SUPABASE_URL}/storage/v1/object/public/page-images/default-book-cover.jpg`;
    const canonicalUrl = `https://dailyabcillustrations.com/book/${slug}`;

    // Generate HTML with OpenGraph tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <!-- OpenGraph Meta Tags -->
  <meta property="og:type" content="book">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="Daily ABC Illustrations">
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Redirect for crawlers (optional) -->
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}">
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <a href="${canonicalUrl}">View Full Book</a>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });

  } catch (error) {
    console.error('Error in public-book-meta edge function:', error);
    return context.next();
  }
};
