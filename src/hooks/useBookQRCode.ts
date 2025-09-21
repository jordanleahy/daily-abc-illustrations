import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import QRCode from 'qrcode'; // Temporarily disabled to isolate error
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDailyPublishedById } from './useDailyPublishedById';
import { QRCodeData, QRCodeDisplayStatus, BookQRCode, QRCodeConfig } from '@/types/bookQRCode';
import { toast } from 'sonner';

export const useBookQRCode = (bookId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [qrCodeImage, setQrCodeImage] = useState<string>('');

  // Get daily published data for this book
  const { data: qrRecord, isLoading: qrLoading, error: qrError } = useQuery({
    queryKey: ['book-qr-code', bookId],
    queryFn: async () => {
      if (!bookId || !user?.id) return null;

      const { data, error } = await supabase
        .from('book_qr_codes')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data ? {
        ...data,
        qr_code_config: data.qr_code_config as any as QRCodeConfig
      } as BookQRCode : null;
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
      queryClient.invalidateQueries({ queryKey: ['book-qr-code', bookId] });
      toast.success('QR code generated successfully');
    },
    onError: (error) => {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  });

  // Generate QR code image when we have a public URL
  useEffect(() => {
    const generateQRImage = async () => {
      if (!qrRecord?.public_url) {
        setQrCodeImage('');
        return;
      }

      try {
        // Temporarily disabled QRCode generation to isolate error
        // const qrDataURL = await QRCode.toDataURL(qrRecord.public_url, {
        //   width: qrRecord.qr_code_config?.size || 256,
        //   margin: qrRecord.qr_code_config?.margin || 2,
        //   color: {
        //     dark: qrRecord.qr_code_config?.color?.dark || '#000000',
        //     light: qrRecord.qr_code_config?.color?.light || '#FFFFFF'
        //   },
        //   errorCorrectionLevel: qrRecord.qr_code_config?.errorCorrectionLevel || 'M'
        // });
        
        // setQrCodeImage(qrDataURL);
        setQrCodeImage('data:image/png;base64,placeholder'); // Placeholder
      } catch (error) {
        console.error('Error generating QR code image:', error);
        setQrCodeImage('');
      }
    };

    generateQRImage();
  }, [qrRecord]);

  // Determine display status
  const status: QRCodeDisplayStatus = (dailyPublishedData?.status as QRCodeDisplayStatus) || 'not_published';

  // Download QR code function
  const downloadQRCode = () => {
    if (!qrCodeImage) return;

    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `qr-code-${bookId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy URL function
  const copyPublicUrl = async () => {
    if (!qrRecord?.public_url) return;

    try {
      await navigator.clipboard.writeText(qrRecord.public_url);
      toast.success('URL copied to clipboard');
    } catch (error) {
      console.error('Error copying URL:', error);
      toast.error('Failed to copy URL');
    }
  };

  const qrCodeData: QRCodeData = {
    qrCodeImage,
    publicUrl: qrRecord?.public_url || '',
    status,
    queuePosition: dailyPublishedData?.queue_position,
    isLoading: qrLoading || generateQRMutation.isPending,
    error: qrError?.message || generateQRMutation.error?.message
  };

  return {
    qrCodeData,
    generateQRCode: () => bookId && generateQRMutation.mutate(bookId),
    downloadQRCode,
    copyPublicUrl,
    hasQRCode: !!qrRecord,
    isGenerating: generateQRMutation.isPending
  };
};