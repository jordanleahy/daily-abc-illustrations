import React, { useState, useRef, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlideToUnlockProps {
  onUnlock: () => void;
  disabled?: boolean;
  className?: string;
  text?: string;
}

export function SlideToUnlock({ onUnlock, disabled = false, className, text }: SlideToUnlockProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  const COMPLETION_THRESHOLD = 0.85; // 85% completion required
  const THUMB_SIZE = 56; // Height of the thumb in pixels

  const resetSlider = useCallback(() => {
    setDragProgress(0);
    setIsDragging(false);
    setIsCompleted(false);
    currentX.current = 0;
  }, []);

  const handleStart = useCallback((clientX: number) => {
    if (disabled) return;
    
    setIsDragging(true);
    startX.current = clientX;
    currentX.current = 0;
  }, [disabled]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || disabled || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const maxDistance = containerWidth - THUMB_SIZE;
    const deltaX = clientX - startX.current;
    
    currentX.current = Math.max(0, Math.min(deltaX, maxDistance));
    const progress = currentX.current / maxDistance;
    
    setDragProgress(progress);
    setIsCompleted(progress >= COMPLETION_THRESHOLD);
  }, [isDragging, disabled]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    
    if (dragProgress >= COMPLETION_THRESHOLD && !disabled) {
      onUnlock();
      resetSlider();
    } else {
      // Reset with animation
      resetSlider();
    }
  }, [isDragging, dragProgress, disabled, onUnlock, resetSlider]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  }, [handleStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX);
  }, [handleMove]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    handleEnd();
  }, [handleEnd]);

  // Effect to handle global mouse/touch events
  React.useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const thumbTransform = isDragging 
    ? `translateX(${currentX.current}px)` 
    : 'translateX(0px)';

  const progressWidth = dragProgress * 100;

  const getText = () => {
    if (disabled) return 'The End!';
    if (isCompleted) return 'Release to continue';
    return text || 'Slide';
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-14 bg-muted rounded-full overflow-hidden select-none touch-none",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={{ touchAction: 'none' }}
    >
      {/* Progress background */}
      <div 
        className="absolute inset-0 bg-primary/20 transition-all duration-200 rounded-full"
        style={{ 
          width: `${progressWidth}%`,
          transition: isDragging ? 'none' : 'width 0.3s ease-out'
        }}
      />
      
      {/* Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(
          "text-sm font-medium transition-colors duration-200",
          isCompleted ? "text-primary" : "text-muted-foreground"
        )}>
          {getText()}
        </span>
      </div>
      
      {/* Draggable thumb */}
      <div
        ref={thumbRef}
        className={cn(
          "absolute left-0 top-0 h-full aspect-square bg-primary rounded-full shadow-lg",
          "flex items-center justify-center cursor-grab active:cursor-grabbing",
          "transition-transform duration-300 ease-out",
          disabled && "cursor-not-allowed"
        )}
        style={{ 
          transform: thumbTransform,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <ArrowRight className={cn(
          "w-6 h-6 text-primary-foreground transition-transform duration-200",
          isCompleted && "scale-110"
        )} />
      </div>
    </div>
  );
}