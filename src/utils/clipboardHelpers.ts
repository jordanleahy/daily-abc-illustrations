/**
 * Clipboard utility functions with mobile scroll prevention
 * Fixes the common issue where copying text on mobile causes unwanted page scrolling
 */

/**
 * Copy text to clipboard without causing scroll jump on mobile
 * This fixes the issue where mobile browsers scroll to hidden input elements during copy operations
 * 
 * @param text - The text to copy to clipboard
 * @returns Promise that resolves when copy is complete
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Store current scroll position
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  
  try {
    // Modern clipboard API with fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      
      // Restore scroll position immediately after copy
      window.scrollTo(scrollX, scrollY);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      
      // Make textarea invisible and prevent scrolling
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.width = '1px';
      textarea.style.height = '1px';
      textarea.style.padding = '0';
      textarea.style.border = 'none';
      textarea.style.outline = 'none';
      textarea.style.boxShadow = 'none';
      textarea.style.background = 'transparent';
      
      document.body.appendChild(textarea);
      
      // Select and copy
      textarea.focus();
      textarea.select();
      
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(textarea);
        // Restore scroll position
        window.scrollTo(scrollX, scrollY);
      }
    }
  } catch (error) {
    // Ensure scroll position is restored even on error
    window.scrollTo(scrollX, scrollY);
    throw error;
  }
}

/**
 * Prevents scroll jump during text selection on mobile
 * Useful for protecting specific elements from causing scroll during user text selection
 * 
 * @param element - The element to protect
 */
export function preventScrollOnSelect(element: HTMLElement): void {
  element.addEventListener('focus', (e) => {
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    
    // Restore scroll position on next frame
    requestAnimationFrame(() => {
      window.scrollTo(scrollX, scrollY);
    });
  }, { passive: true });
}
