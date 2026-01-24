import type { Context } from "https://edge.netlify.com";

// Supabase configuration
const SUPABASE_URL = "https://foxdnspwzhjxjxuicute.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI";

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

// Fallback metadata for book types (used if DB doesn't have SEO data)
const BOOK_TYPE_FALLBACK: Record<string, { label: string; description: string }> = {
  abc: {
    label: 'ABC Books',
    description: 'Explore our collection of themed ABC books for children. Educational, illustrated content designed to make learning fun for kids of all ages.',
  },
  opposites: {
    label: 'Opposites Books',
    description: 'Learn about opposites with our illustrated books. Big and small, hot and cold - discover contrasting concepts through engaging visuals.',
  },
  rhyming: {
    label: 'Rhyming Books',
    description: 'Fun rhyming books that help develop phonemic awareness. Engaging stories with rhythmic patterns for early readers.',
  },
  numbers: {
    label: 'Numbers Books',
    description: 'Count along with our numbers books. Learn 1-10, 1-20, and beyond with colorful illustrations and fun activities.',
  },
  shapes: {
    label: 'Shapes Books',
    description: 'Discover geometric shapes through engaging illustrated books. Circles, squares, triangles, and more for young learners.',
  },
  colors: {
    label: 'Colors Books',
    description: 'Explore the world of colors with vibrant illustrated books. Learn color names and recognition through fun activities.',
  },
  emotions: {
    label: 'Emotions Books',
    description: 'Help children understand and express emotions. Social-emotional learning through relatable illustrated stories.',
  },
  animals: {
    label: 'Animals Books',
    description: 'Discover the animal kingdom through illustrated books. Learn about creatures big and small from around the world.',
  },
  bedtime: {
    label: 'Bedtime Books',
    description: 'Soothing bedtime stories to help children wind down. Calming illustrations and gentle narratives for sweet dreams.',
  },
  cvc: {
    label: 'CVC Words Books',
    description: 'Build reading skills with CVC word books. Consonant-vowel-consonant patterns for beginning readers.',
  },
  'sight-words': {
    label: 'Sight Words Books',
    description: 'Master essential sight words with our illustrated books. High-frequency words for fluent reading development.',
  },
  digraphs: {
    label: 'Digraphs Books',
    description: 'Learn digraphs like ch, sh, th, and wh. Phonics-focused books for developing reading skills.',
  },
  'first-words': {
    label: 'First Words Books',
    description: 'Introduce vocabulary with first words books. Essential words for toddlers and early language learners.',
  },
};

// Default metadata when no specific book type
const DEFAULT_METADATA = {
  label: 'Book Collection',
  description: 'Explore our collection of educational books for children. Illustrated content designed to make learning fun.',
};

interface BookTypeMetadata {
  label: string;
  description: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
}

async function getBookTypeFromDatabase(bookTypeId: string): Promise<BookTypeMetadata | null> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/book_types?id=eq.${encodeURIComponent(bookTypeId)}&is_active=eq.true&select=label,description,seo_title,seo_description,og_image_url`,
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
    if (!data || data.length === 0) {
      return null;
    }

    const bookType = data[0];
    return {
      label: bookType.label,
      description: bookType.description || '',
      seoTitle: bookType.seo_title,
      seoDescription: bookType.seo_description,
      ogImageUrl: bookType.og_image_url,
    };
  } catch {
    return null;
  }
}

async function getBookTypeImage(bookTypeId: string): Promise<string | null> {
  try {
    // Get a published book with this book type to use as OG image
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_published?select=id,book_id,books!inner(metadata)&status=eq.active&is_publicly_visible=eq.true&books.metadata->>bookType=eq.${encodeURIComponent(bookTypeId)}&limit=1`,
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

    const publishedBooks = await response.json();
    if (!publishedBooks?.length) {
      return null;
    }

    // Get the OG image for this book from seo_metadata
    const bookId = publishedBooks[0].book_id;
    const seoResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/seo_metadata?book_id=eq.${bookId}&is_latest=eq.true&is_active=eq.true&select=og_image_url`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!seoResponse.ok) {
      return null;
    }

    const seoData = await seoResponse.json();
    return seoData?.[0]?.og_image_url || null;
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
    
    // Extract book type from /abc-books or similar paths
    // For now, this handles /abc-books which maps to book type "abc"
    if (pathParts[0] !== 'abc-books') {
      return context.next();
    }
    
    // The route is /abc-books - this is for the "abc" book type
    const bookTypeId = 'abc';
    
    // Try to get book type metadata from database
    const dbBookType = await getBookTypeFromDatabase(bookTypeId);
    
    // Build metadata with priority: DB SEO fields > DB description > fallback
    const fallback = BOOK_TYPE_FALLBACK[bookTypeId] || DEFAULT_METADATA;
    
    const displayName = dbBookType?.label || fallback.label;
    const description = dbBookType?.seoDescription || dbBookType?.description || fallback.description;
    
    // Get OG image - prefer db og_image_url, then try to find a book image
    let ogImage = dbBookType?.ogImageUrl || null;
    if (!ogImage) {
      ogImage = await getBookTypeImage(bookTypeId);
    }
    
    const siteUrl = 'https://dailyabcillustrations.com';
    const canonicalUrl = `${siteUrl}/abc-books`;
    
    // Use SEO title from DB if available, otherwise construct one
    const ogTitle = dbBookType?.seoTitle || `${displayName} | Daily ABC Illustrations`;
    const ogDescription = description;
    
    // Use book image if available, otherwise use a default
    const finalOgImage = ogImage || `${siteUrl}/og-image.png`;
    
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
  <meta property="og:image" content="${finalOgImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Daily ABC Illustrations">
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${ogDescription}">
  <meta name="twitter:image" content="${finalOgImage}">
  
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
