import { useState } from 'react';
import { VideoExportButton } from '@/components/exports/VideoExportButton';
import { StandardPageLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Test page for video export functionality
 * Access at /test-video-export
 */
export default function VideoExportTest() {
  const [text, setText] = useState('A is for Apple');
  const [imageUrl, setImageUrl] = useState(
    'https://hjdvsvsreaxzpqjvhxfb.supabase.co/storage/v1/object/public/page_images/samples/apple.jpg'
  );

  return (
    <StandardPageLayout title="Video Export Test">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Video Export Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text">Text to speak</Label>
              <Input
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="A is for Apple"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Background image URL</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {imageUrl && (
              <div className="aspect-square max-w-[300px] rounded-lg overflow-hidden bg-muted">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '';
                  }}
                />
              </div>
            )}

            <div className="pt-4 border-t">
              <VideoExportButton
                imageUrl={imageUrl}
                text={text}
                pageLetter="A"
                pageTitle="Apple"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Enter the text you want spoken (e.g., "A is for Apple")</p>
            <p>2. Provide an image URL for the background</p>
            <p>3. Select your preferred aspect ratio</p>
            <p>4. Click "Export Video" to generate and download</p>
            <p className="text-xs mt-4">
              The video will be a WebM file with synced audio and word-by-word highlighting.
            </p>
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  );
}
