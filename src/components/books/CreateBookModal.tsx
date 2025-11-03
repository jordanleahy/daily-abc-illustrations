import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateBlankBook } from '@/hooks/useCreateBlankBook';
import { useCreateThemedBook } from '@/hooks/useCreateThemedBook';
import { BookOpen, MessageSquare, Zap, Sparkles } from 'lucide-react';
import { ModalProps } from '@/types/shared';

interface CreateBookModalProps extends ModalProps {}

const categories = [
  'Animals',
  'Science',
  'Nature',
  'Transportation',
  'Food',
  'Colors',
  'Shapes',
  'Numbers',
  'Sports',
  'General'
];

export function CreateBookModal({ open, onOpenChange }: CreateBookModalProps) {
  const [bookName, setBookName] = useState('');
  const [category, setCategory] = useState('General');
  const [theme, setTheme] = useState('');
  const createBlankBook = useCreateBlankBook();
  const createThemedBook = useCreateThemedBook();
  const navigate = useNavigate();

  const handleCreateTemplate = async () => {
    if (!bookName.trim()) {
      return;
    }

    try {
      const result = await createBlankBook.mutateAsync({
        bookName: bookName.trim(),
        category,
      });

      if (result.success && result.bookId) {
        onOpenChange(false);
        navigate(`/editor/${result.bookId}`);
      }
    } catch (error) {
      // Error is already handled by the mutation
    }
  };

  const handleCreateThemed = async () => {
    if (!theme.trim()) {
      return;
    }

    try {
      const result = await createThemedBook.mutateAsync({
        theme: theme.trim(),
      });

      if (result.success && result.bookId) {
        onOpenChange(false);
        navigate(`/editor/${result.bookId}`);
      }
    } catch (error) {
      // Error is already handled by the mutation
    }
  };

  const handleChatWithAI = () => {
    onOpenChange(false);
    navigate('/');
  };

  const resetForm = () => {
    setBookName('');
    setCategory('General');
    setTheme('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New ABC Book</DialogTitle>
          <DialogDescription>
            Choose how you'd like to create your educational ABC book
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Quick Template</CardTitle>
              </div>
              <CardDescription>
                Start with a ready-to-edit 26-page template with placeholder content for each letter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookName">Book Name</Label>
                <Input
                  id="bookName"
                  placeholder="e.g., Ocean Adventures, Farm Animals"
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  maxLength={100}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleCreateTemplate}
                disabled={!bookName.trim() || createBlankBook.isPending}
                className="w-full"
              >
                {createBlankBook.isPending ? 'Creating...' : 'Create Template'}
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-full">
                  <Sparkles className="w-5 h-5 text-accent-foreground" />
                </div>
                <CardTitle className="text-lg">AI Themed Book</CardTitle>
              </div>
              <CardDescription>
                Describe a theme and let AI create a complete book with content for all 26 letters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Book Theme</Label>
                <Input
                  id="theme"
                  placeholder="e.g., Kitchen Syllables - things you find in the kitchen"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  Describe what you want the book to be about
                </p>
              </div>

              <Button 
                onClick={handleCreateThemed}
                disabled={!theme.trim() || createThemedBook.isPending}
                className="w-full"
              >
                {createThemedBook.isPending ? 'Creating...' : 'Create with AI'}
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-full">
                  <MessageSquare className="w-5 h-5 text-secondary-foreground" />
                </div>
                <CardTitle className="text-lg">AI Assistant</CardTitle>
              </div>
              <CardDescription>
                Chat with our AI to create personalized content based on your specific needs and ideas
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col justify-end">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Custom page count</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Personalized content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Theme-based learning</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleChatWithAI}
                  variant="secondary"
                  className="w-full"
                >
                  Chat with AI
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}