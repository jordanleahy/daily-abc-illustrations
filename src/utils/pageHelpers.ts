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
 * Get page title by page number - direct lookup, no math
 */
export const getPageTitle = (
  outline: ParsedOutline | null,
  pageNum: number
): string | null => {
  if (!outline) return null;
  return outline.allPages.get(pageNum)?.title || null;
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

// ============= Outline Validation =============

export interface OutlineValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate that outline follows required page structure:
 * - Page 1 must be Cover
 * - Page 2 must be Educational Focus
 * - Content pages start at Page 3
 */
export const validateOutlineStructure = (
  outline: ParsedOutline | null,
  bookType?: string
): OutlineValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!outline) {
    return { valid: false, errors: ['No outline found'], warnings: [] };
  }

  // Check Page 1 is Cover
  const page1 = outline.allPages.get(1);
  if (!page1) {
    errors.push('Missing Page 1 (Cover)');
  } else if (page1.pageType !== 'cover') {
    // Check if title suggests it's actually a cover
    const isCoverTitle = page1.title.toLowerCase().includes('cover');
    if (!isCoverTitle) {
      errors.push(`Page 1 should be Cover, but found: "${page1.title}" (type: ${page1.pageType})`);
    }
  }

  // Check Page 2 is Educational Focus
  const page2 = outline.allPages.get(2);
  if (!page2) {
    errors.push('Missing Page 2 (Educational Focus)');
  } else if (page2.pageType !== 'educational') {
    const isEducationalTitle = 
      page2.title.toLowerCase().includes('educational') ||
      page2.title.toLowerCase().includes('focus') ||
      page2.description.toLowerCase().includes('badge');
    if (!isEducationalTitle) {
      errors.push(`Page 2 should be Educational Focus, but found: "${page2.title}" (type: ${page2.pageType})`);
    }
  }

  // Check content pages start at Page 3
  const firstContentPage = outline.contentPages[0];
  if (firstContentPage && firstContentPage.pageNumber < 3) {
    errors.push(`Content pages should start at Page 3, but first content page is Page ${firstContentPage.pageNumber}`);
  }

  // Book-type specific validation
  if (bookType === 'rhyming') {
    // Rhyming books should have 12 pages total
    if (outline.totalPages !== 12) {
      warnings.push(`Rhyming books should have 12 pages, found ${outline.totalPages}`);
    }
    
    // Check rhyming couplet format in content pages
    outline.contentPages.forEach(page => {
      const hasCoupletIndicator = 
        page.title.includes('/') || 
        page.title.includes(',') || 
        page.title.includes('\n');
      if (!hasCoupletIndicator) {
        warnings.push(`Page ${page.pageNumber}: Title may not be in rhyming couplet format`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Quick check if outline has valid page structure
 * Returns false if Page 1 is not Cover or Page 2 is not Educational Focus
 */
export const hasValidPageStructure = (outline: ParsedOutline | null): boolean => {
  if (!outline) return false;
  
  const page1 = outline.allPages.get(1);
  const page2 = outline.allPages.get(2);
  
  if (!page1 || !page2) return false;
  
  const page1Valid = page1.pageType === 'cover' || page1.title.toLowerCase().includes('cover');
  const page2Valid = page2.pageType === 'educational' || 
    page2.title.toLowerCase().includes('educational') ||
    page2.title.toLowerCase().includes('focus');
  
  return page1Valid && page2Valid;
};
