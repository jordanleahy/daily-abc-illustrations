/**
 * Image aspect ratio configuration for consistent layouts
 * Prevents layout shifts by reserving space before images load
 */

export const IMAGE_ASPECTS = {
  'book-page': 'aspect-square',
  'book-cover': 'aspect-[3/4]',
  'thumbnail': 'aspect-video',
  'hero': 'aspect-[16/9]',
  'card': 'aspect-square',
  'library': 'aspect-video',
} as const;

export type ImageAspectType = keyof typeof IMAGE_ASPECTS;

/**
 * Get aspect ratio class for an image type
 */
export function getImageAspect(type: ImageAspectType = 'book-page'): string {
  return IMAGE_ASPECTS[type];
}
