import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { generateDefaultOpenGraph, generateBookOpenGraph } from '@/utils/openGraph';
import { SITE_CONFIG, getAbsoluteUrl as getConfigAbsoluteUrl } from '@/config/site';
import type { SEOMetadata } from '@/types/openGraph';

/**
 * Generic OpenGraph hook for any page
 * Provides a simple way to add OpenGraph metadata to any component
 */
export const useOpenGraph = (
  title?: string,
  description?: string,
  image?: string,
  type?: 'website' | 'article' | 'book' | 'profile'
): SEOMetadata => {
  const location = useLocation();
  
  return useMemo(() => {
    const metadata = generateDefaultOpenGraph(title, description, location.pathname);
    
    if (type && type !== 'website') {
      metadata.type = type;
    }
    
    if (image) {
      metadata.image = {
        url: image.startsWith('http') ? image : getConfigAbsoluteUrl(image),
        width: SITE_CONFIG.defaultImage.width,
        height: SITE_CONFIG.defaultImage.height,
        alt: title || metadata.title
      };
      
      if (metadata.twitter) {
        metadata.twitter.image = metadata.image.url;
        metadata.twitter.imageAlt = metadata.image.alt;
      }
    }
    
    return metadata;
  }, [title, description, image, type, location.pathname]);
};

/**
 * Book-specific OpenGraph hook
 * Generates metadata optimized for book pages
 */
export const useBookOpenGraph = (
  bookTitle: string,
  bookDescription?: string,
  bookId?: string,
  coverImage?: string
): SEOMetadata => {
  return useMemo(() => {
    return generateBookOpenGraph(bookTitle, bookDescription, bookId, coverImage);
  }, [bookTitle, bookDescription, bookId, coverImage]);
};