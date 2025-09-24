import { ExternalLink, MessageCircle, ArrowUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RedditPost } from '@/types/reddit';

interface RedditConversationCardProps {
  post: RedditPost;
}

const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diffInHours = Math.floor((now - timestamp) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
};

const getSubredditColor = (subreddit: string) => {
  const colors: Record<string, string> = {
    'Parenting': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'Teachers': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'homeschool': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'toddlers': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    'specialneeds': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    'Montessori': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    'GiftedKids': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    'ESL': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
    'ECEProfessionals': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
    'WaldorfEducation': 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300',
  };
  return colors[subreddit] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
};

const validateRedditUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'www.reddit.com' || urlObj.hostname === 'reddit.com';
  } catch {
    return false;
  }
};

const openRedditLink = (url: string) => {
  if (validateRedditUrl(url)) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

export const RedditConversationCard = ({ post }: RedditConversationCardProps) => {
  return (
    <Card className="h-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 
            className="font-semibold text-sm leading-tight line-clamp-2 flex-1 cursor-pointer hover:text-primary transition-colors"
            onClick={() => openRedditLink(post.reddit_url)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openRedditLink(post.reddit_url);
              }
            }}
            aria-label={`Open Reddit discussion: ${post.title}`}
          >
            {post.title}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => openRedditLink(post.reddit_url)}
            aria-label="Open Reddit discussion"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            variant="secondary" 
            className={`text-xs ${getSubredditColor(post.subreddit)}`}
          >
            r/{post.subreddit}
          </Badge>
          <span className="text-xs text-muted-foreground">
            u/{post.author} • {formatTimeAgo(post.created_utc)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {post.selftext}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              {post.upvotes}
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {post.num_comments}
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {post.relevance_score}% match
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {post.abc_learning_tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};