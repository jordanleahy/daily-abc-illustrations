/**
 * Image fit rules for book page illustrations.
 *
 * Generated illustrations are square, so they should fill the whole square
 * container (`object-cover`). Opposites books are the exception: their pages
 * are split/side-by-side comparisons where cropping would cut off one half,
 * so they keep `object-contain`.
 */

export function isOppositesCategory(category?: string | null): boolean {
  return Boolean(category && category.toLowerCase().includes('opposite'));
}

/** Returns the Tailwind object-fit class for a book page image. */
export function getImageFitClass(category?: string | null): string {
  return isOppositesCategory(category) ? 'object-contain' : 'object-cover';
}
