/**
 * PHASE 4: Performance Dashboard (Dev Only)
 * Visual dashboard to monitor image loading performance in development
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { performanceMonitor } from '@/utils/performanceMonitoring';
import { Zap, Image, TrendingUp, AlertCircle } from 'lucide-react';

export function PerformanceDashboard() {
  const [summary, setSummary] = useState(performanceMonitor.getSummary());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Update summary every 3 seconds
    const interval = setInterval(() => {
      setSummary(performanceMonitor.getSummary());
    }, 3000);

    // Show dashboard in dev mode with keyboard shortcut (Ctrl+Shift+P)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const cacheHitRate = parseFloat(summary.cacheHitRate);
  const avgLoadTime = parseFloat(summary.averageLoadTime);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-2xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance Monitor
            </CardTitle>
            <button
              onClick={() => setIsVisible(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Cache Hit Rate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Cache Hit Rate</span>
              <Badge variant={cacheHitRate > 80 ? 'default' : 'secondary'}>
                {summary.cacheHitRate}
              </Badge>
            </div>
            <Progress value={cacheHitRate} className="h-2" />
          </div>

          {/* Average Load Time */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Avg Load Time</span>
              <Badge variant={avgLoadTime < 200 ? 'default' : avgLoadTime < 500 ? 'secondary' : 'destructive'}>
                {summary.averageLoadTime}
              </Badge>
            </div>
            <Progress 
              value={Math.min((1000 - avgLoadTime) / 10, 100)} 
              className="h-2" 
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Image className="h-3 w-3" />
                <span className="text-xs">Total Images</span>
              </div>
              <div className="text-lg font-bold">{summary.totalImages}</div>
            </div>

            <div className="bg-muted/50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">Cache Hits</span>
              </div>
              <div className="text-lg font-bold text-green-600">{summary.cacheHits}</div>
            </div>

            <div className="bg-muted/50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs">Cache Misses</span>
              </div>
              <div className="text-lg font-bold text-orange-600">{summary.cacheMisses}</div>
            </div>

            <div className="bg-muted/50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs">Slow Images</span>
              </div>
              <div className="text-lg font-bold text-red-600">{summary.slowImages}</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Press <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+Shift+P</kbd> to toggle
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
