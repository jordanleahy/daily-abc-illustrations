import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { QRCodeData, QRCodeDisplayStatus, QRCodeConfig } from '@/types/bookQRCode';
import { toast } from 'sonner';

export const useBookQRCode = (bookId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get book data including QR code information
  const { data: bookData, isLoading: qrLoading, error: qrError } = useQuery({
    queryKey: ['book-with-qr', bookId],
    queryFn: async () => {
      if (!bookId || !user?.id) return null;

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!(bookId && user?.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get daily published status
  const { data: dailyPublishedData } = useQuery({
    queryKey: ['book-daily-published-status', bookId],
    queryFn: async () => {
      if (!bookId) return null;

      const { data, error } = await supabase
        .from('daily_published')
        .select('*')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
    enabled: !!bookId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Generate QR metadata mutation
  const generateQRMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-book-qr-metadata', {
        body: { bookId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-with-qr', bookId] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('QR code generated successfully');
    },
    onError: (error) => {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  });


  // Determine display status
  const status: QRCodeDisplayStatus = (dailyPublishedData?.status as QRCodeDisplayStatus) || 'not_published';

  // Download QR code function
  const downloadQRCode = () => {
    if (!bookData?.qr_code_image) return;

    // Determine file extension based on data URL type
    const isSVG = bookData.qr_code_image.startsWith('data:image/svg+xml');
    const extension = isSVG ? 'svg' : 'png';

    const link = document.createElement('a');
    link.href = bookData.qr_code_image;
    link.download = `qr-code-${bookData.book_name || 'book'}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy URL function
  const copyPublicUrl = async () => {
    if (!bookData?.qr_code_public_url) return;

    try {
      await navigator.clipboard.writeText(bookData.qr_code_public_url);
      toast.success('URL copied to clipboard');
    } catch (error) {
      console.error('Error copying URL:', error);
      toast.error('Failed to copy URL');
    }
  };

  const qrCodeData: QRCodeData = {
    qrCodeImage: bookData?.qr_code_image || '',
    publicUrl: bookData?.qr_code_public_url || '',
    status,
    publishDate: dailyPublishedData?.publish_date, // Use publish_date instead of queue_position
    isLoading: qrLoading || generateQRMutation.isPending,
    error: qrError?.message || generateQRMutation.error?.message,
    generatedAt: bookData?.qr_code_generated_at
  };

  return {
    qrCodeData,
    generateQRCode: () => bookId && generateQRMutation.mutate(bookId),
    downloadQRCode,
    copyPublicUrl,
    hasQRCode: !!(bookData?.qr_code_public_url && bookData?.qr_code_image),
    isGenerating: generateQRMutation.isPending
  };
};