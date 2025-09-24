import { PageLayout } from '@/components/layout';
import { RedditConversationCard } from '@/components/reddit/RedditConversationCard';
import { mockRedditPosts } from '@/data/mockRedditData';

const Reddit = () => {
  return (
    <PageLayout title="Reddit ABC Learning Conversations">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Discover conversations about ABC learning across Reddit communities
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRedditPosts.map((post) => (
            <RedditConversationCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default Reddit;