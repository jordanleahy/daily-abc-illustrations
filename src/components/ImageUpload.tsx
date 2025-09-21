import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({ onImageSelect, disabled = false, className = "" }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImage = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }

    // Check supported formats
    const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      return 'Supported formats: PNG, JPG, WEBP';
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'Image must be smaller than 5MB';
    }

    return null;
  };

  const checkAspectRatio = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const isSquare = Math.abs(aspectRatio - 1) < 0.1; // Allow 10% tolerance
        resolve(isSquare);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFile = async (file: File) => {
    const validationError = validateImage(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const isSquare = await checkAspectRatio(file);
    if (!isSquare) {
      toast.error('Image must have a 1:1 aspect ratio (square)');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onImageSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const openFileSelector = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      
      <div
        className={`
          w-full h-full border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
          ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
          ${preview ? 'p-0' : 'p-6'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt="Upload preview"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
              <Button variant="secondary" size="sm">
                Change Image
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Upload 1:1 Image</p>
              <p className="text-xs text-muted-foreground">
                Drop image here or click to browse
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertCircle className="w-3 h-3" />
              <span>PNG, JPG, WEBP • Max 5MB • Square aspect ratio</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}