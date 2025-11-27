import { Skeleton } from '@/components/ui/skeleton';

export function HabitCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-3">
      {/* Coin amount and title */}
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>
      
      {/* Description */}
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      
      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function HabitCarouselSkeleton() {
  return (
    <div className="-mx-4 md:-mx-6">
      <div className="flex gap-4 px-4 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="min-w-[50vw] sm:min-w-[45vw] md:min-w-[35vw] lg:min-w-[22vw]">
            <HabitCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
