import { useEffect, useRef, useState } from 'react';

interface PortionOverlayProps {
  imageUrl: string;
  portionPercentage: number;
  className?: string;
}

export function PortionOverlay({ imageUrl, portionPercentage, className = '' }: PortionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Set canvas size to match container
      const containerRect = container.getBoundingClientRect();
      const size = Math.min(containerRect.width, containerRect.height) || 300;
      
      canvas.width = size;
      canvas.height = size;

      // Draw the image scaled to fit
      const scale = Math.min(size / img.width, size / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;
      
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // Draw the portion arc overlay
      drawPortionArc(ctx, size, portionPercentage);
      
      setIsLoaded(true);
    };

    img.onerror = () => {
      // Fallback: draw just the arc on a placeholder
      const containerRect = container.getBoundingClientRect();
      const size = Math.min(containerRect.width, containerRect.height) || 300;
      
      canvas.width = size;
      canvas.height = size;
      
      // Fill with muted background
      ctx.fillStyle = 'hsl(var(--muted))';
      ctx.fillRect(0, 0, size, size);
      
      drawPortionArc(ctx, size, portionPercentage);
      setIsLoaded(true);
    };

    img.src = imageUrl;
  }, [imageUrl, portionPercentage]);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <canvas 
        ref={canvasRef} 
        className={`w-full h-full object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      )}
    </div>
  );
}

function drawPortionArc(ctx: CanvasRenderingContext2D, size: number, percentage: number) {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.42; // Slightly smaller than half to have margin
  const lineWidth = size * 0.06;
  
  // Background ring (full circle, semi-transparent)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // Portion arc (clockwise from top)
  const startAngle = -Math.PI / 2; // Start at top
  const endAngle = startAngle + (Math.PI * 2 * percentage / 100);
  
  // Gradient for the arc
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#22c55e'); // Green-500
  gradient.addColorStop(0.5, '#4ade80'); // Green-400
  gradient.addColorStop(1, '#86efac'); // Green-300
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Draw percentage text in center with background
  const text = `${percentage}%`;
  const fontSize = size * 0.12;
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Text background
  const textMetrics = ctx.measureText(text);
  const textHeight = fontSize * 1.2;
  const padding = size * 0.03;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(
    centerX - textMetrics.width / 2 - padding,
    centerY - textHeight / 2 - padding / 2,
    textMetrics.width + padding * 2,
    textHeight + padding,
    size * 0.02
  );
  ctx.fill();
  
  // Text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, centerX, centerY);

  // Label below percentage
  const label = 'to eat';
  const labelFontSize = size * 0.05;
  ctx.font = `${labelFontSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(label, centerX, centerY + fontSize * 0.7);
}
