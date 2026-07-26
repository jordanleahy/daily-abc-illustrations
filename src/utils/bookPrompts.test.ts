import { describe, it, expect } from 'vitest';
import {
  finalizeCoverPrompt,
  extractOutlinePrompts,
  extractEditModePrompts,
  readPagePrompt,
  buildOutlinePayload,
  COVER_TITLE_DIRECTIVE,
} from './bookPrompts';

const outlineMessage = `Here is your book!

**Page 1: Cover**
A bright book cover with two puppies playing in the snow. No text overlays. Clean illustration only.

**Page 2: Educational Focus**
Three stacked colorful badges showing grade level, learning type and skill focus. No text overlays. Clean illustration only.

**Page 3: Play rhymes with Day**
Two puppies leaping through a sunny meadow at midday. No text overlays. Clean illustration only.

**Page 4: Snow rhymes with Glow**
Two puppies under glowing lanterns in falling snow. No text overlays. Clean illustration only.
`;

const messages = [
  { role: 'user', content: 'make a rhyming book' },
  { role: 'assistant', content: outlineMessage },
];

describe('finalizeCoverPrompt', () => {
  it('rewrites "book cover" to "square card cover"', () => {
    expect(finalizeCoverPrompt('A book cover with puppies')).toContain('square card cover');
  });

  it('appends the centered-title directive when missing', () => {
    const out = finalizeCoverPrompt('A scene with puppies');
    expect(out).toContain(COVER_TITLE_DIRECTIVE);
  });

  it('injects the title into the directive when provided', () => {
    const out = finalizeCoverPrompt('A scene with puppies', 'Rhyme Time in Jersey City');
    expect(out).toContain('"Rhyme Time in Jersey City"');
  });

  it('is idempotent — does not double-append the directive', () => {
    const once = finalizeCoverPrompt('A scene with puppies', 'Snow Day');
    const twice = finalizeCoverPrompt(once, 'Snow Day');
    expect(twice).toBe(once);
  });
});

describe('extractOutlinePrompts', () => {
  it('extracts cover, educational and content page prompts', () => {
    const prompts = extractOutlinePrompts(messages);
    expect(prompts[1]).toBeTruthy();
    expect(prompts[2]).toBeTruthy();
    expect(prompts[3]).toContain('meadow');
    expect(prompts[4]).toContain('lanterns');
  });

  it('finalizes page 1 as a cover prompt', () => {
    const prompts = extractOutlinePrompts(messages);
    expect(prompts[1]).toMatch(/center/i);
    expect(prompts[1]).not.toMatch(/\bbook cover\b/i);
  });

  it('sanitizes extracted prompts (no markdown heading residue)', () => {
    const prompts = extractOutlinePrompts(messages);
    expect(prompts[3]).not.toContain('**');
  });


  it('falls back to legacy **Cover:** / **Educational Focus:** headings', () => {
    const legacy = [
      {
        role: 'assistant',
        content: `**Cover: Snow Day ABCs**
A cheerful book cover with a snowy hill. No text overlays. Clean illustration only.

**Educational Focus: Pre-K**
Three colorful badges stacked vertically. No text overlays. Clean illustration only.`,
      },
    ];
    const prompts = extractOutlinePrompts(legacy);
    expect(prompts[1]).toContain('square card cover');
    expect(prompts[1]).toContain('"Snow Day ABCs"');
    expect(prompts[2]).toContain('badges');
  });

  it('returns an empty record for an empty conversation', () => {
    expect(extractOutlinePrompts([])).toEqual({});
  });
});

describe('extractEditModePrompts', () => {
  it('reads <qa_page_N> blocks', () => {
    const prompts = extractEditModePrompts([
      { role: 'assistant', content: '<qa_page_1>A snowy cover scene</qa_page_1><qa_page_2>Badges</qa_page_2>' },
    ]);
    expect(prompts[1]).toContain('snowy cover scene');
    expect(prompts[2]).toContain('Badges');
  });

  it('returns empty when no legacy blocks exist', () => {
    expect(extractEditModePrompts(messages)[1]).toBeUndefined();
  });
});

describe('readPagePrompt', () => {
  it('prefers stored prompts', () => {
    const result = readPagePrompt(3, { storedPrompts: { 3: 'stored prompt' } });
    expect(result).toBe('stored prompt');
  });

  it('reads DB pages once the book is created', () => {
    const result = readPagePrompt(3, {
      isBookCreated: true,
      dbPages: [{ page_number: 3, description: 'db description' }],
    });
    expect(result).toContain('db description');
  });

  it('prefers content.imagePrompt over description for DB pages', () => {
    const result = readPagePrompt(3, {
      isBookCreated: true,
      dbPages: [{ page_number: 3, description: 'db description', content: { imagePrompt: 'full image prompt' } }],
    });
    expect(result).toContain('full image prompt');
  });

  it('returns null when the page is missing everywhere', () => {
    expect(readPagePrompt(9, { isBookCreated: true, dbPages: [] })).toBeNull();
    expect(readPagePrompt(9, {})).toBeNull();
  });
});

describe('buildOutlinePayload', () => {
  it('returns undefined without an outline', () => {
    expect(buildOutlinePayload(null)).toBeUndefined();
    expect(buildOutlinePayload(undefined)).toBeUndefined();
  });

  it('maps outline pages into the creation payload', () => {
    const outline = {
      coverPage: { pageNumber: 1, pageType: 'cover', title: 'Snow Day ABCs', description: 'cover prompt' },
      allPages: new Map([
        [1, { pageNumber: 1, pageType: 'cover', title: 'Snow Day ABCs', description: 'cover prompt' }],
        [3, { pageNumber: 3, pageType: 'content', title: 'Play rhymes with Day', description: 'content prompt' }],
      ]),
    } as any;

    const payload = buildOutlinePayload(outline);
    expect(payload?.bookName).toBe('Snow Day ABCs');
    expect(payload?.pages).toHaveLength(2);
    expect(payload?.pages[1]).toMatchObject({ pageNumber: 3, pageType: 'content' });
  });
});
