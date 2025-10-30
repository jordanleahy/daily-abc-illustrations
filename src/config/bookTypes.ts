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
  BookOpen
} from 'lucide-react';

export interface BookType {
  id: string;
  label: string;
  icon: any; // Lucide icon component
  prompt: string;
  description: string;
  color: string; // Tailwind color class for styling
}

export const BOOK_TYPES: BookType[] = [
  {
    id: 'abc',
    label: 'ABC Book',
    icon: Sparkles,
    description: 'Alphabet learning with letter recognition',
    prompt: 'I want to create an educational ABC book for toddlers. Each page should focus on one letter with engaging illustrations and simple activities for letter recognition.',
    color: 'text-blue-500'
  },
  {
    id: 'numbers',
    label: 'Numbers Book',
    icon: Hash,
    description: 'Counting and number recognition (1-10 or 1-20)',
    prompt: 'I want to create a numbers book for toddlers that teaches counting and number recognition from 1 to 10. Include fun counting activities and clear number illustrations.',
    color: 'text-green-500'
  },
  {
    id: 'shapes',
    label: 'Shapes Book',
    icon: Shapes,
    description: 'Basic shapes (circle, square, triangle, etc.)',
    prompt: 'I want to create a shapes book for toddlers that introduces basic shapes like circles, squares, triangles, rectangles, and more. Make it interactive and engaging.',
    color: 'text-purple-500'
  },
  {
    id: 'colors',
    label: 'Colors Book',
    icon: Palette,
    description: 'Primary and secondary colors',
    prompt: 'I want to create a colors book for toddlers that teaches primary and secondary colors. Each page should focus on one color with vibrant illustrations and real-world examples.',
    color: 'text-pink-500'
  },
  {
    id: 'rhyming',
    label: 'Rhyming Book',
    icon: Music,
    description: 'Phonemic awareness and sound patterns',
    prompt: 'I want to create a rhyming book for toddlers that builds phonemic awareness through fun rhymes and sound patterns. Make it musical and memorable.',
    color: 'text-orange-500'
  },
  {
    id: 'opposites',
    label: 'Opposites Book',
    icon: ArrowLeftRight,
    description: 'Big/small, hot/cold, up/down concepts',
    prompt: 'I want to create an opposites book for toddlers that teaches concepts like big/small, hot/cold, up/down, fast/slow. Use clear contrasting illustrations.',
    color: 'text-cyan-500'
  },
  {
    id: 'emotions',
    label: 'Emotions Book',
    icon: Heart,
    description: 'Happy, sad, angry, scared feelings',
    prompt: 'I want to create an emotions book for toddlers that helps them identify and understand feelings like happy, sad, angry, scared, excited. Make it relatable and supportive.',
    color: 'text-red-500'
  },
  {
    id: 'animals',
    label: 'Animals Book',
    icon: PawPrint,
    description: 'Farm animals, zoo animals, pets',
    prompt: 'I want to create an animals book for toddlers featuring farm animals, zoo animals, or pets. Include fun facts and sounds each animal makes.',
    color: 'text-amber-500'
  },
  {
    id: 'first-words',
    label: 'First Words Book',
    icon: MessageCircle,
    description: 'Common vocabulary building',
    prompt: 'I want to create a first words book for toddlers that builds common vocabulary with everyday objects, actions, and concepts they encounter.',
    color: 'text-indigo-500'
  },
  {
    id: 'bedtime',
    label: 'Bedtime Routine Book',
    icon: Moon,
    description: 'Daily routines and sequences',
    prompt: 'I want to create a bedtime routine book for toddlers that shows the daily sequence of bedtime activities. Make it calming and reassuring.',
    color: 'text-violet-500'
  },
  {
    id: 'cvc',
    label: 'CVC Words Book',
    icon: BookOpen,
    description: 'Consonant-Vowel-Consonant words (cat, dog, sun)',
    prompt: 'I want to create a CVC (Consonant-Vowel-Consonant) words book for toddlers learning to read. Focus on simple three-letter words like cat, dog, sun, bat, pig. Include phonics and word family patterns.',
    color: 'text-emerald-500'
  }
];
