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

interface RedditPostWithRelevance extends RedditSearchResult {
  relevance_score: number;
}

function computeRelevanceScore(post: RedditSearchResult, query: string): number {
  const title = (post.title || '').toLowerCase();
  const text = (post.selftext || '').toLowerCase();
  const subredditName = (post.subreddit || '').toLowerCase();
  const queryLower = query.toLowerCase();
  
  let score = 0;
  
  // Expanded educational keywords (+3 points)
  const educationalKeywords = [
    'abc', 'alphabet', 'letter', 'letters', 'phonics', 'reading', 'teach', 'learn', 
    'child', 'children', 'kids', 'preschool', 'kindergarten', 'toddler', 'toddlers',
    'education', 'educational', 'learning', 'literacy', 'writing', 'spelling',
    'tracing', 'early childhood', 'activities', 'games', 'curriculum', 'teaching'
  ];
  const hasEducationalContent = educationalKeywords.some(keyword => 
    title.includes(keyword) || text.includes(keyword)
  );
  if (hasEducationalContent) score += 3;
  
  // Refined educational subreddits (+2 points)
  const educationalSubreddits = [
    'education', 'teachers', 'homeschool', 'parenting', 'preschool', 'kindergarten',
    'earlychildhood', 'elementary', 'toddlers', 'mommit', 'daddit', 'beyondthebump'
  ];
  const isFromEducationalSubreddit = educationalSubreddits.some(sub => subredditName.includes(sub));
  if (isFromEducationalSubreddit) score += 2;
  
  // Direct query match bonus (+2 points)
  if (title.includes(queryLower) || text.includes(queryLower)) score += 2;
  
  // Post score (normalized, max +2 points)
  score += Math.min(post.score / 10, 2);
  
  // Comment engagement (normalized, max +2 points)
  score += Math.min(post.num_comments / 5, 2);
  
  // Penalty for app/giveaway posts unless specifically searched (-2 points)
  const hasAppGiveawayTerms = title.includes('app') || title.includes('free') || 
                              subredditName.includes('giveaway') || subredditName.includes('deals');
  const isAppSearch = queryLower.includes('app') || queryLower.includes('giveaway');
  if (hasAppGiveawayTerms && !isAppSearch) score -= 2;
  
  // Recency bonus (posts less than 30 days old get slight boost)
  const daysSincePost = (Date.now() - (post.created_utc * 1000)) / (1000 * 60 * 60 * 24);
  if (daysSincePost < 30) score += 0.5;
  
  return Math.max(score, 0); // Ensure non-negative score
}

function deduplicatePosts(posts: RedditPostWithRelevance[]): RedditPostWithRelevance[] {
  const uniquePosts: RedditPostWithRelevance[] = [];
  const seen = new Set<string>();
  
  for (const post of posts) {
    // Create a key based on title similarity and author
    const titleWords = post.title.toLowerCase().split(' ').filter(word => word.length > 3);
    const titleKey = titleWords.slice(0, 3).join('-'); // First 3 significant words
    const key = `${titleKey}-${post.author}`;
    
    if (!seen.has(key)) {
      uniquePosts.push(post);
      seen.add(key);
    }
  }
  
  return uniquePosts;
}

async function searchReddit(
  token: string,
  query: string,
  subreddit?: string,
  limit: number = 10,
  timeFilter?: string
): Promise<RedditPostWithRelevance[]> {
  const userAgent = Deno.env.get('REDDIT_USER_AGENT') || 'dailyabcillustrations/1.0';
  
  // Construct search URL - get more results initially to allow for filtering
  let searchUrl = 'https://oauth.reddit.com/search';
  const params = new URLSearchParams({
    q: query,
    limit: Math.min(limit * 2, 25).toString(), // Get 2x results to filter
    sort: 'relevance',
    type: 'link,sr',
  });
  
  // Add time filter if specified
  if (timeFilter) {
    params.append('t', timeFilter);
  }
  
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
  
  // Collect all children across listings and keep only posts (kind 't3')
  const allChildren = listings.flatMap(l => (l.data?.children ?? []));
  const postChildren = allChildren.filter(child => child.kind === 't3');
  
  if (postChildren.length === 0) {
    console.log('No post results found (kind t3) in any listing');
    return [];
  }
  
  // Transform and filter results
  const posts = postChildren
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
      const title = (post.title || '').toLowerCase();
      const text = (post.selftext || '').toLowerCase();
      const subredditName = (post.subreddit || '').toLowerCase();
      
      // Time filter: for 48 hours, filter posts created in last 2 days
      if (timeFilter === '48h') {
        const hoursAgo = (Date.now() - (post.created_utc * 1000)) / (1000 * 60 * 60);
        if (hoursAgo > 48) {
          return false;
        }
      }
      
      // Educational relevance filter: must be from relevant subreddit OR contain educational keywords
      const educationalSubreddits = [
        'education', 'teachers', 'homeschool', 'parenting', 'preschool', 'kindergarten',
        'earlychildhood', 'elementary', 'toddlers', 'mommit', 'daddit', 'beyondthebump'
      ];
      const educationalKeywords = [
        'abc', 'alphabet', 'letter', 'phonics', 'reading', 'teach', 'learn', 'child', 
        'kids', 'preschool', 'kindergarten', 'education', 'learning', 'literacy'
      ];
      
      const isRelevantSub = educationalSubreddits.some(sub => subredditName.includes(sub));
      const hasKeyword = educationalKeywords.some(kw => title.includes(kw) || text.includes(kw));
      
      // Must pass educational relevance check
      if (!isRelevantSub && !hasKeyword) {
        return false;
      }
      
      // Filter out inappropriate subreddits
      const blockedSubreddits = ['nsfw', 'gonewild', 'wtf', 'morbidreality', 'watchpeopledie'];
      if (blockedSubreddits.some(blocked => subredditName.includes(blocked))) {
        return false;
      }
      
      // Enhanced profanity filter
      const profanityWords = ['fuck', 'shit', 'damn', 'hell', 'bitch', 'asshole'];
      const hasProfanity = profanityWords.some(word => 
        title.includes(word) || text.includes(word)
      );
      
      // Filter out spam/low quality indicators
      const spamIndicators = ['click here', 'amazing deal', 'limited time', 'act now'];
      const isSpam = spamIndicators.some(indicator => title.includes(indicator));
      
      // Prefer discussion posts over promotional content
      const promotionalIndicators = ['buy now', 'discount', 'sale', 'promo code'];
      const isPromotional = promotionalIndicators.some(indicator => title.includes(indicator));
      
      return !hasProfanity && !isSpam && !isPromotional;
    })
    .map(post => ({
      ...post,
      relevance_score: computeRelevanceScore(post, query)
    }))
    // No relevance threshold - include all posts that pass content filtering
    .sort((a, b) => b.relevance_score - a.relevance_score); // Sort by relevance
  
  // Deduplicate results
  const uniquePosts = deduplicatePosts(posts);
  
  console.log(`Filtered ${posts.length} posts to ${uniquePosts.length} unique results`);
  
  return uniquePosts.slice(0, limit);
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
    const { query, subreddit, limit = 10, timeFilter } = await req.json();
    
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
    const results = await searchReddit(token, query, subreddit, limit, timeFilter);
    
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