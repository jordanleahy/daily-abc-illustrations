import { Context } from "https://edge.netlify.com/";

const SUPABASE_URL = "https://foxdnspwzhjxjxuicute.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI";

interface DailyPublished {
  id: string;
  title: string;
  description: string | null;
  book_id: string;
  expires_at: string;
  is_active: boolean;
}

interface SEOMetadata {
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
}

interface BookThumbnail {
  thumbnail_url: string;
}

/**
 * Check if the request comes from a social media crawler
 */
function isSocialCrawler(userAgent: string): boolean {
  const crawlers = [
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'TelegramBot',
    'SkypeUriPreview',
    'SlackBot',
    'DiscordBot',
    'ia_archiver'
  ];
  
  return crawlers.some(crawler => 
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

/**
 * Fetch daily published data from Supabase
 */
async function fetchDailyPublishedData(dailyId: string) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_published?select=*&id=eq.${dailyId}&status=in.(active,queued,expired)`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data[0] as DailyPublished | null;
  } catch (error) {
    console.error('Error fetching daily published data:', error);
    return null;
  }
}

/**
 * Fetch SEO metadata from Supabase
 */
async function fetchSEOMetadata(dailyId: string) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/seo_metadata?select=*&daily_published_id=eq.${dailyId}&is_latest=eq.true&is_active=eq.true&optimization_status=eq.complete`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data[0] as SEOMetadata | null;
  } catch (error) {
    console.error('Error fetching SEO metadata:', error);
    return null;
  }
}

/**
 * Fetch book thumbnail from Supabase
 */
async function fetchBookThumbnail(bookId: string) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/book_thumbnails?select=thumbnail_url&book_id=eq.${bookId}&is_latest=eq.true&generation_status=eq.complete`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data[0] as BookThumbnail | null;
  } catch (error) {
    console.error('Error fetching book thumbnail:', error);
    return null;
  }
}

/**
 * Generate prerendered HTML with meta tags
 */
function generatePrerenderedHTML(
  dailyData: DailyPublished,
  seoData: SEOMetadata | null,
  thumbnail: BookThumbnail | null
) {
  // Use SEO optimized data if available, otherwise fallback to daily published data
  const title = seoData?.seo_title || dailyData.title || 'ABC Cards - Daily Published Content';
  const description = seoData?.seo_description || dailyData.description || 'Explore our daily published ABC content for children.';
  const imageUrl = seoData?.og_image_url || thumbnail?.thumbnail_url || '/placeholder.svg';
  const canonicalUrl = `https://abc-cards.lovableproject.com/daily-published/${dailyData.id}`;
  
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonicalUrl}" />
    
    <!-- OpenGraph Meta Tags -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="ABC Cards" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #f8fafc;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        color: #334155;
      }
      
      .container {
        text-align: center;
        max-width: 600px;
        padding: 2rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .loading {
        color: #64748b;
        font-size: 1.1rem;
        margin-bottom: 1rem;
      }
      
      .title {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 1rem;
        color: #1e293b;
      }
      
      .description {
        font-size: 1.1rem;
        line-height: 1.6;
        color: #475569;
        margin-bottom: 2rem;
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e2e8f0;
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="spinner"></div>
      <div class="loading">Loading content...</div>
      <h1 class="title">${title}</h1>
      <p class="description">${description}</p>
    </div>
    
    <script>
      // Redirect to the React app after a short delay
      // This ensures crawlers get the meta tags while users get the full app
      setTimeout(() => {
        window.location.href = '/daily-published/${dailyData.id}';
      }, 100);
    </script>
  </body>
</html>`;
}

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || '';
  
  // Extract daily published ID from URL
  const match = url.pathname.match(/\/daily-published\/([^\/]+)/);
  if (!match) {
    return context.next();
  }
  
  const dailyId = match[1];
  
  // Only serve prerendered content to social crawlers
  if (!isSocialCrawler(userAgent)) {
    return context.next();
  }
  
  console.log(`Social crawler detected: ${userAgent}, serving prerendered content for ${dailyId}`);
  
  try {
    // Fetch all required data in parallel
    const [dailyData, seoData] = await Promise.all([
      fetchDailyPublishedData(dailyId),
      fetchSEOMetadata(dailyId)
    ]);
    
    if (!dailyData) {
      console.log(`Daily published content not found or is in draft status: ${dailyId}`);
      return context.next();
    }
    
    // Fetch book thumbnail if we don't have SEO image
    const thumbnail = !seoData?.og_image_url ? 
      await fetchBookThumbnail(dailyData.book_id) : null;
    
    // Generate and return prerendered HTML
    const html = generatePrerenderedHTML(dailyData, seoData, thumbnail);
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
    
  } catch (error) {
    console.error('Error in daily-published-meta edge function:', error);
    return context.next();
  }
}

export const config = {
  path: "/daily-published/*",
};