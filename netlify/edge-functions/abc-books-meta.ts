import type { Context } from "https://edge.netlify.com";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Theme display names and descriptions
const THEME_METADATA: Record<string, { displayName: string; description: string }> = {
  animals: {
    displayName: 'Animals',
    description: 'Explore our collection of animal-themed ABC books. Fun, educational content featuring creatures from A to Z for young learners.',
  },
  dinosaurs: {
    displayName: 'Dinosaurs',
    description: 'Discover dinosaur ABC books that bring prehistoric creatures to life. Educational adventures through the age of dinosaurs.',
  },
  vehicles: {
    displayName: 'Vehicles',
    description: 'Transportation-themed ABC books featuring cars, trucks, planes, and more. Perfect for kids who love things that go!',
  },
  space: {
    displayName: 'Space',
    description: 'Journey through the cosmos with space-themed ABC books. Rockets, planets, and stars for curious young astronomers.',
  },
  nature: {
    displayName: 'Nature',
    description: 'Nature-themed ABC books celebrating the outdoors. Plants, seasons, and natural wonders from A to Z.',
  },
  fantasy: {
    displayName: 'Fantasy',
    description: 'Magical ABC books filled with fantasy creatures and enchanted worlds. Spark imagination with every letter.',
  },
  sports: {
    displayName: 'Sports',
    description: 'Active ABC books featuring sports and athletics. Get kids moving and learning with athletic adventures.',
  },
  music: {
    displayName: 'Music',
    description: 'Musical ABC books introducing instruments, notes, and rhythm. A symphony of learning from A to Z.',
  },
  food: {
    displayName: 'Food',
    description: 'Delicious ABC books featuring fruits, vegetables, and treats. Tasty learning adventures for hungry minds.',
  },
  ocean: {
    displayName: 'Ocean',
    description: 'Dive into ocean-themed ABC books. Explore sea creatures and underwater wonders from A to Z.',
  },
};

// Default metadata for the main ABC books page
const DEFAULT_METADATA = {
  displayName: 'ABC Books',
  description: 'Explore our collection of themed ABC books for children. Educational, illustrated content designed to make learning fun for kids of all ages.',
};

async function getThemeFromDatabase(
  supabase: ReturnType<typeof createClient>,
  themeSlug: string
): Promise<{ displayName: string; description: string } | null> {
  try {
    const { data, error } = await supabase
      .from('character_themes')
      .select('display_name, alt_text')
      .eq('id', themeSlug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      displayName: data.display_name,
      description: data.alt_text || `Explore our collection of ${data.display_name} ABC books. Educational content for young learners.`,
    };
  } catch {
    return null;
  }
}

async function getFirstBookImage(
  supabase: ReturnType<typeof createClient>,
  themeSlug?: string
): Promise<string | null> {
  try {
    // Get a published book with this theme to use as OG image
    let query = supabase
      .from('daily_published')
      .select(`
        id,
        book_id,
        books!inner(metadata)
      `)
      .eq('status', 'active')
      .eq('is_publicly_visible', true)
      .eq('books.metadata->>bookType', 'abc');

    if (themeSlug) {
      query = query.eq('books.metadata->>characterTheme', themeSlug);
    }

    const { data: publishedBooks } = await query.limit(1);

    if (!publishedBooks?.length) {
      return null;
    }

    // Get the cover image for this book
    const bookId = publishedBooks[0].book_id;
    const { data: seoData } = await supabase
      .from('seo_metadata')
      .select('og_image_url')
      .eq('book_id', bookId)
      .eq('is_latest', true)
      .eq('is_active', true)
      .single();

    return seoData?.og_image_url || null;
  } catch {
    return null;
  }
}

export default async function handler(req: Request, context: Context) {
  const userAgent = req.headers.get('user-agent') || '';
  
  // Only intercept for crawlers
  if (!isCrawler(userAgent)) {
    return context.next();
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Extract theme slug from /abc-books/:theme?
    if (pathParts[0] !== 'abc-books') {
      return context.next();
    }
    
    const themeSlug = pathParts[1]?.toLowerCase();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    let metadata = DEFAULT_METADATA;
    
    if (themeSlug) {
      // Try to get theme from hardcoded list first, then database
      const hardcodedTheme = THEME_METADATA[themeSlug];
      if (hardcodedTheme) {
        metadata = hardcodedTheme;
      } else {
        const dbTheme = await getThemeFromDatabase(supabase, themeSlug);
        if (dbTheme) {
          metadata = dbTheme;
        } else {
          // Fallback: capitalize the slug
          metadata = {
            displayName: themeSlug.charAt(0).toUpperCase() + themeSlug.slice(1),
            description: `Explore our collection of ${themeSlug} ABC books. Educational content for young learners.`,
          };
        }
      }
    }
    
    // Try to get a representative image
    const bookImage = await getFirstBookImage(supabase, themeSlug);
    
    const siteUrl = 'https://chairlifthabits.com';
    const canonicalUrl = themeSlug 
      ? `${siteUrl}/abc-books/${themeSlug}`
      : `${siteUrl}/abc-books`;
    
    const ogTitle = themeSlug
      ? `${metadata.displayName} ABC Books | Daily ABC Illustrations`
      : 'ABC Books Collection | Daily ABC Illustrations';
    
    const ogDescription = metadata.description;
    
    // Use book image if available, otherwise use a default
    const ogImage = bookImage || `${siteUrl}/og-image.png`;
    
    // Return HTML with meta tags for crawlers
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ogTitle}</title>
  <meta name="description" content="${ogDescription}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDescription}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Daily ABC Illustrations">
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${ogDescription}">
  <meta name="twitter:image" content="${ogImage}">
  
  <!-- Canonical -->
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Redirect for crawlers that follow meta refresh -->
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}">
</head>
<body>
  <p>Redirecting to <a href="${canonicalUrl}">${ogTitle}</a>...</p>
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
    console.error('ABC books meta edge function error:', error);
    return context.next();
  }
}
