import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createTextOverlay } from '@/utils/textOverlayProcessor';
import { processImage } from '@/utils/imageProcessor';
import { toast } from 'sonner';
import { useState } from 'react';
import type { TextOverlayConfig } from '@/types/textOverlay';

interface UseBookThumbnailTextOverlayProps {
  bookId: string;
  dailyPublishedId: string;
  seoMetadataId: string;
  userId: string;
}

export const useBookThumbnailTextOverlay = ({
  bookId,
  dailyPublishedId,
  seoMetadataId,
  userId,
}: UseBookThumbnailTextOverlayProps) => {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const applyTextOverlay = useMutation({
    mutationFn: async ({ 
      imageUrl, 
      config 
    }: { 
      imageUrl: string; 
      config: TextOverlayConfig;
    }) => {
      setIsProcessing(true);

      try {
        // Fetch the base image without any text overlay
        const { data: baseMeta } = await supabase
          .from('seo_metadata')
          .select('og_image_url, version_number')
          .eq('daily_published_id', dailyPublishedId)
          .is('text_overlay_config', null)
          .order('version_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Use base image if found, otherwise fall back to provided imageUrl
        const baseUrl = baseMeta?.og_image_url || imageUrl;
        
        console.log('Applying text overlay to base image:', baseUrl === imageUrl ? 'current image (no base found)' : 'original base image');

        // Create text overlay on the base image (never on already-overlaid image)
        const overlayBlob = await createTextOverlay(baseUrl, config);

        // Process the image (compress to webp)
        const processed = await processImage(
          new File([overlayBlob], 'thumbnail-overlay.webp', { type: 'image/webp' }),
          {
            maxWidth: 1200,
            maxHeight: 630,
            format: 'image/webp',
            quality: 0.9,
          }
        );

        // Upload to Supabase Storage (book-covers bucket)
        const timestamp = Date.now();
        const fileName = `${bookId}/thumbnail-${timestamp}.webp`;

        const { error: uploadError } = await supabase.storage
          .from('book-covers')
          .upload(fileName, processed.blob, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('book-covers')
          .getPublicUrl(fileName);

        // Update seo_metadata with new thumbnail URL and text_overlay_config
        const { error: updateError } = await supabase
          .from('seo_metadata')
          .update({
            og_image_url: publicUrl,
            text_overlay_config: config as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', seoMetadataId);

        if (updateError) throw updateError;

        return { publicUrl, config };
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-metadata', dailyPublishedId] });
      queryClient.invalidateQueries({ queryKey: ['book-seo-metadata', bookId] });
      toast.success('Text overlay applied to thumbnail');
    },
    onError: (error: Error) => {
      console.error('Failed to apply text overlay to thumbnail:', error);
      toast.error('Failed to apply text overlay to thumbnail');
    },
  });

  const removeTextOverlay = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);

      try {
        // Get the current SEO metadata to find original thumbnail URL
        const { data: currentMeta, error: fetchError } = await supabase
          .from('seo_metadata')
          .select('*')
          .eq('daily_published_id', dailyPublishedId)
          .is('text_overlay_config', null)
          .order('version_number', { ascending: false })
          .limit(1)
          .single();

        if (fetchError || !currentMeta) {
          throw new Error('No original thumbnail found without text overlay');
        }

        // Fetch the original image
        const response = await fetch(currentMeta.og_image_url);
        const blob = await response.blob();

        // Process/compress the image
        const processed = await processImage(
          new File([blob], 'restored-thumbnail.webp', { type: 'image/webp' }),
          {
            maxWidth: 1200,
            maxHeight: 630,
            format: 'image/webp',
            quality: 0.9,
          }
        );

        // Upload to Supabase Storage
        const timestamp = Date.now();
        const fileName = `${bookId}/thumbnail-${timestamp}.webp`;

        const { error: uploadError } = await supabase.storage
          .from('book-covers')
          .upload(fileName, processed.blob, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('book-covers')
          .getPublicUrl(fileName);

        // Update seo_metadata with restored thumbnail URL and remove text_overlay_config
        const { error: updateError } = await supabase
          .from('seo_metadata')
          .update({
            og_image_url: publicUrl,
            text_overlay_config: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', seoMetadataId);

        if (updateError) throw updateError;

        return { publicUrl };
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-metadata', dailyPublishedId] });
      queryClient.invalidateQueries({ queryKey: ['book-seo-metadata', bookId] });
      toast.success('Text overlay removed from thumbnail');
    },
    onError: (error: Error) => {
      console.error('Failed to remove text overlay from thumbnail:', error);
      toast.error('Failed to remove text overlay from thumbnail');
    },
  });

  return {
    applyTextOverlay: applyTextOverlay.mutate,
    removeTextOverlay: removeTextOverlay.mutate,
    isProcessing,
    isApplyingOverlay: applyTextOverlay.isPending,
    isRemovingOverlay: removeTextOverlay.isPending,
  };
};
