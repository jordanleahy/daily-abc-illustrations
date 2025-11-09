/**
 * SEO Metadata Type System
 * 
 * This file provides standardized types for SEO metadata across the application.
 * It bridges the gap between database schema and frontend display needs.
 * 
 * TYPE USAGE GUIDE:
 * ================
 * 
 * Database Operations:
 * - Use `SeoMetadataRow` when querying/inserting into seo_metadata table
 * - Use `SeoMetadataInsert` when creating new SEO records
 * 
 * Frontend Display:
 * - Use `SEOMetadata` (from openGraph.ts) for meta tags and OpenGraph
 * - Use `BookSEO` for book library display
 * - Use `DailyPublishedSEO` for homepage rotation display
 * 
 * Transformations:
 * - Use `transformToSEOMetadata()` to convert DB row to frontend meta tags
 * - Use `transformToBookSEO()` for library book cards
 */

// =============================================================================
// DATABASE TYPES (Mirror Supabase Schema)
// =============================================================================

export type OptimizationStatus = 'pending' | 'processing' | 'complete' | 'failed';

/**
 * Complete row from seo_metadata table
 * Matches database schema after Phase 0.1 migration
 */
export interface SeoMetadataRow {
  id: string;
  created_at: string;
  updated_at: string;
  
  // References (at least one must be non-null)
  book_id: string | null;                    // Direct book reference (for library)
  daily_published_id: string | null;         // Optional daily published variant
  user_id: string;
  
  // SEO Content
  seo_title: string;
  seo_description: string;
  og_image_url: string | null;
  
  // Versioning
  version_number: number;
  is_latest: boolean;
  is_active: boolean;
  
  // Status & Metadata
  optimization_status: OptimizationStatus;
  optimized_at: string | null;
  source_data: Record<string, any> | null;
  generation_metadata: Record<string, any> | null;
  text_overlay_config: Record<string, any> | null;
}

/**
 * Insert type for creating new SEO metadata
 * All fields except auto-generated ones
 */
export interface SeoMetadataInsert {
  book_id?: string | null;
  daily_published_id?: string | null;
  user_id: string;
  seo_title: string;
  seo_description: string;
  og_image_url?: string | null;
  version_number?: number;
  is_latest?: boolean;
  is_active?: boolean;
  optimization_status?: OptimizationStatus;
  optimized_at?: string | null;
  source_data?: Record<string, any> | null;
  generation_metadata?: Record<string, any> | null;
  text_overlay_config?: Record<string, any> | null;
}

/**
 * Update type for modifying SEO metadata
 */
export interface SeoMetadataUpdate {
  seo_title?: string;
  seo_description?: string;
  og_image_url?: string | null;
  is_latest?: boolean;
  is_active?: boolean;
  optimization_status?: OptimizationStatus;
  optimized_at?: string | null;
  text_overlay_config?: Record<string, any> | null;
}

// =============================================================================
// FRONTEND DISPLAY TYPES
// =============================================================================

/**
 * Book-level SEO for library display
 * Simplified view for book cards and detail pages
 */
export interface BookSEO {
  id: string;
  bookId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  isLatest: boolean;
  optimizedAt: string | null;
  
  // Optional: Include if needed for daily published status
  dailyPublishedId?: string | null;
  inQueue?: boolean;
}

/**
 * Daily Published SEO for homepage rotation
 * Extended view with publish status
 */
export interface DailyPublishedSEO extends BookSEO {
  dailyPublishedId: string;
  publishStatus: 'draft' | 'queued' | 'active' | 'expired';
  publishDate: string | null;
  expiresAt: string | null;
}

/**
 * SEO Generation Request
 * Parameters for creating new SEO metadata
 */
export interface SeoGenerationRequest {
  bookId: string;
  dailyPublishedId?: string;
  contentTitle: string;
  bookDescription?: string;
  ogImageUrl?: string;
  userId?: string;
}

/**
 * SEO Generation Response
 * Result from SEO generation edge function
 */
export interface SeoGenerationResponse {
  success: boolean;
  seoMetadataId?: string;
  version?: number;
  optimizedTitle?: string;
  optimizedDescription?: string;
  error?: string;
}

// =============================================================================
// TRANSFORMATION UTILITIES
// =============================================================================

/**
 * Transform database row to frontend SEOMetadata (for meta tags)
 * 
 * @example
 * const dbRow = await supabase.from('seo_metadata').select('*').single();
 * const metaTags = transformToSEOMetadata(dbRow.data);
 */
export function transformToSEOMetadata(row: SeoMetadataRow | null): import('./openGraph').SEOMetadata | null {
  if (!row) return null;
  
  return {
    title: row.seo_title,
    description: row.seo_description,
    type: 'website',
    image: row.og_image_url ? {
      url: row.og_image_url,
      width: 1200,
      height: 630,
      alt: row.seo_title
    } : undefined,
    siteName: 'Daily ABC Illustrations',
    locale: 'en_US',
    twitter: {
      card: 'summary_large_image',
      title: row.seo_title,
      description: row.seo_description,
      image: row.og_image_url || undefined,
      imageAlt: row.seo_title
    }
  };
}

