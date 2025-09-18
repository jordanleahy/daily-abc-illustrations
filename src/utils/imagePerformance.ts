interface ImageLoadMetrics {
  url: string;
  loadTime: number;
  size?: number;
  format?: string;
  fromCache: boolean;
  timestamp: number;
}

class ImagePerformanceTracker {
  private metrics: ImageLoadMetrics[] = [];
  private loadStartTimes = new Map<string, number>();

  startLoading(url: string): void {
    this.loadStartTimes.set(url, performance.now());
  }

  endLoading(url: string, fromCache: boolean = false, format?: string): void {
    const startTime = this.loadStartTimes.get(url);
    if (!startTime) return;

    const loadTime = performance.now() - startTime;
    
    const metric: ImageLoadMetrics = {
      url,
      loadTime,
      format,
      fromCache,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    this.loadStartTimes.delete(url);

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Image loaded: ${url.split('/').pop()} in ${loadTime.toFixed(2)}ms ${fromCache ? '(cached)' : ''}`);
    }
  }

  getMetrics(): ImageLoadMetrics[] {
    return [...this.metrics];
  }

  getAverageLoadTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const total = this.metrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    return total / this.metrics.length;
  }

  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    
    const cacheHits = this.metrics.filter(metric => metric.fromCache).length;
    return (cacheHits / this.metrics.length) * 100;
  }

  clear(): void {
    this.metrics = [];
    this.loadStartTimes.clear();
  }
}

export const imagePerformanceTracker = new ImagePerformanceTracker();

export function preloadImage(src: string, crossOrigin?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    if (crossOrigin) {
      img.crossOrigin = crossOrigin;
    }
    
    imagePerformanceTracker.startLoading(src);
    
    img.onload = () => {
      imagePerformanceTracker.endLoading(src, false);
      resolve();
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to preload image: ${src}`));
    };
    
    img.src = src;
  });
}

export function preloadCriticalImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map(url => preloadImage(url)));
}