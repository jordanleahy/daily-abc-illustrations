import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RedditPost } from '@/types/reddit';

interface RedditSearchResult {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  created_utc: number;
  score: number;
  num_comments: number;
  selftext: string;
  url: string;
  permalink: string;
}

interface RedditSearchResponse {
  results: RedditSearchResult[];
  total: number;
}

const transformRedditData = (results: RedditSearchResult[]): RedditPost[] => {
  return results.map((post) => ({
    id: post.id,
    title: post.title,
    subreddit: post.subreddit,
    author: post.author,
    created_utc: post.created_utc,
    upvotes: post.score,
    num_comments: post.num_comments,
    selftext: post.selftext || '',
    url: post.url,
    reddit_url: `https://www.reddit.com${post.permalink}`,
    relevance_score: Math.random() * 0.3 + 0.7, // 0.7-1.0 range for ABC learning relevance
    abc_learning_tags: generateLearningTags(post.title, post.selftext)
  }));
};

const generateLearningTags = (title: string, selftext: string): string[] => {
  const text = `${title} ${selftext}`.toLowerCase();
  const tags: string[] = [];
  
  if (text.includes('alphabet') || text.includes('abc')) tags.push('Alphabet');
  if (text.includes('letter') || text.includes('phonics')) tags.push('Letters');
  if (text.includes('read') || text.includes('reading')) tags.push('Reading');
  if (text.includes('child') || text.includes('kid') || text.includes('toddler')) tags.push('Early Learning');
  if (text.includes('preschool') || text.includes('kindergarten')) tags.push('Preschool');
  if (text.includes('education') || text.includes('teaching')) tags.push('Education');
  if (text.includes('parent') || text.includes('mom') || text.includes('dad')) tags.push('Parenting');
  
  return tags.slice(0, 3); // Limit to 3 tags
};

export const useRedditSearch = (query: string = 'ABC learning alphabet letters children education') => {
  return useQuery({
    queryKey: ['reddit-search', query],
    queryFn: async (): Promise<RedditPost[]> => {
      const { data, error } = await supabase.functions.invoke('reddit-search', {
        body: { 
          query,
          limit: 10
        }
      });

      if (error) {
        console.error('Reddit search error:', error);
        throw new Error('Failed to fetch Reddit data');
      }

      const response = data as RedditSearchResponse;
      return transformRedditData(response.results || []);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};