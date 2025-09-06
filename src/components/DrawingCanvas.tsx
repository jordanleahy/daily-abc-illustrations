import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Brush, 
  Pen, 
  Eraser, 
  RotateCcw, 
  Trash2,
  Download,
  Palette
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface DrawingPath {
  points: Point[];
  color: string;
  size: number;
  tool: 'brush' | 'pen' | 'eraser';
}

const colors = [
  { name: 'black', value: '#000000', css: 'bg-color-black' },
  { name: 'red', value: '#dc2626', css: 'bg-color-red' },
  { name: 'orange', value: '#ea580c', css: 'bg-color-orange' },
  { name: 'yellow', value: '#ca8a04', css: 'bg-color-yellow' },
  { name: 'green', value: '#16a34a', css: 'bg-color-green' },
  { name: 'blue', value: '#2563eb', css: 'bg-color-blue' },
  { name: 'purple', value: '#9333ea', css: 'bg-color-purple' },
  { name: 'pink', value: '#dc2626', css: 'bg-color-pink' },
];

const DrawingCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'brush' | 'pen' | 'eraser'>('brush');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  const getPointFromEvent = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const point = getPointFromEvent(e);
    setCurrentPath([point]);
  }, [getPointFromEvent]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const point = getPointFromEvent(e);
    setCurrentPath(prev => [...prev, point]);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = currentTool === 'eraser' ? '#000000' : currentColor;
    ctx.lineWidth = currentTool === 'eraser' ? brushSize * 3 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentPath.length > 1) {
      const lastPoint = currentPath[currentPath.length - 2];
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  }, [isDrawing, getPointFromEvent, currentPath, currentTool, currentColor, brushSize]);

  const stopDrawing = useCallback(() => {
    if (isDrawing && currentPath.length > 0) {
      const newPath: DrawingPath = {
        points: currentPath,
        color: currentColor,
        size: brushSize,
        tool: currentTool,
      };
      setPaths(prev => [...prev, newPath]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, currentPath, currentColor, brushSize, currentTool]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPaths([]);
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    paths.forEach(path => {
      if (path.points.length < 2) return;
      
      ctx.globalCompositeOperation = path.tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = path.tool === 'eraser' ? '#000000' : path.color;
      ctx.lineWidth = path.tool === 'eraser' ? path.size * 3 : path.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    });
  }, [paths]);

  const undo = useCallback(() => {
    setPaths(prev => prev.slice(0, -1));
  }, []);

  useEffect(() => {
    redrawCanvas();
  }, [paths, redrawCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }, []);

  const downloadCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'abc-illustration.png';
    link.href = canvas.toDataURL();
    link.click();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-toolbar-border bg-toolbar-bg">
        <h1 className="text-2xl font-bold text-foreground">ABC Illustrations</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={paths.length === 0}
            className="tool-button"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCanvas}
            className="tool-button"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <aside className="w-20 p-4 toolbar border-r border-toolbar-border flex flex-col gap-4">
          {/* Tools */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="icon"
              className="tool-button w-12 h-12"
              data-active={currentTool === 'brush'}
              onClick={() => setCurrentTool('brush')}
            >
              <Brush className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="tool-button w-12 h-12"
              data-active={currentTool === 'pen'}
              onClick={() => setCurrentTool('pen')}
            >
              <Pen className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="tool-button w-12 h-12"
              data-active={currentTool === 'eraser'}
              onClick={() => setCurrentTool('eraser')}
            >
              <Eraser className="w-5 h-5" />
            </Button>
          </div>

          <Separator />

          {/* Colors */}
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <Palette className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {colors.map((color) => (
                <button
                  key={color.name}
                  className={`color-swatch ${color.css} ${
                    currentColor === color.value ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setCurrentColor(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Brush Size */}
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-center text-muted-foreground">
              Size: {brushSize}px
            </div>
          </div>

          <Separator />

          {/* Clear */}
          <Button
            variant="destructive"
            size="icon"
            className="w-12 h-12 mt-auto"
            onClick={clearCanvas}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 p-6 bg-muted/10">
          <div className="w-full h-full canvas-container">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DrawingCanvas;