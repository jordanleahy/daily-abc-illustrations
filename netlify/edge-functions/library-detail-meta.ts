import { Context } from "https://edge.netlify.com";

// Data structures
interface DailyPublished {
  id: string;
  title: string;
  description: string | null;
  book_id: string;
  status: string;
  is_active: boolean;
  expires_at: string | null;
}

interface SEOMetadata {
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  daily_published_id: string | null;
  book_id: string | null;
}

// Supabase configuration
const SUPABASE_URL = "https://foxdnspwzhjxjxuicute.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI";

/**
 * Check if the request is from a social media crawler
 */
function isSocialCrawler(userAgent: string): boolean {
  const crawlers = [
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'TelegramBot',
    'Slackbot',
    'Discordbot',
    'Pinterest',
    'redditbot',
  ];
  
  return crawlers.some(crawler => 
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

/**
 * Fetch daily published data from Supabase
 */
async function fetchDailyPublishedData(dailyId: string): Promise<DailyPublished | null> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_published?id=eq.${dailyId}&select=id,title,description,book_id,status,is_active,expires_at`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch daily published data:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data?.[0] || null;
  } catch (error) {
    console.error('Error fetching daily published data:', error);
    return null;
  }
}

/**
 * Fetch SEO metadata from Supabase
 */
async function fetchSEOMetadata(dailyId: string): Promise<SEOMetadata | null> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/seo_metadata?daily_published_id=eq.${dailyId}&is_latest=eq.true&is_active=eq.true&optimization_status=eq.complete&select=seo_title,seo_description,og_image_url,daily_published_id,book_id`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch SEO metadata:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data?.[0] || null;
  } catch (error) {
    console.error('Error fetching SEO metadata:', error);
    return null;
  }
}

/**
 * Fetch SEO metadata by book_id as fallback
 */
async function fetchSEOMetadataByBook(bookId: string): Promise<SEOMetadata | null> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/seo_metadata?book_id=eq.${bookId}&is_latest=eq.true&is_active=eq.true&optimization_status=eq.complete&select=seo_title,seo_description,og_image_url,daily_published_id,book_id`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.[0] || null;
  } catch (error) {
    console.error('Error fetching SEO metadata by book:', error);
    return null;
  }
}

/**
 * Generate prerendered HTML with meta tags
 */
function generatePrerenderedHTML(
  dailyPublished: DailyPublished,
  seoMetadata: SEOMetadata | null,
  dailyId: string
): string {
  // Priority: SEO metadata > daily_published data
  const title = seoMetadata?.seo_title || dailyPublished.title;
  const description = seoMetadata?.seo_description || dailyPublished.description || 'Daily ABC Illustrations';
  const imageUrl = seoMetadata?.og_image_url || '';
  const pageUrl = `https://dailyabcillustrations.com/library/${dailyId}/detail`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <!-- OpenGraph Tags -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  ${imageUrl ? `<meta property="og:image" content="${imageUrl}">` : ''}
  ${imageUrl ? `<meta property="og:image:secure_url" content="${imageUrl}">` : ''}
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Daily ABC Illustrations">
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${pageUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}">` : ''}
  
  <!-- Redirect Script for Real Users -->
  <script>
    // Only redirect if not a crawler
    if (!/bot|crawler|spider|crawling/i.test(navigator.userAgent)) {
      window.location.href = "${pageUrl}";
    }
  </script>
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #1a1a1a; }
    p { color: #666; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  ${imageUrl ? `<img src="${imageUrl}" alt="${title}">` : ''}
  <p>Loading interactive content...</p>
</body>
</html>`;
}

/**
 * Main edge function handler
 */
export default async function handler(request: Request, context: Context) {
  const userAgent = request.headers.get('user-agent') || '';
  
  // Only intercept requests from social media crawlers
  if (!isSocialCrawler(userAgent)) {
    return context.next();
  }

  try {
    // Extract daily_published ID from URL: /library/:id/detail
    const url = new URL(request.url);
    const pathMatch = url.pathname.match(/\/library\/([^\/]+)\/detail/);
    
    if (!pathMatch || !pathMatch[1]) {
      return context.next();
    }

    const dailyId = pathMatch[1];

    // Fetch data in parallel
    const [dailyPublished, seoMetadata] = await Promise.all([
      fetchDailyPublishedData(dailyId),
      fetchSEOMetadata(dailyId),
    ]);

    // Validate that content exists and is public
    if (!dailyPublished) {
      return context.next();
    }

    // Only serve active, queued, or expired content
    if (!['active', 'queued', 'expired'].includes(dailyPublished.status)) {
      return context.next();
    }

    // Try to get SEO metadata by book_id as fallback
    let finalSeoMetadata = seoMetadata;
    if (!seoMetadata && dailyPublished.book_id) {
      finalSeoMetadata = await fetchSEOMetadataByBook(dailyPublished.book_id);
    }

    // Generate and return prerendered HTML
    const html = generatePrerenderedHTML(
      dailyPublished,
      finalSeoMetadata,
      dailyId
    );

    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'cache-control': 'public, max-age=300', // 5 minutes
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return context.next();
  }
}

export const config = {
  path: "/library/*/detail",
};
