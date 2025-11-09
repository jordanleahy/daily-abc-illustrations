/**
 * PHASE 4: Performance Monitoring
 * Tracks image loading performance, cache effectiveness, and Core Web Vitals
 */

interface ImageLoadMetrics {
  url: string;
  loadTime: number;
  cacheHit: boolean;
  imageSize?: number;
  format?: string;
}

interface PerformanceMetrics {
  lcp?: number;
  fcp?: number;
  cls?: number;
  ttfb?: number;
}

class PerformanceMonitor {
  private imageMetrics: ImageLoadMetrics[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * Track individual image load performance
   */
  trackImageLoad(metrics: ImageLoadMetrics) {
    this.imageMetrics.push(metrics);
    
    if (metrics.cacheHit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    // Log slow images (>500ms)
    if (metrics.loadTime > 500) {
      console.warn(`[Performance] Slow image load (${metrics.loadTime}ms):`, metrics.url);
    }

    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'image_load', {
        event_category: 'performance',
        event_label: metrics.cacheHit ? 'cache_hit' : 'cache_miss',
        value: Math.round(metrics.loadTime),
        cache_hit: metrics.cacheHit,
        image_format: metrics.format || 'unknown'
      });
    }
  }

  /**
   * Get cache hit rate percentage
   */
  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? (this.cacheHits / total) * 100 : 0;
  }

  /**
   * Get average image load time
   */
  getAverageLoadTime(): number {
    if (this.imageMetrics.length === 0) return 0;
    const sum = this.imageMetrics.reduce((acc, metric) => acc + metric.loadTime, 0);
    return sum / this.imageMetrics.length;
  }

  /**
   * Get performance summary
   */
  getSummary() {
    return {
      totalImages: this.imageMetrics.length,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: this.getCacheHitRate().toFixed(2) + '%',
      averageLoadTime: this.getAverageLoadTime().toFixed(2) + 'ms',
      slowImages: this.imageMetrics.filter(m => m.loadTime > 500).length
    };
  }

  /**
   * Log performance summary to console
   */
  logSummary() {
    const summary = this.getSummary();
    console.log('📊 [Performance Summary]', summary);
    
    // Send summary to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_summary', {
        event_category: 'performance',
        cache_hit_rate: parseFloat(summary.cacheHitRate),
        avg_load_time: parseFloat(summary.averageLoadTime),
        total_images: summary.totalImages,
        slow_images: summary.slowImages
      });
    }
  }

  /**
   * Track Core Web Vitals
   */
  trackWebVitals() {
    if (typeof window === 'undefined') return;

    // Track LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          const lcp = lastEntry.renderTime || lastEntry.loadTime;
          
          console.log(`⚡ [Core Web Vitals] LCP: ${lcp.toFixed(2)}ms`);
          
          if ((window as any).gtag) {
            (window as any).gtag('event', 'web_vitals', {
              event_category: 'performance',
              event_label: 'lcp',
              value: Math.round(lcp),
              lcp_good: lcp < 2500
            });
          }
        });

        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // Track FCP (First Contentful Paint)
        const fcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            const fcp = entry.startTime;
            console.log(`⚡ [Core Web Vitals] FCP: ${fcp.toFixed(2)}ms`);
            
            if ((window as any).gtag) {
              (window as any).gtag('event', 'web_vitals', {
                event_category: 'performance',
                event_label: 'fcp',
                value: Math.round(fcp),
                fcp_good: fcp < 1800
              });
            }
          });
        });

        fcpObserver.observe({ type: 'paint', buffered: true });

        // Track CLS (Cumulative Layout Shift)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          
          console.log(`⚡ [Core Web Vitals] CLS: ${clsValue.toFixed(4)}`);
          
          if ((window as any).gtag) {
            (window as any).gtag('event', 'web_vitals', {
              event_category: 'performance',
              event_label: 'cls',
              value: clsValue,
              cls_good: clsValue < 0.1
            });
          }
        });

        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (error) {
        console.error('[Performance] Web Vitals tracking failed:', error);
      }
    }

    // Track TTFB (Time to First Byte) using Navigation Timing API
    if (performance.timing) {
      const ttfb = performance.timing.responseStart - performance.timing.requestStart;
      console.log(`⚡ [Core Web Vitals] TTFB: ${ttfb}ms`);
      
      if ((window as any).gtag) {
        (window as any).gtag('event', 'web_vitals', {
          event_category: 'performance',
          event_label: 'ttfb',
          value: ttfb,
          ttfb_good: ttfb < 600
        });
      }
    }
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.imageMetrics = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Initialize performance monitoring on app startup
 */
export function initializePerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  console.log('📊 [Performance Monitoring] Initialized');

  // Track Core Web Vitals
  performanceMonitor.trackWebVitals();

  // Log summary after 10 seconds
  setTimeout(() => {
    performanceMonitor.logSummary();
  }, 10000);

  // Log summary on page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.logSummary();
  });

  // Expose to window for debugging in dev mode
  if (process.env.NODE_ENV === 'development') {
    (window as any).performanceMonitor = performanceMonitor;
    console.log('💡 [Dev] Performance monitor available at window.performanceMonitor');
  }
}

/**
 * Create a performance-tracked image load handler
 * Use this in image components to track load performance
 */
export function createImageLoadTracker(url: string) {
  const startTime = performance.now();
  
  return {
    onLoad: () => {
      const loadTime = performance.now() - startTime;
      const cacheHit = loadTime < 100; // Images loading in <100ms are likely cached
      
      performanceMonitor.trackImageLoad({
        url,
        loadTime,
        cacheHit
      });
    },
    onError: () => {
      console.error(`[Performance] Image load failed:`, url);
      
      if ((window as any).gtag) {
        (window as any).gtag('event', 'image_error', {
          event_category: 'performance',
          event_label: 'load_failed',
          url
        });
      }
    }
  };
}
