import { useState } from 'react';
import { Facebook, Twitter, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UniversalInlineEdit } from '@/components/ui/universal-inline-edit';
import { HeroSidebar } from './HeroSidebar';
import { HeroTitleSection } from './HeroTitleSection';
import { HeroSpecsOnly } from './HeroSpecsOnly';
import { HeroSpecsOptimized } from './HeroSpecsOptimized';
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
          <HeroSpecsOptimized
            content={content}
            onSave={async (updatedContent) => {
              console.log('Saving optimized content:', updatedContent);
              if (onUpdateField) {
                Object.keys(updatedContent).forEach(key => {
                  if (key === 'subjects' || key === 'tags') {
                    // Handle array fields
                    onUpdateField(key, updatedContent[key as keyof typeof updatedContent]);
                  } else {
                    onUpdateField(key, updatedContent[key as keyof typeof updatedContent]);
                  }
                });
              }
            }}
            downloadUrl={content.downloadUrl}
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

      {/* Optimized Description Edit with auto-save */}
      <div className="mt-4">
        <h2 className="text-xl font-bold text-foreground mb-3">Description</h2>
        <UniversalInlineEdit
          value={content.description || ''}
          onSave={async (description) => {
            console.log('Auto-saving description:', description);
            onUpdateField?.('description', description);
          }}
          multiline
          rows={4}
          placeholder="Add a description..."
          renderDisplay={(value) => (
            <p className="text-muted-foreground leading-relaxed">
              {value || "Click to add a description..."}
            </p>
          )}
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