import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DownloadBookImagesParams {
  bookId: string;
  bookName: string;
}

export const useDownloadBookImages = () => {
  return useMutation({
    mutationFn: async ({ bookId, bookName }: DownloadBookImagesParams) => {
      const { data, error } = await supabase.functions.invoke('download-book-images', {
        body: { bookId },
      });

      if (error) throw error;
      
      // The response is a blob (ZIP file)
      return { data, bookName };
    },
    onSuccess: ({ data, bookName }) => {
      // Create a blob from the response
      const blob = new Blob([data], { type: 'application/zip' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${bookName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-images.zip`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Images downloaded successfully!');
    },
    onError: (error) => {
      console.error('Download error:', error);
      toast.error('Failed to download images');
    },
  });
};
