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
  relevance_score: number;
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
    relevance_score: post.relevance_score, // Use computed relevance from backend
    abc_learning_tags: generateLearningTags(post.title, post.selftext)
  }));
};

const generateLearningTags = (title: string, selftext: string): string[] => {
  const text = `${title} ${selftext}`.toLowerCase();
  const tags: string[] = [];
  
  // Enhanced tag generation with more specific categories
  if (text.includes('alphabet') || text.includes('abc')) tags.push('Alphabet');
  if (text.includes('letter') || text.includes('phonics') || text.includes('sound')) tags.push('Phonics');
  if (text.includes('read') || text.includes('reading') || text.includes('literacy')) tags.push('Reading');
  if (text.includes('write') || text.includes('writing') || text.includes('tracing')) tags.push('Writing');
  if (text.includes('child') || text.includes('kid') || text.includes('toddler')) tags.push('Early Learning');
  if (text.includes('preschool') || text.includes('kindergarten') || text.includes('pre-k')) tags.push('Preschool');
  if (text.includes('education') || text.includes('teaching') || text.includes('curriculum')) tags.push('Education');
  if (text.includes('parent') || text.includes('mom') || text.includes('dad') || text.includes('family')) tags.push('Parenting');
  if (text.includes('app') || text.includes('game') || text.includes('digital')) tags.push('Educational Apps');
  if (text.includes('activity') || text.includes('craft') || text.includes('worksheet')) tags.push('Activities');
  if (text.includes('montessori') || text.includes('waldorf') || text.includes('reggio')) tags.push('Learning Method');
  if (text.includes('special needs') || text.includes('autism') || text.includes('adhd')) tags.push('Special Needs');
  
  return tags.slice(0, 4); // Limit to 4 tags for better display
};

export const useRedditSearch = (query: string = 'ABC learning for kids') => {
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