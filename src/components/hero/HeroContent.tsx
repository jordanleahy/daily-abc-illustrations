import { useState } from 'react';
import { Facebook, Twitter, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineEditTextarea } from '@/components/ui/inline-edit-textarea';
import { HeroSidebar } from './HeroSidebar';
import { HeroTitleSection } from './HeroTitleSection';
import { HeroSpecsOnly } from './HeroSpecsOnly';
import { HeroSpecs } from './HeroSpecs';
import { DailyContent } from './types';

interface HeroContentProps {
  content: DailyContent;
  isEditing?: boolean;
  hasChanges?: boolean;
  onEditClick?: () => void;
  onSaveClick?: () => void;
  onCancelClick?: () => void;
  onUpdateField?: (field: string, value: any) => void;
  onUpdateArrayField?: (field: 'subjects' | 'tags', value: string) => void;
}

export const HeroContent = ({ 
  content, 
  isEditing = false,
  hasChanges = false,
  onEditClick,
  onSaveClick,
  onCancelClick,
  onUpdateField,
  onUpdateArrayField
}: HeroContentProps) => {
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Sidebar Thumbnails - Hidden on mobile and tablet */}
        <div className="hidden lg:block lg:col-span-1">
          <HeroSidebar
            thumbnails={content.thumbnails}
            mainImage={content.mainImage}
            onImageSelect={setSelectedImage}
          />
        </div>

        {/* Main Image */}
        <div className="col-span-1 lg:col-span-8">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-emerald-400 to-blue-500">
            <img
              src={selectedImage}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Specs Panel - Hidden on mobile and tablet, shown on desktop */}
        <div className="hidden lg:block lg:col-span-3">
          <HeroSpecs
            title={content.title}
            price={content.price}
            downloadUrl={content.downloadUrl}
            publishedDate={content.publishedDate}
            grade={content.grade}
            subjects={content.subjects}
            tags={content.tags}
            isEditing={isEditing}
            hasChanges={hasChanges}
            onEditClick={onEditClick}
            onSaveClick={onSaveClick}
            onCancelClick={onCancelClick}
            onUpdateField={onUpdateField}
            onUpdateArrayField={onUpdateArrayField}
          />
        </div>
      </div>

      {/* Title Section - Below image on mobile and tablet */}
      <div className="mt-4 lg:hidden">
        <HeroTitleSection
          title={content.title}
          price={content.price}
          downloadUrl={content.downloadUrl}
          publishedDate={content.publishedDate}
          isEditing={isEditing}
          hasChanges={hasChanges}
          onEditClick={onEditClick}
          onSaveClick={onSaveClick}
          onCancelClick={onCancelClick}
          onUpdateField={onUpdateField}
        />
      </div>

      {/* Specs Section - Below title on mobile and tablet */}
      <div className="mt-6 lg:hidden">
        <HeroSpecsOnly
          grade={content.grade}
          subjects={content.subjects}
          tags={content.tags}
        />
      </div>

      {/* Description */}
      <div className="mt-4">
        <h2 className="text-xl font-bold text-foreground mb-3">Description</h2>
        <InlineEditTextarea
          value={content.description}
          onSave={(value) => onUpdateField?.('description', value)}
          isEditing={isEditing}
          renderDisplay={(value) => (
            <p className="text-muted-foreground leading-relaxed">{value}</p>
          )}
          className="text-muted-foreground leading-relaxed w-full border-none p-0 focus-visible:ring-1 bg-transparent resize-none"
          placeholder="Enter description..."
        />
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