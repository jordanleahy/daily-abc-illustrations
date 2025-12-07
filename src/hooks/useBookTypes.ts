import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BOOK_TYPES, BookType } from '@/config/bookTypes';
import { 
  Sparkles, 
  Hash, 
  Shapes, 
  Palette, 
  Music, 
  ArrowLeftRight, 
  Heart, 
  PawPrint, 
  MessageCircle, 
  Moon,
  BookOpen,
  Eye,
  Package,
  LucideIcon
} from 'lucide-react';

export interface DatabaseBookType {
  id: string;
  label: string;
  description: string | null;
  prompt: string | null;
  icon_name: string;
  color: string | null;
  expected_page_count: number | null;
  needs_clarification: boolean;
  clarification_context: string | null;
  sort_order: number;
  is_active: boolean;
}

// Map icon names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Hash,
  Shapes,
  Palette,
  Music,
  ArrowLeftRight,
  Heart,
  PawPrint,
  MessageCircle,
  Moon,
  BookOpen,
  Eye,
  Package,
};

// Convert database record to frontend BookType format
function toBookType(db: DatabaseBookType): BookType {
  return {
    id: db.id as BookType['id'],
    label: db.label,
    description: db.description || '',
    prompt: db.prompt || '',
    icon: ICON_MAP[db.icon_name] || Package,
    color: db.color || 'text-gray-500',
    expectedPageCount: db.expected_page_count || undefined,
    needsClarification: db.needs_clarification || undefined,
    clarificationContext: db.clarification_context || undefined,
  };
}

export function useBookTypes() {
  const query = useQuery({
    queryKey: ['book-types'],
    queryFn: async (): Promise<DatabaseBookType[]> => {
      const { data, error } = await supabase
        .from('book_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5-minute cache
  });

  // Return unified BookType format, falling back to static types during loading
  const bookTypes: BookType[] = query.data 
    ? query.data.map(toBookType)
    : BOOK_TYPES as BookType[];

  return {
    ...query,
    bookTypes,
    // Helper to find a book type by ID
    getBookType: (id: string): BookType | undefined => 
      bookTypes.find(bt => bt.id === id),
  };
}
