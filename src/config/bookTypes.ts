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
  GraduationCap
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
  expectedPageCount?: number; // Total pages including cover + education + content
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
    clarificationContext: 'Ask about letter case preference: lowercase like (a), (b), (c) for toddlers, uppercase like (A), (B), (C) for preschoolers, or both cases like (Aa), (Bb), (Cc) for early readers. Explain that the book will have 26 pages (one for each letter) and parentheses help readers say the letter NAME instead of the sound. Provide these 3 specific options plus custom.',
    expectedPageCount: 28 // 1 cover + 1 education + 26 letter pages
  },
  {
    id: 'rhyming',
    label: 'Rhyming Book',
    icon: Music,
    description: 'Phonemic awareness and sound patterns (10 content pages)',
    prompt: 'I want to create a rhyming book for toddlers that builds phonemic awareness through fun rhymes and sound patterns. Make it musical and memorable.',
    color: 'text-orange-500',
    expectedPageCount: 12 // 1 cover + 1 education + 10 content pages
  },
  {
    id: 'numbers',
    label: 'Numbers Book',
    icon: Hash,
    description: 'Counting and number recognition (10 content pages)',
    prompt: 'I want to create a numbers book that teaches counting and number recognition. Include fun counting activities and clear number illustrations. IMPORTANT: Page titles must use numeric digits (1, 2, 3, 4...) NOT written words (one, two, three...). For example: "1 apple", "2 birds", "3 cars".',
    color: 'text-green-500',
    needsClarification: true,
    clarificationContext: 'Ask about number range preference. The book will have exactly 10 content pages covering any consecutive 10-number range. Popular options: 1-10 (for toddlers learning first numbers), 11-20 (for building on basics), 10-20 (for tens place practice), or any custom 10-number range like 30-40, 60-70. Also consider counting style: simple counting, skip counting (2s, 5s, 10s), or number families. Provide these specific examples and emphasize custom ranges are welcome.',
    expectedPageCount: 12 // 1 cover + 1 education + 10 content pages
  },
  {
    id: 'shapes',
    label: 'Shapes Book',
    icon: Shapes,
    description: 'Basic shapes (10 content pages)',
    prompt: 'I want to create a shapes book for toddlers that introduces basic shapes. Make it interactive and engaging.',
    color: 'text-purple-500',
    needsClarification: true,
    clarificationContext: 'Ask about shape complexity: basic shapes only (circle, square, triangle), 2D and 3D shapes together, or advanced geometric shapes. Also consider themes like shapes in nature or shapes in everyday objects. Provide 3-4 specific suggestions with a custom option.',
    expectedPageCount: 12 // 1 cover + 1 education + 10 content pages
  },
  {
    id: 'colors',
    label: 'Colors Book',
    icon: Palette,
    description: 'Primary and secondary colors (10 content pages)',
    prompt: 'I want to create a colors book for toddlers that teaches primary and secondary colors. Each page should focus on one color with vibrant illustrations and real-world examples.',
    color: 'text-pink-500',
    expectedPageCount: 12 // 1 cover + 1 education + 10 content pages
  },
  {
    id: 'opposites',
    label: 'Opposites Book',
    icon: ArrowLeftRight,
    description: 'Big/small, hot/cold, up/down concepts (10 content pages)',
    prompt: 'I want to create an opposites book for toddlers that teaches concepts like big/small, hot/cold, up/down, fast/slow. Use clear contrasting illustrations.',
    color: 'text-cyan-500',
    expectedPageCount: 12 // 1 cover + 1 education + 10 content pages
  },
  {
    id: 'emotions',
    label: 'Emotions Book',
    icon: Heart,
    description: 'Happy, sad, angry, scared feelings (10 content pages)',
    prompt: 'I want to create an emotions book for toddlers that helps them identify and understand feelings like happy, sad, angry, scared, excited. Make it relatable and supportive.',
    color: 'text-red-500',
    expectedPageCount: 12 // 1 cover + 1 education + 10 content pages
  },
  {
    id: 'animals',
    label: 'Animals Book',
    icon: PawPrint,
    description: 'Farm animals, zoo animals, pets (10 content pages)',
    prompt: 'I want to create an animals book for toddlers. Include fun facts and sounds each animal makes.',
    color: 'text-amber-500',
    needsClarification: true,
    clarificationContext: 'Ask about animal category: farm animals (cow, pig, chicken), zoo animals (lion, elephant, giraffe), ocean animals (fish, whale, dolphin), pets (dog, cat, rabbit), or mixed animals. Also consider educational focus like animal sounds, habitats, or characteristics. Provide 4-5 specific suggestions with a custom option.',
    expectedPageCount: 12 // 1 cover + 1 education + 10 content pages
  },
  {
    id: 'first-words',
    label: 'First Words Book',
    icon: MessageCircle,
    description: 'Common vocabulary building (10 content pages)',
    prompt: 'I want to create a first words book for toddlers that builds common vocabulary with everyday objects, actions, and concepts they encounter.',
    color: 'text-indigo-500',
    expectedPageCount: 12 // 1 cover + 1 education + 10 content pages
  },
  {
    id: 'bedtime',
    label: 'Bedtime Routine Book',
    icon: Moon,
    description: 'Daily routines and sequences (10 content pages)',
    prompt: 'I want to create a bedtime routine book for toddlers that shows the daily sequence of bedtime activities. Make it calming and reassuring.',
    color: 'text-violet-500',
    expectedPageCount: 12 // 1 cover + 1 education + 10 content pages
  },
  {
    id: 'cvc',
    label: 'CVC Words Book',
    icon: BookOpen,
    description: 'CVC contrast sentence pairs for decoding practice (10 content pages)',
    prompt: 'I want to create a CVC contrast sentence book that teaches reading through sentence pairs where one CVC word is swapped. Example: "The cat sat." → "The bat sat." This helps children connect decoding to comprehension.',
    color: 'text-emerald-500',
    needsClarification: true,
    clarificationContext: 'Ask about vowel focus preference: short-a words (cat/bat, hat/rat), short-o words (mop/top, hop/pop), short-i words (pin/win, sit/hit), short-u words (sun/fun, bug/hug), short-e words (pet/wet, hen/pen), or mixed vowels. Each page will show two contrasting sentences where one CVC word changes meaning.',
    expectedPageCount: 12 // 1 cover + 1 education + 10 content pages
  },
  {
    id: 'sight-words',
    label: 'Sight Words Book',
    icon: Eye,
    description: 'High-frequency words for reading fluency (10 content pages)',
    prompt: 'I want to create a Sight Words book for early readers that teaches high-frequency words essential for reading fluency. Each page should focus on one sight word shown in a simple, engaging sentence with contextual illustrations. Use established sight word lists (Dolch or Fry) and order words from most to least common.',
    color: 'text-teal-500',
    needsClarification: true,
    clarificationContext: 'Ask about reading level preference: Pre-K/Kindergarten (20-25 basic words like: the, and, a, to, you), Grade 1 (50 words - expanded list), Grade 2 (100 words - advanced list), or Custom word list. Provide these 4 specific options. Explain that each page will feature one sight word in a simple sentence with an illustration.',
    expectedPageCount: 12 // 1 cover + 1 education + 10 content pages
  },
  {
    id: 'general' as const,
    label: 'Custom Topic',
    icon: Sparkles,
    description: 'Create a book about any topic (manners, routines, life skills)',
    prompt: 'I want to create a custom educational book on a specific topic. Help me choose a character theme, age group, topic focus, and environment to create a personalized learning experience.',
    color: 'text-emerald-500',
    needsClarification: true,
    clarificationContext: 'Guide the user through topic selection (manners, routines, life skills, etc.) and environment setting (home, school, mountain, etc.) to create a personalized educational book.',
    expectedPageCount: 12 // 1 cover + 1 education + 10 content pages
  },
  {
    id: 'digraphs' as const,
    label: 'Digraph Book',
    icon: BookOpen,
    description: 'Early phonics with digraph sounds (ch, sh, th, wh...)',
    prompt: 'I want to create a digraph book for early phonics instruction that teaches letter pairs making single sounds.',
    color: 'text-rose-500',
    needsClarification: true,
    clarificationContext: 'Ask about digraph focus: random digraphs for mixed practice OR specific digraph for targeted instruction on one sound.',
    expectedPageCount: 12 // 1 cover + 1 education + 10 content pages
  },
  {
    id: 'parent-education' as const,
    label: 'Parent Education',
    icon: GraduationCap,
    description: 'Science-backed reading development guides for parents',
    prompt: 'I want to create a parent education book that helps parents understand how to support their child\'s reading development with science-backed methods and practical daily habits.',
    color: 'text-teal-500',
    expectedPageCount: 12 // 1 cover + 1 education + 10 content pages
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
