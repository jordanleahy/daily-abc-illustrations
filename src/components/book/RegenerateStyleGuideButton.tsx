import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Loader2 } from 'lucide-react';

interface RegenerateStyleGuideButtonProps {
  bookId: string;
  bookName: string;
  bookDescription?: string;
  category?: string;
  onSuccess?: () => void;
}

export const RegenerateStyleGuideButton = ({
  bookId,
  bookName,
  bookDescription,
  category,
  onSuccess
}: RegenerateStyleGuideButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleRegenerate = async () => {
    setIsGenerating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to regenerate the style guide.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Generating Style Guide",
        description: "This may take a minute... Creating a detailed visual style guide with Gemini.",
      });

      const { data, error } = await supabase.functions.invoke('generate-style-guide', {
        body: {
          bookId,
          userId: user.id,
          bookMetadata: {
            book_name: bookName,
            book_description: bookDescription || '',
            category: category || 'General'
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Style Guide Generated!",
          description: `Successfully created a structured style guide using ${data.agentUsed?.model || 'AI'}.`,
        });
        
        onSuccess?.();
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error generating style guide:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate style guide. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleRegenerate}
      disabled={isGenerating}
      variant="default"
      size="sm"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Regenerate Style Guide
        </>
      )}
    </Button>
  );
};
