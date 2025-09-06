import { useState } from 'react';
import { Facebook, Twitter, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroSidebar } from './HeroSidebar';
import { HeroSpecs } from './HeroSpecs';
import { DailyContent } from './types';

interface HeroContentProps {
  content: DailyContent;
}

export const HeroContent = ({ content }: HeroContentProps) => {
  const [selectedImage, setSelectedImage] = useState(content.mainImage);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: content.title,
        text: content.description,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="w-full">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        {/* Sidebar Thumbnails - Hidden on mobile */}
        <div className="hidden md:block md:col-span-1">
          <HeroSidebar
            thumbnails={content.thumbnails}
            mainImage={content.mainImage}
            onImageSelect={setSelectedImage}
          />
        </div>

        {/* Main Image */}
        <div className="col-span-1 md:col-span-8">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-emerald-400 to-blue-500">
            <img
              src={selectedImage}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Specs Panel - Stacked below on mobile */}
        <div className="col-span-1 md:col-span-3">
          <HeroSpecs
            title={content.title}
            price={content.price}
            downloadUrl={content.downloadUrl}
            grade={content.grade}
            subjects={content.subjects}
            tags={content.tags}
          />
        </div>
      </div>

      {/* Description */}
      <div className="mt-4">
        <h2 className="text-xl font-bold text-foreground mb-3">Description</h2>
        <p className="text-muted-foreground leading-relaxed">{content.description}</p>
      </div>

      {/* Share Section */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">Share</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-muted-foreground hover:text-foreground p-2"
          >
            <Facebook size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground p-2"
          >
            <Twitter size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground p-2"
          >
            <Share2 size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};