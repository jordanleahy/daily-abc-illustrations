import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandardPageLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBooks } from '@/hooks/useBooks';
import { useBookSeoMetadata } from '@/hooks/useBookSeoMetadata';
import { BookOpen, Calendar, Users } from 'lucide-react';
import { CreateBookModal } from '@/components/books/CreateBookModal';
import { LoadingState } from '@/components/ui/loading-state';

function BookCard({ book, onClick }: { book: any; onClick: () => void }) {
  const { data: seoMetadata } = useBookSeoMetadata(book.id);

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow group overflow-hidden"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg group-hover:text-primary transition-colors">
            {book.book_name}
          </CardTitle>
          <Badge variant={book.status === 'published' ? 'default' : 'secondary'}>
            {book.status}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {book.book_description || "No description provided"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Book Thumbnail */}
        <AspectRatio ratio={1200/630} className="bg-muted rounded-lg overflow-hidden">
          {seoMetadata?.og_image_url ? (
            <img
              src={seoMetadata.og_image_url}
              alt={book.book_name}
              className="w-full h-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </AspectRatio>

        {/* Book Metadata */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(book.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {book.category || 'General'}
            </div>
          </div>
          <div className="text-xs bg-muted px-2 py-1 rounded">
            {book.total_pages || 0} pages
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Books() {
  const { user, loading: authLoading } = useAuthContext();
  const { books, loading } = useBooks();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleViewBook = (bookId: string) => {
    navigate(`/editor/${bookId}`);
  };

  const handleCreateNewBook = () => {
    setShowCreateModal(true);
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <StandardPageLayout title="My Books" containerClassName="py-8">
        <LoadingState />
      </StandardPageLayout>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <StandardPageLayout title="My Books" containerClassName="py-8">
        <LoadingState text="Loading your books..." />
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout title="My Books" containerClassName="py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Books</h1>
            <p className="text-muted-foreground">
              Create and manage your ABC books
            </p>
          </div>
          <Button onClick={handleCreateNewBook}>
            <BookOpen className="mr-2 h-4 w-4" />
            Create New Book
          </Button>
        </div>

        {/* Books Grid */}
        {books && books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={() => handleViewBook(book.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No books yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first ABC book to get started
              </p>
              <Button onClick={handleCreateNewBook}>
                <BookOpen className="mr-2 h-4 w-4" />
                Create Your First Book
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Book Modal */}
        <CreateBookModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
        />
      </div>
    </StandardPageLayout>
  );
}