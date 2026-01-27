import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { downloadBlob } from '@/services/pdfStorageService';

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
      
      // Ensure we have data
      if (!data) {
        throw new Error('No data received from server');
      }
      
      return { data, bookName };
    },
    onSuccess: ({ data, bookName }) => {
      // Create a blob from the response (which should be a Uint8Array)
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/zip' });
      const filename = `${bookName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-images.zip`;
      
      downloadBlob(blob, filename);
      toast.success('Images downloaded successfully!');
    },
    onError: (error) => {
      console.error('Download error:', error);
      toast.error('Failed to download images. Please try again.');
    },
  });
};
