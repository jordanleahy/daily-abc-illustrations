export const LIBRARY_CONFIG = {
  // Cache & Performance
  CACHE_STALE_TIME_MS: 5 * 60 * 1000, // 5 minutes
  INTERSECTION_THRESHOLD: 0.1,
  INTERSECTION_ROOT_MARGIN: '100px',
  PRIORITY_IMAGE_COUNT: 3,
  
  // Interaction
  DRAG_THRESHOLD_PX: 10,
  
  // Carousel
  CAROUSEL: {
    align: 'start' as const,
    dragFree: true,
    containScroll: false,
    skipSnaps: false,
    inViewThreshold: 0.7,
    watchDrag: true,
  },
  
  // Features
  SHOW_ALL_CATEGORIES: true,
  SHOW_VIEW_ALL_LINKS: false,
} as const;
