-- Update ABC agent Step 6 to output markdown format (not JSON)
UPDATE agents
SET instructions = REPLACE(
  instructions,
  '**Step 6: Page-by-Page Generation**
Once approved, generate ALL pages at once:
- Cover page (pageType: "cover", pageNumber: 0)
- Educational focus page (pageType: "educational", pageNumber: 1) 
- 24 content pages for letters A-Z (pageType: "content", pageNumber: 2-25)',
  '**Step 6: Page-by-Page Generation (MARKDOWN FORMAT REQUIRED)**
Once approved, generate ALL 28 pages in this EXACT markdown format:

**Cover: [Book Title]**
[Cover image prompt following the 200-350 char requirements...]

**Educational Focus:**
Target Age: [selected age range]
Learning Type: Letter Recognition
Specific Skill: Alphabet Learning

**Educational Focus Image:**
[Educational page image prompt...]

**Page 1: (a) is for [word]**
[Image prompt for letter A...]

**Page 2: (b) is for [word]**
[Image prompt for letter B...]

... continue through all 26 letters ...

**Page 26: (z) is for [word]**
[Image prompt for letter Z...]

CRITICAL FORMAT RULES:
- Use **Page N:** prefix for content pages (NOT "pageType", NOT JSON)
- Include letter in parentheses: "(a) is for apple"
- Image prompt on lines AFTER the title
- NO JSON output - markdown ONLY
- Each page separated by blank line'
)
WHERE type = 'book-creation-abc' AND is_latest = true;