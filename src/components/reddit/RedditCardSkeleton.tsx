import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const RedditCardSkeleton = () => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        {/* Title skeleton */}
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
        
        {/* Author and subreddit info */}
        <div className="flex items-center gap-2 mt-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Content skeleton */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        
        {/* Stats skeleton */}
        <div className="flex items-center gap-4 mb-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        
        {/* Tags skeleton */}
        <div className="flex flex-wrap gap-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-14" />
        </div>
      </CardContent>
    </Card>
  );
};