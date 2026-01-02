import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { copyToClipboard } from '@/utils/clipboardHelpers';

export interface BookSlugQRCodeData {
  qrCodeImage: string;
  publicUrl: string;
  slug: string;
  isLoading: boolean;
  error?: string;
  generatedAt?: string;
}

export const useBookSlugQRCode = (bookId: string | undefined) => {
  const queryClient = useQueryClient();

  // Get book data including QR code information
  const { data: bookData, isLoading: qrLoading, error: qrError } = useQuery({
    queryKey: ['book-slug-qr', bookId],
    queryFn: async () => {
      if (!bookId) return null;
      
      const { data, error } = await supabase
        .from('books')
        .select('id, book_name, marketing_url, qr_code_image, qr_code_public_url, qr_code_config, qr_code_generated_at')
        .eq('id', bookId)
        .single();

      if (error) {
        console.error('Error fetching book QR code data:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!bookId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Generate QR code mutation
  const generateQRMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-book-slug-qr', {
        body: { bookId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-slug-qr', bookId] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('QR code generated successfully');
    },
    onError: (error) => {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  });

  // Download QR code function
  const downloadQRCode = () => {
    if (!bookData?.qr_code_image) return;

    const isSVG = bookData.qr_code_image.startsWith('data:image/svg+xml');
    const extension = isSVG ? 'svg' : 'png';
    const slug = bookData.marketing_url || 'book';

    const link = document.createElement('a');
    link.href = bookData.qr_code_image;
    link.download = `qr-code-${slug}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy URL function
  const copyPublicUrl = async () => {
    if (!bookData?.qr_code_public_url) return;

    try {
      await copyToClipboard(bookData.qr_code_public_url);
      toast.success('URL copied to clipboard');
    } catch (error) {
      console.error('Error copying URL:', error);
      toast.error('Failed to copy URL');
    }
  };

  const qrCodeData: BookSlugQRCodeData = {
    qrCodeImage: bookData?.qr_code_image || '',
    publicUrl: bookData?.qr_code_public_url || '',
    slug: bookData?.marketing_url || '',
    isLoading: qrLoading || generateQRMutation.isPending,
    error: qrError?.message || generateQRMutation.error?.message,
    generatedAt: bookData?.qr_code_generated_at
  };

  const hasQRCode = !!(bookData?.qr_code_public_url && bookData?.qr_code_image);

  return {
    qrCodeData,
    bookName: bookData?.book_name,
    generateQRCode: () => bookId && generateQRMutation.mutate(bookId),
    downloadQRCode,
    copyPublicUrl,
    hasQRCode,
    isGenerating: generateQRMutation.isPending
  };
};
