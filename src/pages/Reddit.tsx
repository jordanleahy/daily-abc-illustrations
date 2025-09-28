import { useState } from 'react';
import { StandardPageLayout } from '@/components/layout';
import { RedditConversationCard } from '@/components/reddit/RedditConversationCard';
import { RedditCardSkeleton } from '@/components/reddit/RedditCardSkeleton';
import { RedditSearchBar } from '@/components/reddit/RedditSearchBar';
import { useRedditSearch } from '@/hooks/useRedditSearch';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Reddit = () => {
  const [searchQuery, setSearchQuery] = useState('ABC learning for kids');
  const [timeFilter, setTimeFilter] = useState<string | undefined>(undefined);
  const { data: redditPosts, isLoading, error } = useRedditSearch(searchQuery, timeFilter);

  const handleSearch = (query: string, newTimeFilter?: string) => {
    setSearchQuery(query);
    setTimeFilter(newTimeFilter);
  };

  return (
    <StandardPageLayout title="Reddit ABC Learning Conversations" containerClassName="py-6">
      <div className="mb-6">
        <p className="text-muted-foreground">
          Discover conversations about ABC learning across Reddit communities
        </p>
      </div>
        
        <RedditSearchBar 
          onSearch={handleSearch}
          currentQuery={searchQuery}
        />
        
        {error && (
          <Alert className="mb-6">
            <AlertDescription>
              Unable to load Reddit data. Please try a different search term or check one of the quick search options above.
            </AlertDescription>
          </Alert>
        )}

        {/* Search Quality Indicator */}
        {redditPosts && redditPosts.length > 0 && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Found {redditPosts.length} relevant conversations
              </span>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  Avg. relevance: {Math.round((redditPosts.reduce((acc, post) => acc + post.relevance_score, 0) / redditPosts.length) * 10) / 10}
                </span>
                {redditPosts.length < 5 && (
                  <span className="text-xs text-orange-600 dark:text-orange-400">
                    Limited results - try broader terms
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, index) => (
              <RedditCardSkeleton key={index} />
            ))
          ) : redditPosts && redditPosts.length > 0 ? (
            redditPosts.map((post) => (
              <RedditConversationCard key={post.id} post={post} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">No conversations found for "{searchQuery}"</p>
              <p className="text-sm text-muted-foreground mt-2">Try a different search term or one of the quick searches above.</p>
            </div>
          )}
      </div>
    </StandardPageLayout>
  );
};

export default Reddit;