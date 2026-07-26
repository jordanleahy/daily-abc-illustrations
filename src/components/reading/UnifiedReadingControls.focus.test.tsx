/**
 * Render guard: the Educational Focus page (page 2) must show its age/grade
 * and learning-focus text in the reading preview for every active book type.
 *
 * This renders the real overlay UI (UnifiedReadingControls) with page records
 * built by the same deterministic builder the edge function uses.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { UnifiedReadingControls } from './UnifiedReadingControls';
import { getPageDisplayText, isCaptionOnlyPage } from '@/utils/pageDisplayText';
import { buildEducationalFocusContent } from '../../../supabase/functions/_shared/educationalFocus';

vi.mock('@/hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({ isPlaying: false, currentWordIndex: -1, speak: vi.fn(), stop: vi.fn() }),
}));

const BOOK_TYPES = [
  'digraphs', 'abc', 'rhyming', 'numbers', 'shapes', 'colors', 'dr-seuss',
  'opposites', 'emotions', 'animals', 'first-words', 'bedtime', 'cvc',
  'sight-words', 'general', 'parent-education', 'song', 'manners',
];

const focusPage = (bookType: string) => ({
  id: `focus-${bookType}`,
  title: 'Educational Focus',
  page_type: 'educational' as const,
  page_number: 2,
  content: buildEducationalFocusContent({ bookType, gradeLevel: 'PRE_K', contentPageCount: 10 }),
});

const renderControls = (page: ReturnType<typeof focusPage>) =>
  render(
    <UnifiedReadingControls
      pageType={page.page_type}
      overlayText={getPageDisplayText(page as never)}
      overlayWords={isCaptionOnlyPage(page.page_type) ? [] : undefined}
      showOverlay
      currentWordIndex={0}
      totalWords={0}
      onNavigateWord={vi.fn()}
      onPreviousPage={vi.fn()}
      onNextPage={vi.fn()}
    />,
  );

afterEach(cleanup);

describe('Educational Focus page rendering', () => {
  it.each(BOOK_TYPES)('renders age/grade and focus text for "%s" books', (bookType) => {
    const page = focusPage(bookType);
    renderControls(page);

    // Age/grade line is visible.
    expect(screen.getByText(/Pre-K \(Ages 3-4\)/)).toBeTruthy();
    // Learning type and skill focus lines are visible.
    expect(screen.getByText(new RegExp(page.content.funFact.replace(/\|/g, '\\|')))).toBeTruthy();
    expect(screen.getByText(/FOCUS:/)).toBeTruthy();
    // Never the raw internal label.
    expect(screen.queryByText(/^Educational Focus$/)).toBeNull();
  });

  it('renders the caption for a legacy page whose overlay repeats the label', () => {
    const legacy = {
      id: 'legacy',
      title: 'Educational Focus',
      page_type: 'educational' as const,
      page_number: 2,
      content: {
        textOverlay: { text: 'Educational Focus' },
        mainConcept: 'Toddlers',
        funFact: 'Rhyming | Phonemic Awareness',
      },
    };
    renderControls(legacy as never);
    expect(screen.getByText(/Toddlers/)).toBeTruthy();
    expect(screen.queryByText(/^Educational Focus$/)).toBeNull();
  });

  it('still hides the overlay on cover pages', () => {
    render(
      <UnifiedReadingControls
        pageType="cover"
        overlayText="My ABC Book"
        showOverlay
        currentWordIndex={0}
        totalWords={0}
        onNavigateWord={vi.fn()}
        onPreviousPage={vi.fn()}
        onNextPage={vi.fn()}
      />,
    );
    expect(screen.queryByText('My ABC Book')).toBeNull();
  });
});
