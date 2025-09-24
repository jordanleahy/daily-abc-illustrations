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
  
  const data: RedditSearchResponse = await response.json();
  
  console.log('Reddit API raw response:', JSON.stringify(data, null, 2));
  
  // Check if response has expected structure
  if (!data || !data.data || !data.data.children) {
    console.error('Reddit API response missing expected structure:', data);
    return []; // Return empty array instead of crashing
  }
  
  // Filter and transform results
  return data.data.children
    .map(child => child.data)
    .filter(post => {
      // Basic content filtering for educational appropriateness
      const title = post.title.toLowerCase();
      const text = post.selftext.toLowerCase();
      const subredditName = post.subreddit.toLowerCase();
      
      // Filter out inappropriate subreddits
      const blockedSubreddits = ['nsfw', 'gonewild', 'wtf', 'morbidreality'];
      if (blockedSubreddits.some(blocked => subredditName.includes(blocked))) {
        return false;
      }
      
      // Prefer educational subreddits
      const educationalSubreddits = ['education', 'teachers', 'homeschool', 'parenting', 'kids', 'learning'];
      const isEducational = educationalSubreddits.some(edu => subredditName.includes(edu));
      
      // Basic profanity filter (simple implementation)
      const profanityWords = ['fuck', 'shit', 'damn', 'hell'];
      const hasProfanity = profanityWords.some(word => 
        title.includes(word) || text.includes(word)
      );
      
      return !hasProfanity && (isEducational || post.score > 5);
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