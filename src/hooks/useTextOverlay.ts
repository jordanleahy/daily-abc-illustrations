import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createTextOverlay } from '@/utils/textOverlayProcessor';
import { processImage } from '@/utils/imageProcessor';
import type { TextOverlayConfig } from '@/types/textOverlay';

interface UseTextOverlayProps {
  pageId: string;
  bookId: string;
  userId: string;
}

export const useTextOverlay = ({ pageId, bookId, userId }: UseTextOverlayProps) => {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const applyTextOverlay = useMutation({
    mutationFn: async ({
      imageUrl,
      config,
    }: {
      imageUrl: string;
      config: TextOverlayConfig;
    }) => {
      setIsProcessing(true);

      try {
        // Create text overlay on canvas
        const overlayBlob = await createTextOverlay(imageUrl, config);

        // Process/compress the image
        const processed = await processImage(
          new File([overlayBlob], 'overlay.webp', { type: 'image/webp' }),
          {
            maxWidth: 1024,
            maxHeight: 1024,
            targetSizeBytes: 500 * 1024,
            quality: 0.85,
          }
        );

        // Get next version number
        const { data: existingImages } = await supabase
          .from('page_image_urls')
          .select('version_number')
          .eq('page_id', pageId)
          .order('version_number', { ascending: false })
          .limit(1);

        const nextVersion =
          existingImages && existingImages.length > 0
            ? existingImages[0].version_number + 1
            : 1;

        // Upload to Supabase Storage
        const timestamp = Date.now();
        const fileName = `${pageId}_v${nextVersion}_${timestamp}.webp`;
        const filePath = `${userId}/${bookId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('page-images')
          .upload(filePath, processed.blob, {
            contentType: 'image/webp',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('page-images').getPublicUrl(filePath);

        // Create new page_image_urls record with text overlay config
        const { data: newRecord, error: insertError } = await supabase
          .from('page_image_urls')
          .insert({
            page_id: pageId,
            book_id: bookId,
            user_id: userId,
            version_number: nextVersion,
            is_latest: true,
            image_url: publicUrl,
            generation_status: 'complete',
            source_type: 'user_uploaded',
            text_overlay_config: config,
            generation_completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return newRecord;
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['page-image-latest', pageId] });
      queryClient.invalidateQueries({ queryKey: ['page-image-versions', pageId] });
      toast.success('Text overlay applied successfully!');
    },
    onError: (error: any) => {
      console.error('Error applying text overlay:', error);
      toast.error(error.message || 'Failed to apply text overlay');
    },
  });

  return {
    applyTextOverlay: applyTextOverlay.mutate,
    isProcessing,
  };
};
