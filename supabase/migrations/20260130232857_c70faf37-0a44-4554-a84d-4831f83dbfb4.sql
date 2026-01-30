-- Insert new shared template for outline format standardization
INSERT INTO public.shared_page_templates (
  template_key,
  version_number,
  content,
  is_latest,
  is_active,
  change_notes
) VALUES (
  'outline_format',
  1,
  '## CRITICAL: PAGE FORMAT RULES

When generating book outlines, you MUST use this EXACT format for each page:

**Page N: Title**
- Content description
- Additional details

### ✅ CORRECT FORMAT EXAMPLES:
```
**Page 1: Cover**
- Book title prominently displayed

**Page 2: Educational Focus**
- Three colorful badges

**Page 3: [Cat] is for C**
- A playful cat character
```

### ❌ FORBIDDEN FORMATS:
- NO markdown headings before page (### **Page N**)
- NO numbered lists (1. Page N:)
- NO plain text (Page N:) without bold
- NO variations in spacing or punctuation

### FORMAT ENFORCEMENT:
- Always use double asterisks: **Page N: Title**
- Always include colon after page number
- Title follows immediately after colon
- Content uses bullet points below title
- One blank line between pages',
  true,
  true,
  'Initial version - standardizes page format across all agents'
);