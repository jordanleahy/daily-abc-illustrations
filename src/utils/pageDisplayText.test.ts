import { describe, it, expect } from 'vitest';
import { getPageDisplayText, isCaptionOnlyPage } from './pageDisplayText';

const page = (over: Record<string, unknown>) => ({
  title: 'Educational Focus',
  page_type: 'educational',
  content: {},
  ...over,
}) as never;

describe('getPageDisplayText', () => {
  it('prefers the focus overlay text on educational pages', () => {
    expect(
      getPageDisplayText(
        page({ content: { textOverlay: { text: 'Pre-K (Ages 3-4) · PHONICS | EARLY LITERACY' } } }),
      ),
    ).toBe('Pre-K (Ages 3-4) · PHONICS | EARLY LITERACY');
  });

  it('falls back to composing the three focus lines', () => {
    expect(
      getPageDisplayText(
        page({
          content: {
            mainConcept: 'Kindergarten (Ages 5-6)',
            funFact: 'MATH | COUNTING',
            activity: 'FOCUS: NUMBERS 1-10 · 10 pages to explore together',
          },
        }),
      ),
    ).toBe('Kindergarten (Ages 5-6) · MATH | COUNTING · FOCUS: NUMBERS 1-10 · 10 pages to explore together');
  });

  it('skips blank lines when composing', () => {
    expect(
      getPageDisplayText(page({ content: { mainConcept: 'Ages 3-5', funFact: '', activity: '  ' } })),
    ).toBe('Ages 3-5');
  });

  it('falls back to the title for legacy pages with empty content', () => {
    expect(getPageDisplayText(page({}))).toBe('Educational Focus');
  });

  it('leaves content and cover pages on their title', () => {
    expect(
      getPageDisplayText(
        page({ page_type: 'content', title: 'B is for Ball', content: { mainConcept: 'ignored' } }),
      ),
    ).toBe('B is for Ball');
    expect(getPageDisplayText(page({ page_type: 'cover', title: 'My ABC Book' }))).toBe('My ABC Book');
  });

  it('handles missing page and missing content safely', () => {
    expect(getPageDisplayText(null)).toBe('');
    expect(getPageDisplayText(page({ content: undefined }))).toBe('Educational Focus');
  });
});

describe('isCaptionOnlyPage', () => {
  it('marks only educational pages as caption-only', () => {
    expect(isCaptionOnlyPage('educational')).toBe(true);
    expect(isCaptionOnlyPage('content')).toBe(false);
    expect(isCaptionOnlyPage('cover')).toBe(false);
    expect(isCaptionOnlyPage(undefined)).toBe(false);
  });
});

describe('getPageDisplayText — legacy books', () => {
  it('ignores overlay text that just repeats the internal label', () => {
    expect(
      getPageDisplayText(
        page({
          title: 'Educational Focus',
          content: {
            textOverlay: { text: 'Educational Focus' },
            mainConcept: 'Toddlers',
            funFact: 'Rhyming | Phonemic Awareness',
          },
        }),
      ),
    ).toBe('Toddlers · Rhyming | Phonemic Awareness');
  });
});
