import { Skeleton } from './skeleton';

/**
 * Structured skeleton loader that matches the UnifiedReadingView layout
 * Used for first-page loading to provide clear visual hierarchy
 */
export function ReadingPageSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header Area */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Back button */}
          <Skeleton className="h-10 w-10 rounded-full" />
          
          {/* Title area */}
          <div className="flex-1 mx-4 space-y-2">
            <Skeleton className="h-6 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/4 mx-auto" />
          </div>
          
          {/* Right side spacer */}
          <div className="w-10" />
        </div>
      </div>

      {/* Reward Counter Area */}
      <div className="pt-20 pb-2 flex justify-center">
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {/* Main Image Area */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <Skeleton className="w-full max-w-sm aspect-[3/4] rounded-lg" />
      </div>

      {/* Bottom Controls Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border pb-safe">
        <div className="flex items-center justify-between px-6 py-4 pb-24">
          {/* Previous button */}
          <Skeleton className="h-12 w-12 rounded-full" />
          
          {/* Center controls */}
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          
          {/* Next button */}
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}
