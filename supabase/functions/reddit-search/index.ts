import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RedditTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface RedditSearchResult {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  score: number;
  num_comments: number;
  url: string;
  permalink: string;
  created_utc: number;
  author: string;
}

interface RedditSearchResponse {
  data: {
    children: Array<{
      data: RedditSearchResult;
    }>;
  };
}

interface RedditListingResponse {
  kind: string;
  data: {
    children: Array<{
      kind: string;
      data: RedditSearchResult;
    }>;
    after?: string;
    before?: string;
  };
}

// In-memory token cache (simple implementation)
let tokenCache: {
  token: string;
  expires_at: number;
} | null = null;

async function getRedditToken(): Promise<string> {
  const now = Date.now();
  
  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expires_at > now) {
    console.log('Using cached Reddit token');
    return tokenCache.token;
  }
  
  console.log('Requesting new Reddit token');
  
  const clientId = Deno.env.get('REDDIT_CLIENT_ID');
  const clientSecret = Deno.env.get('REDDIT_CLIENT_SECRET');
  const userAgent = Deno.env.get('REDDIT_USER_AGENT') || 'dailyabcillustrations/1.0';
  
  if (!clientId || !clientSecret) {
    throw new Error('Reddit API credentials not configured');
  }
  
  const credentials = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent,
    },
    body: 'grant_type=client_credentials',
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Reddit OAuth error:', error);
    throw new Error(`Reddit authentication failed: ${response.status}`);
  }
  
  const tokenData: RedditTokenResponse = await response.json();
  
  // Cache the token (expires in seconds, convert to milliseconds)
  tokenCache = {
    token: tokenData.access_token,
    expires_at: now + (tokenData.expires_in - 60) * 1000, // Subtract 60s buffer
  };
  
  console.log(`Reddit token obtained, expires in ${tokenData.expires_in} seconds`);
  return tokenData.access_token;
}

async function searchReddit(
  token: string,
  query: string,
  subreddit?: string,
  limit: number = 10
): Promise<RedditSearchResult[]> {
  const userAgent = Deno.env.get('REDDIT_USER_AGENT') || 'dailyabcillustrations/1.0';
  
  // Construct search URL
  let searchUrl = 'https://oauth.reddit.com/search';
  const params = new URLSearchParams({
    q: query,
    limit: Math.min(limit, 25).toString(), // Reddit max is 25
    sort: 'relevance',
    type: 'link,sr',
  });
  
  if (subreddit) {
    params.append('restrict_sr', 'true');
    searchUrl = `https://oauth.reddit.com/r/${subreddit}/search`;
  }
  
  const response = await fetch(`${searchUrl}?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': userAgent,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Reddit search error:', error);
    throw new Error(`Reddit search failed: ${response.status}`);
  }
  
  const data: RedditListingResponse[] | RedditListingResponse = await response.json();
  
  console.log('Reddit API raw response:', JSON.stringify(data, null, 2));
  
  // Handle both single listing and array of listings
  let listings: RedditListingResponse[];
  if (Array.isArray(data)) {
    listings = data;
  } else {
    listings = [data];
  }
  
  // Find the listing with children (results)
  const resultsListing = listings.find(listing => 
    listing.data && listing.data.children && listing.data.children.length > 0
  );
  
  if (!resultsListing) {
    console.log('No results found in any listing');
    return [];
  }
  
  // Filter and transform results
  return resultsListing.data.children
    .map(child => ({
      id: child.data.id || '',
      title: child.data.title || '',
      selftext: child.data.selftext || '',
      subreddit: child.data.subreddit || '',
      score: child.data.score || 0,
      num_comments: child.data.num_comments || 0,
      url: child.data.url || '',
      permalink: child.data.permalink || '',
      created_utc: child.data.created_utc || 0,
      author: child.data.author || 'unknown',
    }))
    .filter(post => post.title && post.subreddit) // Only include posts with valid title and subreddit
    .filter(post => {
      // Basic content filtering for educational appropriateness
      // Safely handle potentially undefined/null values
      const title = (post.title || '').toLowerCase();
      const text = (post.selftext || '').toLowerCase();
      const subredditName = (post.subreddit || '').toLowerCase();
      
      // Filter out inappropriate subreddits
      const blockedSubreddits = ['nsfw', 'gonewild', 'wtf', 'morbidreality'];
      if (blockedSubreddits.some(blocked => subredditName.includes(blocked))) {
        return false;
      }
      
      // Expanded list of relevant subreddits for ABC learning content
      const relevantSubreddits = [
        'education', 'teachers', 'homeschool', 'parenting', 'kids', 'learning',
        'appgiveaway', 'genaiapps', 'apps', 'freebies', 'deals', 'preschool',
        'kindergarten', 'earlychildhood', 'toddlers', 'babybumps', 'mommit',
        'daddit', 'beyondthebump', 'elementary', 'specialneeds', 'futuretechfinds'
      ];
      const isFromRelevantSubreddit = relevantSubreddits.some(sub => subredditName.includes(sub));
      
      // Check for ABC/alphabet specific content keywords
      const abcKeywords = ['abc', 'alphabet', 'letters', 'tracing', 'phonics', 'reading', 'teach', 'learn', 'child'];
      const hasAbcContent = abcKeywords.some(keyword => 
        title.includes(keyword) || text.includes(keyword)
      );
      
      // Basic profanity filter (simple implementation)
      const profanityWords = ['fuck', 'shit', 'damn', 'hell'];
      const hasProfanity = profanityWords.some(word => 
        title.includes(word) || text.includes(word)
      );
      
      // Allow content if: no profanity AND (relevant subreddit OR has ABC content OR decent score)
      return !hasProfanity && (isFromRelevantSubreddit || hasAbcContent || post.score > 1);
    })
    .slice(0, limit);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
  
  try {
    const { query, subreddit, limit = 10 } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required and must be a string' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`Reddit search request: "${query}" in ${subreddit || 'all subreddits'}, limit: ${limit}`);
    
    // Get Reddit OAuth token
    const token = await getRedditToken();
    
    // Search Reddit
    const results = await searchReddit(token, query, subreddit, limit);
    
    console.log(`Reddit search completed: ${results.length} results found`);
    
    return new Response(
      JSON.stringify({
        success: true,
        query,
        subreddit,
        results,
        total_results: results.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('Error in reddit-search function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});