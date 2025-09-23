import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const UploadDebugger = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTestUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      setUploadStatus('No file selected or user not authenticated');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Starting upload...');

    try {
      // Test upload to book-covers bucket
      const fileName = `${user.id}/test-${Date.now()}.${file.name.split('.').pop()}`;
      setUploadStatus(`Uploading to book-covers/${fileName}...`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(fileName, file);

      if (uploadError) {
        setUploadStatus(`Upload failed: ${uploadError.message}`);
        toast.error(`Upload failed: ${uploadError.message}`);
        return;
      }

      setUploadStatus('Upload successful! Getting public URL...');

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('book-covers')
        .getPublicUrl(fileName);

      if (publicUrl?.publicUrl) {
        setUploadStatus(`Success! URL: ${publicUrl.publicUrl}`);
        toast.success('Test upload successful!');
      } else {
        setUploadStatus('Upload successful but failed to get public URL');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUploadStatus(`Unexpected error: ${errorMessage}`);
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="w-5 h-5" />
          Upload Debugger
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-orange-700">
            Test image upload functionality to diagnose issues
          </p>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Testing...' : 'Test Upload'}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleTestUpload}
            className="hidden"
          />

          {uploadStatus && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <p className="text-sm font-mono">{uploadStatus}</p>
            </div>
          )}

          <div className="text-xs text-gray-600">
            <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
            <p><strong>Current Time:</strong> {new Date().toISOString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};