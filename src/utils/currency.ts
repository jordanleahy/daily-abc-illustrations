/**
 * Currency utility functions for converting coins to dollar amounts
 * Conversion rate: 100 coins = $1.00
 */

/**
 * Formats coins as US currency
 * @param coins - The number of coins to convert
 * @returns Formatted currency string (e.g., "$1.60")
 */
export function formatCoinsAsCurrency(coins: number | undefined): string {
  const dollars = (coins ?? 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}
