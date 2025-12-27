/**
 * Points utility functions for formatting point values
 */

/**
 * Formats a number as points display
 * @param points - The number of points to format
 * @returns Formatted points string (e.g., "150 points")
 */
export function formatPoints(points: number): string {
  return `${points} points`;
}

/**
 * @deprecated Use formatPoints instead
 */
export const formatPenniesAsCurrency = formatPoints;

/**
 * @deprecated Use formatPoints instead
 */
export const formatCoinsAsCurrency = formatPoints;
