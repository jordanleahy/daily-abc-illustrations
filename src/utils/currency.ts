/**
 * Currency utility functions for converting pennies to dollar amounts
 * Conversion rate: 100 pennies = $1.00
 */

/**
 * Formats pennies as US currency
 * @param pennies - The number of pennies to convert
 * @returns Formatted currency string (e.g., "$1.60")
 */
export function formatPenniesAsCurrency(pennies: number): string {
  const dollars = pennies / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * @deprecated Use formatPenniesAsCurrency instead
 */
export const formatCoinsAsCurrency = formatPenniesAsCurrency;
