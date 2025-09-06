import { useState } from 'react';
import { Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroSidebar } from './HeroSidebar';
import { HeroActions } from './HeroActions';
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{content.title}</h1>
          <p className="text-2xl font-bold text-gray-900">{content.price}</p>
        </div>
        
        <div className="flex gap-2">
          <HeroActions 
            price={content.price}
            downloadUrl={content.downloadUrl}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar Thumbnails */}
        <div className="col-span-1">
          <HeroSidebar
            thumbnails={content.thumbnails}
            mainImage={content.mainImage}
            onImageSelect={setSelectedImage}
          />
        </div>

        {/* Main Image */}
        <div className="col-span-8">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-emerald-400 to-blue-500">
            <img
              src={selectedImage}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Specs Panel */}
        <div className="col-span-3">
          <HeroSpecs
            grade={content.grade}
            subjects={content.subjects}
            tags={content.tags}
          />
        </div>
      </div>

      {/* Share Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Share</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-gray-600 hover:text-gray-900"
            >
              <Share size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
        <p className="text-gray-700 leading-relaxed">{content.description}</p>
      </div>
    </div>
  );
};