import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { QRCodeData, QRCodeDisplayStatus, QRCodeConfig } from '@/types/bookQRCode';
import { toast } from 'sonner';

export const useBookQRCode = (bookId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get daily published data including QR code information
  const { data: dailyPublishedData, isLoading: qrLoading, error: qrError } = useQuery({
    queryKey: ['daily-published-with-qr', bookId],
    queryFn: async () => {
      if (!bookId) return null;
      
      const { data, error } = await supabase
        .from('daily_published')
        .select('*')
        .eq('book_id', bookId)
        .eq('is_active', true)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching daily published with QR code:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      queryClient.invalidateQueries({ queryKey: ['daily-published-with-qr', bookId] });
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
    if (!dailyPublishedData?.qr_code_image) return;

    // Determine file extension based on data URL type
    const isSVG = dailyPublishedData.qr_code_image.startsWith('data:image/svg+xml');
    const extension = isSVG ? 'svg' : 'png';

    const link = document.createElement('a');
    link.href = dailyPublishedData.qr_code_image;
    link.download = `qr-code-${dailyPublishedData.title || 'book'}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy URL function
  const copyPublicUrl = async () => {
    if (!dailyPublishedData?.qr_code_public_url) return;

    try {
      await navigator.clipboard.writeText(dailyPublishedData.qr_code_public_url);
      toast.success('URL copied to clipboard');
    } catch (error) {
      console.error('Error copying URL:', error);
      toast.error('Failed to copy URL');
    }
  };

  const qrCodeData: QRCodeData = {
    qrCodeImage: dailyPublishedData?.qr_code_image || '',
    publicUrl: dailyPublishedData?.qr_code_public_url || '',
    status,
    publishDate: dailyPublishedData?.publish_date,
    isLoading: qrLoading || generateQRMutation.isPending,
    error: qrError?.message || generateQRMutation.error?.message,
    generatedAt: dailyPublishedData?.qr_code_generated_at
  };

  return {
    qrCodeData,
    generateQRCode: () => bookId && generateQRMutation.mutate(bookId),
    downloadQRCode,
    copyPublicUrl,
    hasQRCode: !!(dailyPublishedData?.qr_code_public_url && dailyPublishedData?.qr_code_image),
    isGenerating: generateQRMutation.isPending
  };
};