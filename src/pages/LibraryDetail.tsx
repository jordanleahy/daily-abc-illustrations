import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Users, Calendar, BookOpen } from 'lucide-react';
import { useLibraryBookById } from '@/hooks/useLibraryBookById';
import { useDailyPublishedPages } from '@/hooks/useDailyPublishedPages';
import { PageCard, UserPageCard } from '@/components/page-prompts';
import { TeacherOnly } from '@/components/TeacherOnly';
import { MetaHead } from '@/components/common/MetaHead';

export default function LibraryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'teacher' | 'user'>('teacher');
  
  const { data: dailyPublished, isLoading: bookLoading } = useLibraryBookById(id);
  const { data: pages = [], isLoading: pagesLoading } = useDailyPublishedPages(dailyPublished?.book_id);

  const handleBack = () => {
    navigate('/library');
  };

  const handleReadingView = () => {
    navigate(`/library/${id}`);
  };

  if (bookLoading || pagesLoading) {
    return (
      <PageLayout>
        <Container>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  if (!dailyPublished) {
    return (
      <PageLayout>
        <Container>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Book not found</p>
            <Button onClick={handleBack} className="mt-4">
              Back to Library
            </Button>
          </div>
        </Container>
      </PageLayout>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'queued':
        return 'Queued';
      case 'expired':
        return 'Expired';
      default:
        return 'Draft';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default' as const;
      case 'queued':
        return 'secondary' as const;
      case 'expired':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <PageLayout>
      <MetaHead 
        metadata={{
          title: `${dailyPublished.title} - Detail View`,
          description: dailyPublished.description || `Detail view of ${dailyPublished.title}`,
          type: 'website'
        }}
      />
      
      <Container>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="p-2 hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleReadingView}
              >
                <Eye className="w-4 h-4 mr-2" />
                Reading View
              </Button>
              
              <TeacherOnly>
                <Button
                  variant={viewMode === 'user' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('user')}
                >
                  User View
                </Button>
                <Button
                  variant={viewMode === 'teacher' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('teacher')}
                >
                  Teacher View
                </Button>
              </TeacherOnly>
            </div>
          </div>

          {/* Book Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{dailyPublished.title}</CardTitle>
              {dailyPublished.description && (
                <p className="text-muted-foreground">{dailyPublished.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Published {new Date(dailyPublished.publish_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {pages.length} pages
                </div>
                <Badge variant={getStatusBadgeVariant(dailyPublished.status)}>
                  {getStatusLabel(dailyPublished.status)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pages Grid */}
          {pages.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Book Pages</h2>
                <span className="text-sm text-muted-foreground">
                  {pages.length} pages
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages.map((page) => (
                  <TeacherOnly
                    key={page.id}
                    fallback={
                      <UserPageCard
                        page={page}
                        bookId={dailyPublished.book_id}
                      />
                    }
                  >
                    {viewMode === 'teacher' ? (
                      <PageCard
                        page={page}
                        bookId={dailyPublished.book_id}
                      />
                    ) : (
                      <UserPageCard
                        page={page}
                        bookId={dailyPublished.book_id}
                      />
                    )}
                  </TeacherOnly>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-32 space-y-4">
                <BookOpen className="w-12 h-12 text-muted-foreground" />
                <p className="text-muted-foreground">No pages available yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </Container>
    </PageLayout>
  );
}