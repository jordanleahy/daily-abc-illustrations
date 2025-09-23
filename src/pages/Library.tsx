import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';
import { useSeoMetadata } from '@/hooks/useSeoMetadata';
import { MetaHead } from '@/components/common/MetaHead';
import { UserHeader } from '@/components/layout/UserHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Image } from 'lucide-react';
import { DailyPublishedWithBook } from '@/types/dailyPublished';

export default function Library() {
  const {
    data: libraryItems,
    isLoading,
    error
  } = useLibraryBooks();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader 
          title="Library"
          showQRCode={false}
        />
        <div className="pt-16 text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader 
          title="Library"
          showQRCode={false}
        />
        <div className="pt-16 text-center py-8">
          <p className="text-destructive">Error loading library: {error.message}</p>
        </div>
      </div>
    );
  }

  // Sort all books by publish_date (newest first) for authenticated users
  const allBooks = libraryItems?.sort((a, b) => 
    new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime()
  ) || [];

  return <>
    <MetaHead metadata={{
      title: "My Library - Daily ABC Illustrations",
      description: "Browse your personal library of ABC illustration books. Discover daily published educational content for children.",
      type: "website"
    }} />
    
    <div className="min-h-screen bg-background">
      <UserHeader 
        title="Library"
        showQRCode={false}
      />
      <div className="pt-16 container mx-auto px-4 pb-8 max-w-4xl">
        {/* All Books - No Status Filtering */}
        {allBooks.length > 0 ? (
          <div className="space-y-4">
            {allBooks.map(item => (
              <PublicScheduleCard key={item.id} item={item} hideStatus={true} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No books in library</h3>
              <p className="text-muted-foreground">
                Check back soon for new daily illustrations!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  </>;
}

// Reusable components (adapted from Schedule)
function ScheduleThumbnail({
  imageUrl,
  title
}: {
  imageUrl?: string;
  title: string;
}) {
  return <>
    {/* Mobile: Full width with aspect ratio */}
    <div className="md:hidden w-full">
      <AspectRatio ratio={1.91} className="rounded-lg overflow-hidden bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </AspectRatio>
    </div>
    
    {/* Desktop: Fixed size */}
    <div className="hidden md:block w-32 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
      ) : (
        <Image className="h-6 w-6 text-muted-foreground" />
      )}
    </div>
  </>;
}

type ScheduleCardItem = DailyPublishedWithBook;

interface PublicScheduleCardProps {
  item: ScheduleCardItem;
  position?: number | "active" | "expired";
  hideStatus?: boolean;
}

function PublicScheduleCard({
  item,
  position,
  hideStatus = false
}: PublicScheduleCardProps) {
  const navigate = useNavigate();
  const {
    data: seoMetadata
  } = useSeoMetadata(item.id);

  const handleCardClick = () => {
    navigate(`/library/${item.id}`);
  };

  return <Card 
    className="transition-shadow group cursor-pointer hover:shadow-lg" 
    onClick={handleCardClick}
  >
    <CardHeader className="pb-3">
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        {/* Thumbnail */}
        <ScheduleThumbnail imageUrl={seoMetadata?.og_image_url} title={item.title} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg truncate">{item.title}</CardTitle>
          <CardDescription className="mt-1">
            {item.book.book_name}
            {item.description && ` • ${item.description}`}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  </Card>;
}