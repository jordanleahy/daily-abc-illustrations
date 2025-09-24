export interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  created_utc: number;
  upvotes: number;
  num_comments: number;
  selftext: string;
  url: string;
  reddit_url: string;
  relevance_score: number;
  abc_learning_tags: string[];
}