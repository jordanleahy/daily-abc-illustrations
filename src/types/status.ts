/**
 * Publication status enum for content lifecycle management
 * Used across books, pages, and other publishable content
 */
export enum PublicationStatus {
  /** Content is being created/edited and not visible to public */
  DRAFT = 'draft',
  /** Content is live and available to users */
  PUBLISHED = 'published',
  /** Content is hidden from normal view but retained */
  ARCHIVED = 'archived'
}