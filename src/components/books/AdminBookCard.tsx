import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { BookImage } from '@/components/ui/book-image';
import { Calendar, Eye, Star, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getBookTypeDisplayName } from '@/types/bookType';
import { getThemeDisplayName } from '@/types/characterTheme';
import { useToggleBookHighlight } from '@/hooks/useToggleBookHighlight';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AdminBookCardProps {
  book: any;
  onDelete?: (bookId: string, bookName: string) => void;
  isDeleting?: boolean;
}

/**
 * Simplified admin book card for /all-books view
 * Shows essential info and quick actions - click to navigate to detail page for full editing
 */
export function AdminBookCard({ book, onDelete, isDeleting }: AdminBookCardProps) {
  const navigate = useNavigate();
  const { mutate: toggleHighlight, isPending: isHighlightLoading } = useToggleBookHighlight();

  const handleCardClick = () => {
    navigate(`/all-books/${book.id}`);
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-2 mb-2">
              {book.book_name}
            </CardTitle>
            {/* Metadata badges */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-xs">
                {book.status}
              </Badge>
              {book.metadata?.bookType && (
                <Badge variant="outline" className="text-xs">
                  {getBookTypeDisplayName(book.metadata.bookType)}
                </Badge>
              )}
              {book.metadata?.characterTheme && (
                <Badge variant="outline" className="text-xs">
                  {getThemeDisplayName(book.metadata.characterTheme)}
                </Badge>
              )}
              {book.metadata?.targetAge && (
                <Badge variant="outline" className="text-xs capitalize">
                  {book.metadata.targetAge.replace(/-/g, ' ')}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant={book.is_highlighted ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                toggleHighlight({ bookId: book.id, isHighlighted: book.is_highlighted || false });
              }}
              disabled={isHighlightLoading}
              title={book.is_highlighted ? "Remove from landing" : "Highlight on landing"}
            >
              {isHighlightLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Star className={`w-3.5 h-3.5 ${book.is_highlighted ? 'fill-current' : ''}`} />
              )}
            </Button>
            
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    disabled={isDeleting}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Book</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{book.book_name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(book.id, book.book_name);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 space-y-2">
        {/* Cover image */}
        <AspectRatio ratio={1} className="bg-muted rounded-lg overflow-hidden">
          {book.coverImageUrl ? (
            <BookImage
              src={book.coverImageUrl}
              alt={book.book_name}
              className="w-full h-full object-cover"
              enableMobileSave={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Eye className="w-8 h-8" />
            </div>
          )}
        </AspectRatio>
        
        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(book.created_at).toLocaleDateString()}
          </div>
          {book.total_pages && (
            <span>{book.total_pages} pages</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
