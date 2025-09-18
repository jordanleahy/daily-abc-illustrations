import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  disabled?: boolean;
}

interface UseIntersectionObserverReturn<T extends HTMLElement = HTMLElement> {
  ref: React.RefObject<T>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

export function useIntersectionObserver<T extends HTMLElement = HTMLElement>({
  threshold = 0,
  rootMargin = '200px',
  triggerOnce = true,
  disabled = false,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverReturn<T> {
  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = ref.current;
    
    if (!element || disabled || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        
        if (isElementIntersecting) {
          setIsIntersecting(true);
          setEntry(entry);
          
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsIntersecting(false);
          setEntry(entry);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, disabled]);

  return { ref, isIntersecting, entry };
}