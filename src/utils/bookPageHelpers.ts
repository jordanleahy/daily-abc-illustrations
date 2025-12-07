import { Page } from '@/types/book';

/**
 * Filter pages to get only the cover page
 */
export const getCoverPage = (pages: Page[] | undefined): Page | null => {
  if (!pages) return null;
  return pages.find(p => p.page_type === 'cover') || null;
};

/**
 * Filter pages to get only content pages (excludes cover and educational pages)
 */
export const getContentPages = (pages: Page[] | undefined): Page[] => {
  if (!pages) return [];
  return pages
    .filter(p => p.page_type === 'content')
    .sort((a, b) => a.page_number - b.page_number);
};

/**
 * Filter pages to get the educational focus page
 */
export const getEducationalPage = (pages: Page[] | undefined): Page | null => {
  if (!pages) return null;
  return pages.find(p => p.page_type === 'educational') || null;
};

/**
 * Get all pages sorted by page number
 */
export const getSortedPages = (pages: Page[] | undefined): Page[] => {
  if (!pages) return [];
  return [...pages].sort((a, b) => a.page_number - b.page_number);
};
