import React, { useState } from 'react';
import { Shimmer } from './shimmer';
import { OptimizedImage } from './optimized-image';
import { commonBlurDataUrls } from '@/utils/blurDataUrl';
import { Button } from './button';

export const ShimmerShowcase = () => {
  const [showDemo, setShowDemo] = useState(false);
  
  const sampleImageUrl = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop';

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Progressive Loading Showcase</h2>
        <Button onClick={() => setShowDemo(!showDemo)}>
          {showDemo ? 'Hide Demo' : 'Show Demo'}
        </Button>
      </div>

      {showDemo && (
        <>
          {/* Skeleton Variants */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Text Skeleton</h3>
              <div className="h-32 p-4 border rounded">
                <Shimmer variant="skeleton" skeletonType="text" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Card Skeleton</h3>
              <div className="h-32 p-4 border rounded">
                <Shimmer variant="skeleton" skeletonType="card" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Image Skeleton</h3>
              <div className="h-32 border rounded">
                <Shimmer variant="skeleton" skeletonType="image" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Progress Shimmer</h3>
              <div className="h-32 border rounded">
                <Shimmer variant="progress" progress={65} />
              </div>
            </div>
          </div>

          {/* Optimized Image Examples */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Skeleton Loading</h3>
              <div className="aspect-video border rounded overflow-hidden">
                <OptimizedImage
                  src={`${sampleImageUrl}&t=${Date.now()}`} // Force reload
                  alt="Skeleton demo"
                  shimmerVariant="skeleton"
                  skeletonType="image"
                  className="w-full h-full"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Blur-up Loading</h3>
              <div className="aspect-video border rounded overflow-hidden">
                <OptimizedImage
                  src={`${sampleImageUrl}&blur&t=${Date.now()}`} // Force reload
                  alt="Blur-up demo"
                  shimmerVariant="blur-up"
                  blurDataURL={commonBlurDataUrls.gradient}
                  className="w-full h-full"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Progress Loading</h3>
              <div className="aspect-video border rounded overflow-hidden">
                <OptimizedImage
                  src={`${sampleImageUrl}&progress&t=${Date.now()}`} // Force reload
                  alt="Progress demo"
                  shimmerVariant="progress"
                  showProgress={true}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-muted/30 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Progressive Loading Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-primary mb-2">🎨 Visual Loading States</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Skeleton screens matching content layout</li>
                  <li>• Blur-up technique with tiny placeholders</li>
                  <li>• Progress indicators for large images</li>
                  <li>• Smooth transitions between states</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-2">⚡ Performance Features</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Intersection Observer lazy loading</li>
                  <li>• Responsive image sizing (400/800/1200px)</li>
                  <li>• Modern format support (AVIF/WebP)</li>
                  <li>• Loading analytics and metrics</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};