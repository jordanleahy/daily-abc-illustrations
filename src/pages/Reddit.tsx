import { useState } from 'react';
import { PageLayout } from '@/components/layout';
import { RedditConversationCard } from '@/components/reddit/RedditConversationCard';
import { RedditCardSkeleton } from '@/components/reddit/RedditCardSkeleton';
import { RedditSearchBar } from '@/components/reddit/RedditSearchBar';
import { useRedditSearch } from '@/hooks/useRedditSearch';
import { mockRedditPosts } from '@/data/mockRedditData';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Reddit = () => {
  const [searchQuery, setSearchQuery] = useState('ABC learning alphabet letters children education');
  const { data: redditPosts, isLoading, error } = useRedditSearch(searchQuery);

  return (
    <PageLayout title="Reddit ABC Learning Conversations">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Discover conversations about ABC learning across Reddit communities
          </p>
        </div>
        
        <RedditSearchBar 
          onSearch={setSearchQuery}
          currentQuery={searchQuery}
        />
        
        {error && (
          <Alert className="mb-6">
            <AlertDescription>
              Unable to load live Reddit data. Showing sample conversations instead.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, index) => (
              <RedditCardSkeleton key={index} />
            ))
          ) : (
            (redditPosts && redditPosts.length > 0 ? redditPosts : mockRedditPosts).map((post) => (
              <RedditConversationCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Reddit;