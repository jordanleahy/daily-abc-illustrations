import { useEffect, useRef, useState } from 'react';

export interface UseIntersectionObserverOptions {
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
}

/**
 * Custom Intersection Observer hook for advanced lazy loading
 * Returns a ref to attach to the element and visibility state
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const { rootMargin = '0px', threshold = 0, triggerOnce = false } = options;
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // If already triggered once and triggerOnce is true, don't observe again
    if (triggerOnce && inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setInView(isIntersecting);

        // If triggerOnce, disconnect after first intersection
        if (isIntersecting && triggerOnce) {
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, triggerOnce, inView]);

  return { ref, inView };
}
