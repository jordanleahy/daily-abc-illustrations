import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { HabitTrackingCard, HabitCarousel } from '@/components/habits';
import { CategorizedBookSections } from '@/components/library';
import { BookFilterBar } from '@/components/filters';
import { useTodayHabits } from '@/hooks/useTodayHabits';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useLibraryBooksDecoupled } from '@/hooks/useLibraryBooksDecoupled';
import { useHomeImagePreloader } from '@/hooks/useHomeImagePreloader';
import { usePredictivePrefetch } from '@/hooks/usePredictivePrefetch';
import { LoadingState } from '@/components/ui/loading-state';
import { CoinCounter } from '@/components/ui/coin-counter';
import { getTimeBasedGreeting } from '@/utils/timeUtils';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { extractAvailableThemes, filterBooksByThemeAndSearch } from '@/utils/themeFilters';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';

const Index = () => {
  const { isAuthenticated } = useAuthContext();
  const { hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  
  // Get the first kid profile
  const { data: kidProfiles = [], isLoading: isLoadingKids } = useKidProfiles();
  const firstKid = kidProfiles[0];
  
  // Fetch today's habits for the first kid
  const { data: completions = [], isLoading: isLoadingHabits } = useTodayHabits(firstKid?.id);
  
  // Fetch library books using decoupled architecture
  const { data: libraryItems = [], isLoading: isLoadingBooks } = useLibraryBooksDecoupled();
  
  // ⚡ PERFORMANCE OPTIMIZATION: Debounced search for instant feel
  const { rawQuery, activeQuery, setSearchQuery, isSearching } = useOptimizedSearch('debounced', 300);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  
  // Extract available themes from library books
  const availableThemes = useMemo(() => 
    extractAvailableThemes(libraryItems),
    [libraryItems]
  );
  
  // Apply filters using activeQuery (debounced value)
  const filteredLibraryItems = useMemo(() => 
    filterBooksByThemeAndSearch(libraryItems, activeQuery, selectedThemes),
    [libraryItems, activeQuery, selectedThemes]
  );
  
  // Preload book images for instant display on return visits
  useHomeImagePreloader(libraryItems);
  
  // 🚀 Predictive prefetching: Anticipate which books user will view next
  // Prefetches the top 3 most likely books based on favorites and viewing history
  const { predictedBooks } = usePredictivePrefetch();
  
  // Filter out skipped habits and sort by status (pending first, completed/failed last)
  const activeCompletions = completions
    .filter(c => c.status !== 'skipped')
    .sort((a, b) => {
      // Define status priority (lower number = higher priority)
      const statusPriority = {
        pending: 1,
        completed: 2,
        declined: 2
      };
      
      const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 3;
      const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 3;
      
      // Sort by status priority first
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same status, maintain creation order
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  
  // Limit books to top 5 per category for performance
  const limitedLibraryItems = filteredLibraryItems.slice(0, 30);
  
  const isLoading = isLoadingKids || isLoadingHabits;
  const timeOfDay = getTimeBasedGreeting();
  const isMobile = useIsMobile();

  if (subscriptionLoading || isLoadingBooks) {
    return (
      <StandardPageLayout>
        <div className="container mx-auto py-8">
          <LoadingState text="Loading..." />
        </div>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout>
      <div className="container mx-auto py-8 space-y-8">
        {hasActiveSubscription && firstKid ? (
          <>
            {/* Premium: Child-focused header with habits */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-4xl font-bold">
                  Good {timeOfDay}, {firstKid.first_name}!
                </h1>
                <CoinCounter coins={firstKid.earned_coins} size="md" />
              </div>
              <p className="text-xl text-muted-foreground">
                Today is {format(new Date(), 'EEEE, MMMM do')}
              </p>
              <p className="text-lg text-muted-foreground">
                Here is your {timeOfDay} to-do list
              </p>
            </div>

            {/* Habits list */}
            {activeCompletions.length === 0 ? (
              <div className="text-center py-12 bg-muted/50 rounded-lg space-y-2">
                <p className="text-lg text-muted-foreground">
                  No habits scheduled for today! 
                </p>
                <p className="text-sm text-muted-foreground">
                  Ask your parent to schedule habits from the Manage Habits page.
                </p>
              </div>
            ) : isMobile ? (
              <HabitCarousel completions={activeCompletions} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCompletions.map((completion) => (
                  <HabitTrackingCard
                    key={completion.id}
                    completion={completion}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Free tier: Welcome section */}
            <div className="space-y-6">
              <h1 className="text-4xl font-bold">
                Good {timeOfDay}!
              </h1>
              <p className="text-xl text-muted-foreground">
                Welcome to your reading library
              </p>
            </div>

            {/* Upgrade prompt card */}
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
              <button
                onClick={() => navigate('/pricing')}
                className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Upgrade to Plus
              </button>
            </div>
          </>
        )}

        {/* Search and filter removed from home page */}

        {/* Categorized Book Sections */}
        {filteredLibraryItems.length > 0 ? (
          <CategorizedBookSections
            books={limitedLibraryItems}
            maxBooksPerCategory={5}
            showViewAllLinks={true}
          />
        ) : libraryItems.length > 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No books found matching your filters.
            </p>
          </div>
        ) : null}
      </div>
    </StandardPageLayout>
  );
};

export default Index;
