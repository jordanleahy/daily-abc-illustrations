import type { Context } from "https://edge.netlify.com";

// Crawler user agents that need server-rendered meta tags
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  'Pinterest',
  'Googlebot',
  'bingbot',
  'Applebot',
  'iMessageLinkPreview',
  'Iframely',
  'Embedly',
];

// Helper to check if request is from a crawler
function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(crawler => ua.includes(crawler.toLowerCase()));
}

// City display names and metadata
const cityData: Record<string, { name: string; description: string; ogImage?: string }> = {
  jerseycity: {
    name: 'Jersey City',
    description: 'Discover personalized ABC books featuring Jersey City landmarks, culture, and community. Educational content designed for local families.',
    ogImage: '/images/cities/jerseycity-cover.jpeg',
  },
  hoboken: {
    name: 'Hoboken',
    description: 'Explore ABC books celebrating Hoboken\'s unique character and community. Engaging educational content for local children and families.',
    ogImage: '/images/cities/hoboken-cover.jpeg',
  },
  newyork: {
    name: 'New York City',
    description: 'NYC-themed ABC books bringing the Big Apple to life for young learners. Educational adventures through iconic neighborhoods and landmarks.',
    ogImage: '/images/cities/newyork-cover.jpeg',
  },
  newyorkcity: {
    name: 'New York City',
    description: 'NYC-themed ABC books bringing the Big Apple to life for young learners. Educational adventures through iconic neighborhoods and landmarks.',
    ogImage: '/images/cities/newyork-cover.jpeg',
  },
};

export default async function handler(req: Request, context: Context) {
  const userAgent = req.headers.get('user-agent') || '';
  
  // Only intercept for crawlers
  if (!isCrawler(userAgent)) {
    return context.next();
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Extract city slug from /city/:citySlug
    if (pathParts.length < 2 || pathParts[0] !== 'city') {
      return context.next();
    }
    
    const citySlug = pathParts[1].toLowerCase();
    const city = cityData[citySlug];
    
    // Fallback for unknown cities
    const cityName = city?.name || citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
    const cityDescription = city?.description || 
      `Discover personalized ABC books for ${cityName}. Educational content designed for local families and children.`;
    
    const siteUrl = 'https://chairlifthabits.com';
    const canonicalUrl = `${siteUrl}/city/${citySlug}`;
    const ogTitle = `${cityName} ABC Books | Chairlift Habits`;
    const ogImage = city?.ogImage 
      ? `${siteUrl}${city.ogImage}`
      : `${siteUrl}/images/cities/default-cover.jpeg`;
    
    // Return HTML with meta tags for crawlers
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ogTitle}</title>
  <meta name="description" content="${cityDescription}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${cityDescription}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:site_name" content="Chairlift Habits">
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${cityDescription}">
  <meta name="twitter:image" content="${ogImage}">
  
  <!-- Canonical -->
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Redirect for crawlers that follow meta refresh -->
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}">
</head>
<body>
  <p>Redirecting to <a href="${canonicalUrl}">${cityName} ABC Books</a>...</p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('City meta edge function error:', error);
    return context.next();
  }
}
