/**
 * Page helper utilities - Clean page number handling
 * All page numbers are 1-based matching agent output exactly
 */

export interface ParsedPage {
  pageNumber: number;  // 1-based, exactly as agent outputs
  pageType: 'cover' | 'educational' | 'content';
  title: string;
  description: string;  // Full image prompt
}

export interface ParsedOutline {
  coverPage: ParsedPage | null;       // Page 1
  educationalPage: ParsedPage | null; // Page 2
  contentPages: ParsedPage[];         // Pages 3+
  allPages: Map<number, ParsedPage>;  // Lookup by page number
  totalPages: number;
}

/**
 * Parse complete book outline from chat messages
 * Returns structured data with page lookup by number
 */
export const parseBookOutline = (messages: any[]): ParsedOutline | null => {
  // Find last message with outline
  const outlineMsg = [...messages].reverse().find(
    msg => typeof msg.content === 'string' && /\*\*Page\s+\d+/i.test(msg.content)
  );
  
  if (!outlineMsg) return null;
  
  const content = outlineMsg.content as string;
  const allPages = new Map<number, ParsedPage>();
  
  // Parse all pages using regex
  const pagePattern = /\*\*Page\s+(\d+):?\s*([^*]*)\*\*\s*([\s\S]*?)(?=\n\*\*Page\s+\d+|$)/gi;
  let match;
  
  while ((match = pagePattern.exec(content)) !== null) {
    const pageNum = parseInt(match[1], 10);
    const rawTitle = (match[2] || '').trim().replace(/^:\s*/, '').replace(/:$/, '');
    const description = (match[3] || '').trim();
    
    // Determine page type based on number
    let pageType: 'cover' | 'educational' | 'content';
    if (pageNum === 1) pageType = 'cover';
    else if (pageNum === 2) pageType = 'educational';
    else pageType = 'content';
    
    allPages.set(pageNum, {
      pageNumber: pageNum,
      pageType,
      title: rawTitle || `Page ${pageNum}`,
      description
    });
  }
  
  if (allPages.size === 0) return null;
  
  // Build structured result
  const coverPage = allPages.get(1) || null;
  const educationalPage = allPages.get(2) || null;
  const contentPages = Array.from(allPages.values())
    .filter(p => p.pageType === 'content')
    .sort((a, b) => a.pageNumber - b.pageNumber);
  
  return {
    coverPage,
    educationalPage,
    contentPages,
    allPages,
    totalPages: allPages.size
  };
};

/**
 * Get page prompt by page number - direct lookup, no math
 */
export const getPagePrompt = (
  outline: ParsedOutline | null,
  pageNum: number
): string | null => {
  if (!outline) return null;
  const page = outline.allPages.get(pageNum);
  return page?.description || null;
};

/**
 * Extract all prompts as Record for book creation
 * Keys are page numbers (1-based), values are full prompts
 */
export const extractPromptsRecord = (
  outline: ParsedOutline | null
): Record<number, string> => {
  if (!outline) return {};
  
  const prompts: Record<number, string> = {};
  outline.allPages.forEach((page, pageNum) => {
    if (page.description) {
      prompts[pageNum] = page.description;
    }
  });
  
  return prompts;
};
