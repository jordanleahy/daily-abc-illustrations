import { useState } from 'react';
import { BookImage } from '@/components/ui/book-image';

interface HeroSidebarProps {
  thumbnails: string[];
  mainImage: string;
  onImageSelect?: (image: string) => void;
}

export const HeroSidebar = ({ thumbnails, mainImage, onImageSelect }: HeroSidebarProps) => {
  const [selectedImage, setSelectedImage] = useState(mainImage);

  const handleImageClick = (image: string) => {
    setSelectedImage(image);
    onImageSelect?.(image);
  };

  return (
    <div className="flex flex-col gap-2 w-20">
      {thumbnails.map((thumbnail, index) => (
        <button
          key={index}
          onClick={() => handleImageClick(thumbnail)}
          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-primary ${
            selectedImage === thumbnail 
              ? 'border-primary ring-2 ring-primary/20' 
              : 'border-border'
          }`}
        >
          <BookImage
            src={thumbnail}
            alt={`Thumbnail ${index + 1}`}
            className="w-full h-full object-cover"
            priority={index === 0}
          />
        </button>
      ))}
    </div>
  );
};