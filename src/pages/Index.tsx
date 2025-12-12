import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { AdminOnly } from '@/components/AdminOnly';
import { HabitTrackingCard, HabitCarousel } from '@/components/habits';
import { CategorizedBookSections } from '@/components/library';
import { RewardsCarousel } from '@/components/rewards/RewardsCarousel';
import { TricksCarousel } from '@/components/tricks/TricksCarousel';
import { useTodayHabits } from '@/hooks/useTodayHabits';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useLandingPageData } from '@/hooks/useLandingPageData';
import { useRewardsProducts } from '@/hooks/useRewardsProducts';
import { useTricks } from '@/hooks/useTricks';
import { useTrickGoals } from '@/hooks/useTrickGoals';
import { useHomeImagePreloader } from '@/hooks/useHomeImagePreloader';
import { usePredictivePrefetch } from '@/hooks/usePredictivePrefetch';
import { LoadingState } from '@/components/ui/loading-state';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { extractAvailableThemes, filterBooksByThemeAndSearch } from '@/utils/themeFilters';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';
import { useBookCompletionCounts } from '@/hooks/useBookCompletionCounts';
import type { LibraryBook } from '@/types/library';
const Index = () => {
  const {
    isAuthenticated
  } = useAuthContext();
  const {
    hasActiveSubscription,
    loading: subscriptionLoading
  } = useSubscription();
  const navigate = useNavigate();

  // Get the first kid profile
  const {
    data: kidProfiles = [],
    isLoading: isLoadingKids
  } = useKidProfiles();
  const firstKid = kidProfiles[0];

  // Fetch today's habits for the first kid
  const {
    data: completions = [],
    isLoading: isLoadingHabits
  } = useTodayHabits(firstKid?.id);

  // Fetch rewards products
  const {
    data: rewardsProducts = []
  } = useRewardsProducts();

  // Fetch tricks and goals
  const {
    data: tricks = []
  } = useTricks();
  const {
    data: trickGoals = []
  } = useTrickGoals(firstKid?.id);

  // ⚡ PERFORMANCE: Use landing page data (single edge function) instead of useLibraryBooks (3 queries)
  const {
    data: landingData,
    isLoading: isLoadingBooks
  } = useLandingPageData();

  // Extract book IDs for completion count lookup
  const bookIds = useMemo(() => {
    return landingData?.libraryBooks?.map(book => book.id) || [];
  }, [landingData?.libraryBooks]);

  // Fetch completion counts for these books
  const { data: completionCounts } = useBookCompletionCounts(bookIds);

  // Map LandingLibraryBook[] to LibraryBook[] for component compatibility
  const libraryItems: LibraryBook[] = useMemo(() => {
    if (!landingData?.libraryBooks) return [];
    return landingData.libraryBooks.map(book => ({
      id: book.id,
      book_name: book.book_name,
      book_description: book.book_description,
      created_at: book.created_at,
      updated_at: book.updated_at,
      is_highlighted: book.is_highlighted,
      total_pages: 0, // Not available in landing data, not used for display
      cover_image: book.image_url,
      last_viewed_at: null,
      view_count: 0,
      completion_count: completionCounts?.get(book.id) || 0,
      metadata: book.metadata,
    }));
  }, [landingData?.libraryBooks, completionCounts]);

  // ⚡ PERFORMANCE OPTIMIZATION: Debounced search for instant feel
  const {
    activeQuery,
  } = useOptimizedSearch('debounced', 300);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  // Extract available themes from library books
  const availableThemes = useMemo(() => extractAvailableThemes(libraryItems), [libraryItems]);

  // Apply filters using activeQuery (debounced value)
  const filteredLibraryItems = useMemo(() => filterBooksByThemeAndSearch(libraryItems, activeQuery, selectedThemes), [libraryItems, activeQuery, selectedThemes]);

  // Preload book images for instant display on return visits
  useHomeImagePreloader(libraryItems);

  // 🚀 Predictive prefetching: Anticipate which books user will view next
  usePredictivePrefetch();

  // Only show pending habits - acted-upon habits disappear immediately
  const activeCompletions = completions.filter(c => c.status === 'pending');

  // Limit books to top 5 per category for performance
  const limitedLibraryItems = filteredLibraryItems.slice(0, 30);
  const isLoading = isLoadingKids || isLoadingHabits;
  const isMobile = useIsMobile();
  if (subscriptionLoading || isLoadingBooks) {
    return <StandardPageLayout>
        <div className="container mx-auto py-8">
          <LoadingState text="Loading..." />
        </div>
      </StandardPageLayout>;
  }
  return <StandardPageLayout>
      <div className="container mx-auto py-8 space-y-8">
        {hasActiveSubscription && firstKid ? <>
            {/* Premium: Child-focused header with habits */}
            <div className="space-y-2">
              
              
              
            </div>

            {/* Habits list */}
            {activeCompletions.length === 0 ? <div className="text-center py-12 bg-muted/50 rounded-lg space-y-2">
                <p className="text-lg text-muted-foreground">
                  No habits scheduled for today! 
                </p>
                <p className="text-sm text-muted-foreground">
                  Ask your parent to schedule habits from the Manage Habits page.
                </p>
              </div> : isMobile ? <HabitCarousel completions={activeCompletions} /> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCompletions.map(completion => <HabitTrackingCard key={completion.id} completion={completion} />)}
              </div>}
          </> : <>
            {/* Free tier: Welcome section */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">
                Chairlift Habits
              </h1>
              <p className="text-xl text-muted-foreground">
                where habits are developed and curiosity cultures educational moments
              </p>
            </div>

            {/* Upgrade prompt card - Admin only */}
            <AdminOnly>
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 rounded-lg p-6 space-y-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Unlock Habits & Rewards</h2>
                  <p className="text-muted-foreground">
                    Track reading progress, earn coins, and motivate your kids with our interactive rewards system.
                  </p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span>Create custom reading habits for your children</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span>Reward completed habits with coins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span>Set up a rewards store for kids to spend coins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span>Track progress and build reading consistency</span>
                  </li>
                </ul>
                <button onClick={() => navigate('/pricing')} className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                  Upgrade to Plus
                </button>
              </div>
            </AdminOnly>
          </>}

        {/* Search and filter removed from home page */}

        {/* Rewards Carousel - Only for subscribed users with kid profile */}
        {hasActiveSubscription && firstKid && rewardsProducts.length > 0 && <RewardsCarousel products={rewardsProducts} kidId={firstKid.id} currentCoins={firstKid.earned_coins} />}

        {/* Tricks Carousel - Only for subscribed users with kid profile */}
        {hasActiveSubscription && firstKid && tricks.length > 0 && <TricksCarousel tricks={tricks} goals={trickGoals} />}

        {/* Categorized Book Sections */}
        {filteredLibraryItems.length > 0 ? <CategorizedBookSections books={limitedLibraryItems} maxBooksPerCategory={5} showViewAllLinks={true} /> : libraryItems.length > 0 ? <div className="text-center py-12">
            <p className="text-muted-foreground">
              No books found matching your filters.
            </p>
          </div> : null}
      </div>
    </StandardPageLayout>;
};
export default Index;