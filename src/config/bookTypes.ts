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
  Package
} from 'lucide-react';
import { BookTypeId } from '@/types/bookType';

export interface BookType {
  id: BookTypeId;
  label: string;
  icon: any; // Lucide icon component
  prompt: string;
  description: string;
  color: string; // Tailwind color class for styling
  needsClarification?: boolean;
  clarificationContext?: string;
}

export const BOOK_TYPES = [
  {
    id: 'abc' as const,
    label: 'ABC Book',
    icon: Sparkles,
    description: 'Alphabet learning with letter recognition (26 pages A-Z)',
    prompt: 'I want to create an educational ABC book with 26 pages (A-Z). Each page should focus on one letter with engaging illustrations and simple activities for letter recognition. Page titles should use parentheses around the letter, like "(a) is for apple" to help readers say the letter name instead of the sound.',
    color: 'text-blue-500',
    needsClarification: true,
    clarificationContext: 'Ask about letter case preference: lowercase like (a), (b), (c) for toddlers, uppercase like (A), (B), (C) for preschoolers, or both cases like (Aa), (Bb), (Cc) for early readers. Explain that the book will have 26 pages (one for each letter) and parentheses help readers say the letter NAME instead of the sound. Provide these 3 specific options plus custom.'
  },
  {
    id: 'numbers',
    label: 'Numbers Book',
    icon: Hash,
    description: 'Counting and number recognition (any 10-number range)',
    prompt: 'I want to create a numbers book that teaches counting and number recognition. Include fun counting activities and clear number illustrations. IMPORTANT: Page titles must use numeric digits (1, 2, 3, 4...) NOT written words (one, two, three...). For example: "1 apple", "2 birds", "3 cars".',
    color: 'text-green-500',
    needsClarification: true,
    clarificationContext: 'Ask about number range preference. The book will have exactly 10 pages covering any consecutive 10-number range. Popular options: 1-10 (for toddlers learning first numbers), 11-20 (for building on basics), 10-20 (for tens place practice), or any custom 10-number range like 30-40, 60-70. Also consider counting style: simple counting, skip counting (2s, 5s, 10s), or number families. Provide these specific examples and emphasize custom ranges are welcome.'
  },
  {
    id: 'shapes',
    label: 'Shapes Book',
    icon: Shapes,
    description: 'Basic shapes (circle, square, triangle, etc.)',
    prompt: 'I want to create a shapes book for toddlers that introduces basic shapes. Make it interactive and engaging.',
    color: 'text-purple-500',
    needsClarification: true,
    clarificationContext: 'Ask about shape complexity: basic shapes only (circle, square, triangle), 2D and 3D shapes together, or advanced geometric shapes. Also consider themes like shapes in nature or shapes in everyday objects. Provide 3-4 specific suggestions with a custom option.'
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
    prompt: 'I want to create an animals book for toddlers. Include fun facts and sounds each animal makes.',
    color: 'text-amber-500',
    needsClarification: true,
    clarificationContext: 'Ask about animal category: farm animals (cow, pig, chicken), zoo animals (lion, elephant, giraffe), ocean animals (fish, whale, dolphin), pets (dog, cat, rabbit), or mixed animals. Also consider educational focus like animal sounds, habitats, or characteristics. Provide 4-5 specific suggestions with a custom option.'
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
  },
  {
    id: 'sight-words',
    label: 'Sight Words Book',
    icon: Eye,
    description: 'High-frequency words for reading fluency',
    prompt: 'I want to create a Sight Words book for early readers that teaches high-frequency words essential for reading fluency. Each page should focus on one sight word shown in a simple, engaging sentence with contextual illustrations. Use established sight word lists (Dolch or Fry) and order words from most to least common.',
    color: 'text-teal-500',
    needsClarification: true,
    clarificationContext: 'Ask about reading level preference: Pre-K/Kindergarten (20-25 basic words like: the, and, a, to, you), Grade 1 (50 words - expanded list), Grade 2 (100 words - advanced list), or Custom word list. Provide these 4 specific options. Explain that each page will feature one sight word in a simple sentence with an illustration.'
  },
  {
    id: 'other',
    label: 'Other',
    icon: Package,
    description: 'Miscellaneous books',
    prompt: '',
    color: 'text-gray-500'
  }
];
