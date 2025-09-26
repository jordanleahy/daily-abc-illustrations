import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useBooks } from '@/hooks/useBooks';
import { BookOpen, Calendar, Users } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { CreateBookModal } from '@/components/books/CreateBookModal';

export default function Books() {
  const { user, loading: authLoading } = useAuth();
  const { books, loading } = useBooks();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Redirect to auth if not authenticated (but not if already on auth page)
  if (!authLoading && !user && location.pathname !== '/auth') {
    navigate('/auth');
    return null;
  }

  const handleViewBook = (bookId: string) => {
    navigate(`/editor/${bookId}`);
  };

  const handleCreateNewBook = () => {
    setShowCreateModal(true);
  };


  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <PageLayout title="My Books">
        <Container className="py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <PageLayout title="My Books">
        <Container className="py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading your books...</div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Book Editor">
      <Container className="py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Book Editor</h1>
              <p className="text-muted-foreground">
                Create and manage ABC learning books for the platform
              </p>
            </div>
            <Button onClick={handleCreateNewBook} className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Create New Book
            </Button>
          </div>

          {books.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No books yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start a conversation with our AI to create your first ABC book!
                </p>
                <Button onClick={handleCreateNewBook}>
                  Create Your First Book
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <Card 
                  key={book.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer hover:shadow-lg" 
                  onClick={() => handleViewBook(book.id)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl line-clamp-2">
                        {book.book_name}
                      </CardTitle>
                      <Badge variant={
                        book.dailyPublishedStatus === 'active' ? "default" : 
                        book.dailyPublishedStatus === 'queued' ? "secondary" :
                        book.dailyPublishedStatus === 'expired' ? "outline" : 
                        "secondary"
                      }>
                        {book.dailyPublishedStatus === 'active' ? 'Active' : 
                         book.dailyPublishedStatus === 'queued' ? 'Queued' :
                         book.dailyPublishedStatus === 'expired' ? 'Expired' :
                         book.dailyPublishedStatus === 'draft' ? 'Draft' :
                         'Draft'}
                      </Badge>
                    </div>
                    {book.category && (
                      <Badge variant="outline" className="w-fit">
                        {book.category}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {book.book_description && (
                      <CardDescription className="line-clamp-3">
                        {book.book_description}
                      </CardDescription>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {book.total_pages} pages
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(book.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {book.firstPageImageUrl ? (
                        <img 
                          src={book.firstPageImageUrl} 
                          alt={`Preview of ${book.book_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Container>
      
      <CreateBookModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </PageLayout>
  );
}