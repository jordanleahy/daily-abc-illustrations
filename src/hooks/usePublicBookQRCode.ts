import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicBookQRData {
  qr_code_image: string | null;
  qr_code_public_url: string | null;
  qr_code_generated_at: string | null;
}

export const usePublicBookQRCode = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ['public-book-qr', bookId],
    queryFn: async () => {
      if (!bookId) return null;
      
      const { data, error } = await supabase
        .from('books')
        .select('qr_code_image, qr_code_public_url, qr_code_generated_at')
        .eq('id', bookId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching public book QR code:', error);
        return null;
      }
      
      return data as PublicBookQRData | null;
    },
    enabled: !!bookId,
    staleTime: 1000 * 60 * 60, // 1 hour - QR codes rarely change
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
