import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SwipeUpDrawerProps {
  children: React.ReactNode;
  className?: string;
  onStateChange?: (isOpen: boolean) => void;
}

export function SwipeUpDrawer({ children, className, onStateChange }: SwipeUpDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const DRAWER_HEIGHT = 80; // vh
  const THRESHOLD = 50; // pixels to trigger open/close

  useEffect(() => {
    onStateChange?.(isOpen);
  }, [isOpen, onStateChange]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    currentY.current = e.touches[0].clientY;
    const deltaY = startY.current - currentY.current;
    
    if (isOpen) {
      // When open, allow dragging down to close
      if (deltaY < 0) {
        setDragOffset(Math.max(deltaY, -window.innerHeight * 0.8));
      }
    } else {
      // When closed, allow dragging up to open
      if (deltaY > 0) {
        setDragOffset(Math.min(deltaY, window.innerHeight * 0.8));
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const deltaY = startY.current - currentY.current;
    
    if (isOpen) {
      // If dragged down enough, close
      if (deltaY < -THRESHOLD) {
        setIsOpen(false);
      }
    } else {
      // If dragged up enough, open
      if (deltaY > THRESHOLD) {
        setIsOpen(true);
      }
    }
    
    setDragOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    currentY.current = e.clientY;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    currentY.current = e.clientY;
    const deltaY = startY.current - currentY.current;
    
    if (isOpen) {
      if (deltaY < 0) {
        setDragOffset(Math.max(deltaY, -window.innerHeight * 0.8));
      }
    } else {
      if (deltaY > 0) {
        setDragOffset(Math.min(deltaY, window.innerHeight * 0.8));
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const deltaY = startY.current - currentY.current;
    
    if (isOpen) {
      if (deltaY < -THRESHOLD) {
        setIsOpen(false);
      }
    } else {
      if (deltaY > THRESHOLD) {
        setIsOpen(true);
      }
    }
    
    setDragOffset(0);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const getTransform = () => {
    if (isDragging) {
      if (isOpen) {
        return `translateY(${-dragOffset}px)`;
      } else {
        return `translateY(calc(100% - 4rem + ${-dragOffset}px))`;
      }
    }
    
    return isOpen ? 'translateY(0)' : 'translateY(calc(100% - 4rem))';
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />
      
      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background border-t rounded-t-lg shadow-lg transition-transform duration-300 ease-out",
          isDragging && "duration-0",
          className
        )}
        style={{
          height: `${DRAWER_HEIGHT}vh`,
          transform: getTransform(),
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* Hint text when closed */}
        {!isOpen && (
          <div className="text-center text-sm text-muted-foreground py-2">
            Swipe up for upcoming books
          </div>
        )}
        
        {/* Content */}
        <div className={cn(
          "flex-1 overflow-hidden transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0"
        )}>
          {children}
        </div>
      </div>
    </>
  );
}