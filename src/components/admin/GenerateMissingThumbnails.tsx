import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Image, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

interface BookWithoutThumbnail {
  id: string;
  title: string;
  book_id: string;
  book_name: string;
}

export const GenerateMissingThumbnails = () => {
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [booksWithoutThumbnails, setBooksWithoutThumbnails] = useState<BookWithoutThumbnail[]>([]);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

  const checkMissingThumbnails = async () => {
    setIsLoading(true);
    try {
      // Find queued books without SEO metadata
      const { data: dailyPublished, error: dpError } = await supabase
        .from('daily_published')
        .select(`
          id,
          title,
          book_id,
          book:books(book_name)
        `)
        .eq('status', 'queued');

      if (dpError) throw dpError;

      // Check which ones are missing SEO metadata
      const { data: seoData, error: seoError } = await supabase
        .from('seo_metadata')
        .select('daily_published_id')
        .in('daily_published_id', dailyPublished?.map(dp => dp.id) || [])
        .eq('is_latest', true)
        .eq('is_active', true);

      if (seoError) throw seoError;

      const seoIds = new Set(seoData?.map(s => s.daily_published_id));
      const missing = dailyPublished?.filter(dp => !seoIds.has(dp.id)).map(dp => ({
        id: dp.id,
        title: dp.title,
        book_id: dp.book_id,
        book_name: (dp.book as any)?.book_name || 'Unknown'
      })) || [];

      setBooksWithoutThumbnails(missing);
      
      if (missing.length === 0) {
        toast.success('All queued books have thumbnails!');
      } else {
        toast.info(`Found ${missing.length} books without thumbnails`);
      }
    } catch (error) {
      console.error('Error checking thumbnails:', error);
      toast.error('Failed to check for missing thumbnails');
    } finally {
      setIsLoading(false);
    }
  };

  const generateThumbnail = async (bookId: string, dailyPublishedId: string, bookName: string) => {
    if (!user) return;

    setGeneratingIds(prev => new Set(prev).add(dailyPublishedId));
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) throw new Error('Not authenticated');

      // Step 1: Generate the thumbnail image
      toast.loading(`Generating thumbnail for ${bookName}...`, { id: dailyPublishedId });
      
      const { data: thumbnailData, error: thumbnailError } = await supabase.functions.invoke('generate-book-thumbnail', {
        body: {
          bookId,
          userId: user.id
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (thumbnailError) throw thumbnailError;
      if (!thumbnailData?.success) throw new Error(thumbnailData?.error || 'Failed to generate thumbnail');

      const ogImageUrl = thumbnailData.thumbnailUrl;

      // Step 2: Generate SEO metadata with the thumbnail URL
      const { data: seoData, error: seoError } = await supabase.functions.invoke('generate-seo-metadata', {
        body: {
          bookId,
          dailyPublishedId,
          contentTitle: bookName,
          ogImageUrl,
          userId: user.id
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (seoError) throw seoError;
      if (!seoData?.success) throw new Error(seoData?.error || 'Failed to generate SEO metadata');

      toast.success(`Thumbnail generated for ${bookName}`, { id: dailyPublishedId });
      
      // Remove from list
      setBooksWithoutThumbnails(prev => prev.filter(b => b.id !== dailyPublishedId));
      
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      toast.error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
        id: dailyPublishedId 
      });
    } finally {
      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(dailyPublishedId);
        return next;
      });
    }
  };

  const generateAllMissing = async () => {
    for (const book of booksWithoutThumbnails) {
      await generateThumbnail(book.book_id, book.id, book.book_name);
      // Wait a bit between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5" />
          Generate Missing Thumbnails
        </CardTitle>
        <CardDescription>
          Find and generate thumbnails for queued books without OpenGraph images
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={checkMissingThumbnails}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              'Check for Missing Thumbnails'
            )}
          </Button>
          
          {booksWithoutThumbnails.length > 0 && (
            <Button 
              onClick={generateAllMissing}
              disabled={generatingIds.size > 0}
            >
              Generate All ({booksWithoutThumbnails.length})
            </Button>
          )}
        </div>

        {booksWithoutThumbnails.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Books Missing Thumbnails:</h4>
            {booksWithoutThumbnails.map(book => (
              <div 
                key={book.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{book.book_name}</p>
                  <p className="text-xs text-muted-foreground">{book.title}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => generateThumbnail(book.book_id, book.id, book.book_name)}
                  disabled={generatingIds.has(book.id)}
                >
                  {generatingIds.has(book.id) ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
