import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';
import { useSeoMetadata } from '@/hooks/useSeoMetadata';
import { MetaHead } from '@/components/common/MetaHead';
import { PageLayout } from '@/components/layout/PageLayout';
import { LoadingState } from '@/components/ui/loading-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Users, GraduationCap } from 'lucide-react';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsTeacher } from '@/contexts/RoleContext';
import { PremiumGate } from '@/components/subscription/PremiumGate';
import { useSubscription } from '@/hooks/useSubscription';

export default function Library() {
  const {
    data: libraryItems,
    isLoading,
    error
  } = useLibraryBooks();
  const { canAccessFullLibrary } = useSubscription();

  if (isLoading) {
    return (
      <PageLayout title="Library">
        <LoadingState text="Loading library..." />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Library">
        <div className="text-center py-8">
          <p className="text-destructive">Error loading library: {error.message}</p>
        </div>
      </PageLayout>
    );
  }

  // Sort all books by publish_date (newest first)
  const allBooks = libraryItems?.sort((a, b) => 
    new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime()
  ) || [];

  // Separate active/queued books from expired books
  const activeAndQueuedBooks = allBooks.filter(book => book.status === 'active' || book.status === 'queued');
  const expiredBooks = allBooks.filter(book => book.status === 'expired');
  const hasAccess = canAccessFullLibrary();

  return <>
    <MetaHead metadata={{
      title: "Library - Daily ABC Illustrations",
      description: "Explore all queued, active, and past ABC illustration books.",
      type: "website"
    }} />
    
    <PageLayout title="Library">
      <div className="container mx-auto px-4 pb-8">
        <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ABC Books Library</h1>
            <p className="text-muted-foreground">
              Explore all published daily ABC illustration books
            </p>
          </div>
        </div>

        {/* Active and Queued Books - Always accessible */}
        {activeAndQueuedBooks.length > 0 && (
          <div className="">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              Current & Upcoming Books
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeAndQueuedBooks.map((item) => (
                <LibraryBookCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Expired Books - Premium gated */}
        {expiredBooks.length > 0 && (
          <div className="">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gray-500" />
              Past Books ({expiredBooks.length})
            </h2>
            {hasAccess ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {expiredBooks.map((item) => (
                  <LibraryBookCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <PremiumGate 
                feature="full library access"
                description="Access all past daily published ABC books and view the complete library."
                showUpgrade={true}
              >
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {expiredBooks.slice(0, 3).map((item) => (
                    <LibraryBookCard key={item.id} item={item} />
                  ))}
                </div>
              </PremiumGate>
            )}
          </div>
        )}

        {allBooks.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No books in library</h3>
              <p className="text-muted-foreground">
                Check back soon for new daily illustrations!
              </p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </PageLayout>
  </>;
}

interface LibraryBookCardProps {
  item: DailyPublishedWithBook;
}

function LibraryBookCard({ item }: LibraryBookCardProps) {
  const navigate = useNavigate();
  
  const {
    data: seoMetadata
  } = useSeoMetadata(item.id);

  const isTeacher = useIsTeacher();
  
  const handleCardClick = () => {
    if (isTeacher) {
      navigate(`/library/${item.id}/detail`);
    } else {
      navigate(`/library/${item.id}`);
    }
  };


  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'queued':
        return 'secondary';
      case 'expired':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'queued':
        return 'Queued';
      case 'expired':
        return 'Past';
      default:
        return 'Draft';
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer hover:shadow-lg" 
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl line-clamp-2">
            {seoMetadata?.seo_title || item.title}
          </CardTitle>
          <Badge variant={getStatusBadgeVariant(item.status)}>
            {getStatusLabel(item.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(seoMetadata?.seo_description || item.description) && (
          <CardDescription className="line-clamp-3">
            {seoMetadata?.seo_description || item.description}
          </CardDescription>
        )}
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            26 pages
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(item.publish_date).toLocaleDateString()}
          </div>
        </div>
        
        <div className="aspect-[1200/630] bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {seoMetadata?.og_image_url ? (
            <img 
              src={seoMetadata.og_image_url} 
              alt={`Preview of ${item.title}`}
              className="w-full h-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}