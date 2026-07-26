/**
 * END-TO-END PREVIEW TEST
 *
 * Pipeline exercised: chat outline → `outlineToBook` (deterministic adapter)
 * → the edge function's page-row mapping (sanitizer + textOverlay policy)
 * → the real `UnifiedReadingView` rendered in jsdom.
 *
 * Asserts that page 2 of every 12-page book type shows its Educational Focus
 * overlay (age/grade + learning type) instead of the internal label, and that
 * ABC books — which have no focus page — show their letter page instead.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import {
  ALL_BOOK_TYPES,
  TWELVE_PAGE_BOOK_TYPES,
  buildStoredPages,
  makeOutline,
  sanitizeText,
} from '@/test/bookPreviewFixtures';
import { buildEducationalFocusContent } from '../../../supabase/functions/_shared/educationalFocus';

// ---- Mocks: isolate the view from network/auth/analytics ------------------
vi.mock('@/hooks/useReadingSessionAnalytics', () => ({
  useReadingSessionAnalytics: () => ({ startSession: vi.fn(), trackPageView: vi.fn(), endSession: vi.fn() }),
}));
vi.mock('@/hooks/useReadingProgressTracking', () => ({
  useReadingProgressTracking: () => ({ updateProgress: vi.fn() }),
}));
vi.mock('@/hooks/useBookCompletion', () => ({
  useBookCompletion: () => ({ incrementCompletion: vi.fn() }),
}));
vi.mock('@/hooks/useKidProfiles', () => ({ useKidProfiles: () => ({ data: [] }) }));
vi.mock('@/hooks/useKidPoints', () => ({ useKidPoints: () => ({ addPoints: vi.fn(), isAddingPoints: false }) }));
vi.mock('@/hooks/useCompleteBookHabit', () => ({ useCompleteBookHabit: () => ({ completeBookHabit: vi.fn() }) }));
vi.mock('@/hooks/useFeatureAccess', () => ({ useFeatureAccess: () => ({ hasHabitsRewards: false }) }));
vi.mock('@/hooks/useTTSPrefetch', () => ({ useTTSPrefetch: () => ({ prefetch: vi.fn() }) }));
vi.mock('@/hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({ isPlaying: false, currentWordIndex: -1, speak: vi.fn(), stop: vi.fn() }),
}));
vi.mock('@/hooks/useReadingPreferences', () => ({
  useReadingPreferences: () => ({ hiddenOverlayPages: new Set(), toggleOverlay: vi.fn() }),
}));
vi.mock('@/hooks/useWordLearningProgress', () => ({
  useWordLearningProgress: () => ({ wordStatuses: {}, markWord: vi.fn(), isLoading: false }),
}));
vi.mock('@/hooks/useWordMetadata', () => ({
  useWordMetadata: () => ({ generateMetadata: vi.fn().mockResolvedValue(undefined), isGenerating: false }),
}));
vi.mock('@/hooks/useBookPages', () => ({ useBookPages: () => ({ updatePage: vi.fn() }) }));
vi.mock('@/components/common', () => ({ MetaHead: () => null }));
vi.mock('@/components/layout/ReadingHeader', () => ({ ReadingHeader: () => null }));

// Imported after the mocks so the view picks them up.
const { UnifiedReadingView } = await import('./UnifiedReadingView');

const renderPreview = (bookType: string, gradeLevel = 'PRE_K') => {
  const pages = buildStoredPages(makeOutline(bookType, gradeLevel));
  const utils = render(
    <MemoryRouter>
      <UnifiedReadingView
        contentType="library_book"
        book={{ id: 'book-1', book_name: `Shelly's ${bookType} Book`, category: 'General' }}
        pages={pages}
        onBack={vi.fn()}
        imageComponent={(page) => <div data-testid="page-image">{page.page_identifier}</div>}
      />
    </MemoryRouter>,
  );
  return { ...utils, pages };
};

/** Clicks forward until the preview is showing the requested page number. */
const goToPage = async (targetPageNumber: number) => {
  const user = userEvent.setup();
  for (let i = 1; i < targetPageNumber; i++) {
    const next = screen.getAllByRole('button').find((b) =>
      /next/i.test(b.getAttribute('aria-label') || b.textContent || ''),
    );
    expect(next, 'expected a next-page control').toBeTruthy();
    await user.click(next!);
  }
};

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('Book preview e2e — page 2 overlay across all book types', () => {
  it.each(TWELVE_PAGE_BOOK_TYPES)(
    '"%s": page 2 shows the Educational Focus overlay, not the internal label',
    async (bookType) => {
      const { pages } = renderPreview(bookType);

      const focusPage = pages[1];
      expect(focusPage.page_type).toBe('educational');

      await goToPage(2);

      const expected = buildEducationalFocusContent({
        bookType,
        category: 'General',
        gradeLevel: 'PRE_K',
        contentPageCount: 10,
      });

      // The age/grade line and the learning type are both on screen
      // (matched post-sanitization, exactly as stored).
      const ageLine = sanitizeText(expected.mainConcept, 500);
      const learning = sanitizeText(expected.funFact, 500);
      expect(screen.getAllByText(new RegExp(escapeRe(ageLine))).length).toBeGreaterThan(0);
      expect(screen.getAllByText(new RegExp(escapeRe(learning.split(/\s{2,}/)[0]))).length).toBeGreaterThan(0);

      // The raw internal label never leaks into the reader.
      expect(screen.queryByText(/^Educational Focus$/)).toBeNull();
    },
  );

  it('ABC books have no page-2 focus page — page 2 is the letter A page', async () => {
    const { pages } = renderPreview('abc');
    expect(pages).toHaveLength(28);
    expect(pages.some((p) => p.page_type === 'educational')).toBe(false);
    expect(pages[1].page_type).toBe('content');

    await goToPage(2);
    expect(screen.getAllByText(/is for/i).length).toBeGreaterThan(0);
  });

  it.each(ALL_BOOK_TYPES)('"%s": the cover (page 1) never shows an overlay', (bookType) => {
    const { pages } = renderPreview(bookType);
    expect(pages[0].page_type).toBe('cover');
    expect((pages[0].content as any).textOverlay.enabled).toBe(false);
  });

  it('page-2 overlay text stays populated for every grade level', async () => {
    for (const grade of ['PRE_K', 'K', 'GRADE_1', 'GRADE_2']) {
      const { pages, unmount } = renderPreview('cvc', grade);
      const overlay = (pages[1].content as any).textOverlay;
      expect(overlay.enabled).toBe(true);
      expect(overlay.text.length).toBeGreaterThan(0);
      expect(overlay.text).not.toBe('Educational Focus');
      expect(overlay.text.length).toBeLessThanOrEqual(100);
      unmount();
    }
  });

  it('the focus page ignores the "without-text" content preference', () => {
    const pages = buildStoredPages(makeOutline('rhyming'), { showTextOverlay: false });
    expect((pages[1].content as any).textOverlay.enabled).toBe(true);
    expect((pages[2].content as any).textOverlay.enabled).toBe(false);
  });
});

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
