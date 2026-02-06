import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GalleryImage {
  url: string;
  label: string;
  category: 'cover' | 'educational' | 'content' | 'coloring';
}

interface SocialImageGalleryProps {
  bookId: string;
  selectedUrls: string[];
  onSelectionChange: (urls: string[]) => void;
  maxSelection?: number;
}

export function SocialImageGallery({
  bookId,
  selectedUrls,
  onSelectionChange,
  maxSelection = 20,
}: SocialImageGalleryProps) {
  const { data: images, isLoading } = useQuery({
    queryKey: ['social-gallery-images', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_image_urls')
        .select('image_url, text_image_url, printable_coloring_image_url, pages!inner(page_type, page_number)')
        .eq('book_id', bookId)
        .eq('is_latest', true)
        .order('pages(page_number)', { ascending: true });

      if (error) throw error;

      const gallery: GalleryImage[] = [];

      data?.forEach((row: any) => {
        const pageType = row.pages?.page_type;
        const pageNum = row.pages?.page_number;

        // Cover & Educational: use image_url
        if ((pageType === 'cover' || pageType === 'educational') && row.image_url) {
          gallery.push({
            url: row.image_url,
            label: pageType === 'cover' ? 'Cover' : 'Educational',
            category: pageType as 'cover' | 'educational',
          });
        }

        // Content pages: use text_image_url
        if (pageType === 'content' && row.text_image_url) {
          const letter = pageNum !== undefined ? String.fromCharCode(64 + pageNum) : '';
          gallery.push({
            url: row.text_image_url,
            label: `Content ${letter}`.trim(),
            category: 'content',
          });
        }

        // Coloring pages: use printable_coloring_image_url
        if (row.printable_coloring_image_url) {
          const letter = pageNum !== undefined && pageType === 'content'
            ? String.fromCharCode(64 + pageNum)
            : '';
          gallery.push({
            url: row.printable_coloring_image_url,
            label: `Coloring ${letter}`.trim(),
            category: 'coloring',
          });
        }
      });

      return gallery;
    },
    staleTime: 5 * 60 * 1000,
  });

  const toggleSelection = (url: string) => {
    if (selectedUrls.includes(url)) {
      onSelectionChange(selectedUrls.filter(u => u !== url));
    } else if (selectedUrls.length < maxSelection) {
      onSelectionChange([...selectedUrls, url]);
    }
  };

  const clearAll = () => onSelectionChange([]);

  if (isLoading) {
    return (
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Select Images</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!images || images.length === 0) return null;

  // Group images by category
  const coverEducational = images.filter(img => img.category === 'cover' || img.category === 'educational');
  const content = images.filter(img => img.category === 'content');
  const coloring = images.filter(img => img.category === 'coloring');

  const groups = [
    { label: 'Cover / Educational', items: coverEducational },
    { label: 'Content', items: content },
    { label: 'Coloring', items: coloring },
  ].filter(g => g.items.length > 0);

  return (
    <div className="space-y-3 pt-2 border-t">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Select Images ({selectedUrls.length}/{maxSelection})
        </span>
        {selectedUrls.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={(e) => { e.stopPropagation(); clearAll(); }}
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {groups.map(group => (
        <div key={group.label} className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {group.label}
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {group.items.map((img) => {
              const selectionIndex = selectedUrls.indexOf(img.url);
              const isSelected = selectionIndex !== -1;
              const badgeNumber = selectionIndex + 1;

              return (
                <button
                  key={img.url}
                  type="button"
                  className="relative rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={(e) => { e.stopPropagation(); toggleSelection(img.url); }}
                >
                  <AspectRatio ratio={1}>
                    <img
                      src={img.url}
                      alt={img.label}
                      className={cn(
                        "w-full h-full object-cover transition-all",
                        isSelected ? "ring-2 ring-primary brightness-95" : "hover:brightness-90"
                      )}
                      loading="lazy"
                    />
                  </AspectRatio>
                  {isSelected && (
                    <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary-foreground">
                        {badgeNumber}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
