import { Card, CardContent } from './card';

export const PopularBookSkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="aspect-video bg-muted rounded-lg mb-4" />
      <div className="h-6 bg-muted rounded mb-2" />
      <div className="h-4 bg-muted rounded w-2/3" />
    </CardContent>
  </Card>
);

export const LibraryBookSkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="aspect-video bg-muted rounded-lg mb-4" />
      <div className="h-6 bg-muted rounded mb-2" />
      <div className="h-4 bg-muted rounded" />
      <div className="h-4 bg-muted rounded w-4/5 mt-2" />
    </CardContent>
  </Card>
);