/**
 * Transform database row to BookSEO (for library display)
 * 
 * @example
 * const dbRow = await supabase.from('seo_metadata').select('*').eq('book_id', bookId).single();
 * const bookSeo = transformToBookSEO(dbRow.data);
 */
export function transformToBookSEO(row: SeoMetadataRow | null): BookSEO | null {
  if (!row || !row.book_id) return null;
  
  return {
    id: row.id,
    bookId: row.book_id,
    title: row.seo_title,
    description: row.seo_description,
    thumbnailUrl: row.og_image_url,
    isLatest: row.is_latest,
    optimizedAt: row.optimized_at,
    dailyPublishedId: row.daily_published_id,
    inQueue: !!row.daily_published_id
  };
}

/**
 * Transform database row to DailyPublishedSEO (for homepage display)
 * Requires additional daily_published data
 * 
 * @example
 * const { data } = await supabase
 *   .from('seo_metadata')
 *   .select('*, daily_published!inner(status, publish_date, expires_at)')
 *   .eq('daily_published_id', dpId)
 *   .single();
 * const dpSeo = transformToDailyPublishedSEO(data);
 */
export function transformToDailyPublishedSEO(
  row: SeoMetadataRow & { daily_published?: any } | null
): DailyPublishedSEO | null {
  if (!row || !row.daily_published_id || !row.daily_published) return null;
  
  const bookSeo = transformToBookSEO(row);
  if (!bookSeo) return null;
  
  return {
    ...bookSeo,
    dailyPublishedId: row.daily_published_id,
    publishStatus: row.daily_published.status,
    publishDate: row.daily_published.publish_date,
    expiresAt: row.daily_published.expires_at
  };
}

/**
 * Create SEO insert object for book-level SEO
 * 
 * @example
 * const insert = createBookSeoInsert({
 *   bookId: 'uuid',
 *   userId: 'uuid',
 *   title: 'Optimized Title',
 *   description: 'Optimized Description',
 *   imageUrl: 'https://...'
 * });
 * await supabase.from('seo_metadata').insert(insert);
 */
export function createBookSeoInsert(params: {
  bookId: string;
  userId: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  versionNumber?: number;
  sourceData?: Record<string, any>;
  metadata?: Record<string, any>;
}): SeoMetadataInsert {
  return {
    book_id: params.bookId,
    daily_published_id: null,
    user_id: params.userId,
    seo_title: params.title,
    seo_description: params.description,
    og_image_url: params.imageUrl || null,
    version_number: params.versionNumber || 1,
    is_latest: true,
    is_active: true,
    optimization_status: 'complete',
    optimized_at: new Date().toISOString(),
    source_data: params.sourceData || null,
    generation_metadata: params.metadata || null
  };
}

/**
 * Create SEO insert object for daily-published-specific SEO
 * Based on existing book SEO with daily_published_id
 * 
 * @example
 * const bookSeo = await getBookSeo(bookId);
 * const insert = createDailyPublishedSeoInsert({
 *   ...bookSeo,
 *   dailyPublishedId: 'uuid'
 * });
 * await supabase.from('seo_metadata').insert(insert);
 */
export function createDailyPublishedSeoInsert(params: {
  bookId: string;
  dailyPublishedId: string;
  userId: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  baseBookSeoId?: string;
  sourceData?: Record<string, any>;
  metadata?: Record<string, any>;
}): SeoMetadataInsert {
  return {
    book_id: params.bookId,
    daily_published_id: params.dailyPublishedId,
    user_id: params.userId,
    seo_title: params.title,
    seo_description: params.description,
    og_image_url: params.imageUrl || null,
    version_number: 1, // New version for daily published
    is_latest: true,
    is_active: true,
    optimization_status: 'complete',
    optimized_at: new Date().toISOString(),
    source_data: params.sourceData || null,
    generation_metadata: {
      ...params.metadata,
      adapted_for_daily_published: true,
      original_seo_id: params.baseBookSeoId
    }
  };
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate SEO metadata has at least one reference
 * Database constraint requires book_id OR daily_published_id
 */
export function validateSeoReference(insert: SeoMetadataInsert): boolean {
  return !!(insert.book_id || insert.daily_published_id);
}

/**
 * Validate SEO title length (max 60 chars for optimal display)
 */
export function validateSeoTitle(title: string): boolean {
  return title.length > 0 && title.length <= 60;
}

/**
 * Validate SEO description length (max 160 chars for optimal display)
 */
export function validateSeoDescription(description: string): boolean {
  return description.length > 0 && description.length <= 160;
}

/**
 * Check if SEO metadata is book-level (no daily_published_id)
 */
export function isBookLevelSeo(row: SeoMetadataRow): boolean {
  return row.book_id !== null && row.daily_published_id === null;
}

/**
 * Check if SEO metadata is daily-published-specific
 */
export function isDailyPublishedSeo(row: SeoMetadataRow): boolean {
  return row.daily_published_id !== null;
}
