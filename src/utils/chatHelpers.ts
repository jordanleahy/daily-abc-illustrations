/**
 * Chat utility functions for parsing and processing chat messages
 */

export interface PageDetail {
  pageNumber: number;
  title: string;
  description: string;
}

/**
 * Sanitize title by removing all quotes and apostrophes
 */
const sanitizeTitle = (title: string): string => {
  return title
    .replace(/["'`'''""]/g, '') // Remove all types of quotes and apostrophes
    .trim();
};

/**
 * Parse page details from chat messages containing book outline
 */
export const parsePageDetailsFromMessages = (messages: any[]): PageDetail[] | null => {
  // Find the last message (assistant or user) containing the book outline
  const lastMsgWithPages = [...messages].reverse().find(
    (msg) => typeof msg.content === 'string' && /\*\*Page\s+\d+/i.test(msg.content)
  );
  
  if (!lastMsgWithPages || typeof lastMsgWithPages.content !== 'string') {
    return null;
  }
  
  const content = lastMsgWithPages.content as string;
  
  // Flexible pattern:
  // Matches "**Page N ...** Description..." where title/descriptor may include parentheses
  // and description may be on the same line or following lines, up to next **Page N or end
  const pagePattern = /\*\*Page\s+(\d+)([^*]*)\*\*\s*([\s\S]*?)(?=\n\*\*Page\s+\d+|$)/gi;
  const pages: PageDetail[] = [];
  let match: RegExpExecArray | null;
  
  while ((match = pagePattern.exec(content)) !== null) {
    const [, pageNum, rawHeader, rawDesc] = match;
    // Derive a reasonable title from header segment (remove leading colon/space and trailing colon)
    let header = (rawHeader || '').trim(); // e.g. ": \"I\"" or " (Big/Small):"
    header = header.replace(/^:\s*/, '').replace(/\*+$/, '').trim();
    // Common wrappers
    header = header.replace(/^\((.*)\):?$/, '$1').replace(/:$/, '').trim();
    // If still empty, fallback to "Page X"
    const title = header || `Page ${pageNum}`;
    
    const description = (rawDesc || '')
      .trim()
      .replace(/\n+/g, ' ') // single line
      .replace(/\s{2,}/g, ' ');
    
    pages.push({
      pageNumber: parseInt(pageNum, 10),
      title: sanitizeTitle(title), // Remove all quotes and apostrophes
      description
    });
  }
  
  return pages.length > 0 ? pages : null;
};

/**
 * Educational Focus metadata extracted from AI messages
 */
export interface EducationalFocusDetail {
  targetAge: string;
  learningType: string;
  specificSkill: string;
  imagePrompt: string;
}

/**
 * Parse educational focus section from chat messages
 */
export const parseEducationalFocus = (messages: any[]): EducationalFocusDetail | null => {
  const lastMsg = [...messages].reverse().find(
    msg => typeof msg.content === 'string' && /\*\*Educational Focus:\*\*/i.test(msg.content)
  );
  
  if (!lastMsg || typeof lastMsg.content !== 'string') {
    return null;
  }
  
  const content = lastMsg.content as string;
  
  // Extract the three badge fields
  const ageMatch = content.match(/Target Age:\s*([^\n]+)/i);
  const typeMatch = content.match(/Learning Type:\s*([^\n]+)/i);
  const skillMatch = content.match(/Specific Skill:\s*([^\n]+)/i);
  
  // Extract image prompt (paragraph after "Educational Focus Image:")
  const promptMatch = content.match(/\*\*Educational Focus Image:\*\*\s*([\s\S]*?)(?=\n\*\*Page\s+\d+|$)/i);
  
  if (!ageMatch || !typeMatch || !skillMatch || !promptMatch) return null;
  
  return {
    targetAge: ageMatch[1].trim(),
    learningType: typeMatch[1].trim(),
    specificSkill: skillMatch[1].trim(),
    imagePrompt: promptMatch[1].trim()
  };
};

/**
 * Extract book metadata (name and description) from messages
 */
export const getBookMetadata = (messages: any[]): { name: string, description: string } | null => {
  const lastAssistantMsg = [...messages].reverse().find(
    msg => msg.role === 'assistant' && 
    typeof msg.content === 'string' && 
    /\*\*Page\s+\d+:/i.test(msg.content)
  );
  
  if (!lastAssistantMsg || typeof lastAssistantMsg.content !== 'string') {
    return null;
  }
  
  // Extract book name and description from the outline message
  const nameMatch = lastAssistantMsg.content.match(/["']([^"']+)["']/);
  const name = nameMatch ? nameMatch[1] : 'Your Book';
  
  // Look for description in the message
  const descMatch = lastAssistantMsg.content.match(/(?:about|theme|story):\s*([^\n]+)/i);
  const description = descMatch ? descMatch[1] : 'An educational children\'s book';
  
  return { name, description };
};
