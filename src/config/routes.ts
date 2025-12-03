import { LucideIcon, Home, BookOpen, Book, MessageSquare, Gift, Calendar, Users, Search, Video, BarChart, Target } from 'lucide-react';
import { NavigateFunction } from 'react-router-dom';

/**
 * Route permission requirements
 */
export type RoutePermission = {
  role?: 'admin' | 'teacher';
  feature?: 'habits_rewards';
  subscription?: boolean;
};

/**
 * Custom active state matching rule
 */
export type ActiveMatchRule = {
  exact?: boolean;
  startsWith?: boolean;
  pattern?: RegExp;
  exclude?: string[];
};

/**
 * Route configuration type
 */
export type RouteConfig = {
  path: string;
  name: string;
  icon?: LucideIcon;
  permission?: RoutePermission;
  activeMatch?: ActiveMatchRule;
  customClickHandler?: (navigate: NavigateFunction, currentPath: string) => boolean;
  group?: 'main' | 'admin' | 'rewards' | 'tools';
};

/**
 * Route paths as constants for type-safe navigation
 */
export const ROUTES = {
  HOME: '/home',
  LIBRARY: '/library',
  MY_BOOKS: '/books',
  ALL_BOOKS: '/all-books',
  GOOGLE_CHAT: '/google-chat',
  ADMIN_CHAT: '/admin-chat',
  BLOG_ADMIN: '/blog/admin',
  BLOG: '/blog',
  BLOG_POST: '/blog/:slug',
  REWARDS: '/rewards',
  MANAGE_HABITS: '/habits/manage',
  MY_TRICKS: '/my-tricks',
  VIDEOS: '/videos',
  AGENTS: '/agents',
  DAILY_PUB_SCHEDULE: '/daily-published-schedule',
  ADMIN_USER_ACTIVITY: '/admin/user-activity',
  REDDIT: '/reddit',
  AUTH: '/auth',
  PROFILE: '/profile',
  LANDING: '/',
} as const;

/**
 * Library-specific route builders
 */
export const LIBRARY_ROUTES = {
  BASE: '/library',
  BOOK_DETAIL: (bookId: string) => `/library/${bookId}`,
  CATEGORY: (categoryId: string) => `/library?category=${categoryId}`,
} as const;

/**
 * Main navigation configuration
 */
export const navigationConfig: RouteConfig[] = [
  {
    path: ROUTES.HOME,
    name: 'Home',
    icon: Home,
    group: 'main',
    activeMatch: { exact: true },
  },
  {
    path: ROUTES.LIBRARY,
    name: 'Library',
    icon: BookOpen,
    group: 'main',
    activeMatch: { 
      startsWith: true,
    },
  },
  {
    path: ROUTES.MY_BOOKS,
    name: 'My Books',
    icon: Book,
    group: 'admin',
    permission: { role: 'admin' },
    activeMatch: {
      startsWith: true,
      exclude: ['/all-books'],
    },
    customClickHandler: (navigate, currentPath) => {
      if (currentPath.startsWith('/all-books')) {
        navigate(ROUTES.MY_BOOKS);
        return true;
      }
      return false;
    },
  },
  {
    path: ROUTES.GOOGLE_CHAT,
    name: 'Create Book',
    icon: MessageSquare,
    group: 'admin',
    permission: { role: 'admin' },
    activeMatch: { exact: true },
  },
  {
    path: ROUTES.REWARDS,
    name: 'Rewards',
    icon: Gift,
    group: 'admin',
    permission: { role: 'admin' },
    activeMatch: { exact: true },
  },
  {
    path: ROUTES.MANAGE_HABITS,
    name: 'Manage Habits',
    icon: Calendar,
    group: 'admin',
    permission: { role: 'admin' },
    activeMatch: { startsWith: true },
  },
  {
    path: ROUTES.MY_TRICKS,
    name: 'My Tricks',
    icon: Target,
    group: 'admin',
    permission: { role: 'admin' },
    activeMatch: { exact: true },
  },
  {
    path: ROUTES.ALL_BOOKS,
    name: 'All Books',
    icon: Book,
    group: 'admin',
    permission: { role: 'admin' },
    activeMatch: { startsWith: true },
    customClickHandler: (navigate, currentPath) => {
      if (currentPath.startsWith('/books') && !currentPath.startsWith('/all-books')) {
        navigate(ROUTES.ALL_BOOKS);
        return true;
      }
      return false;
    },
  },
  {
    path: ROUTES.ADMIN_CHAT,
    name: 'Marketing Chat',
    icon: MessageSquare,
    group: 'admin',
    permission: { role: 'admin' },
    activeMatch: { exact: true },
  },
  {
    path: ROUTES.BLOG_ADMIN,
    name: 'Blog',
    icon: BookOpen,
    group: 'admin',
    permission: { role: 'admin' },
    activeMatch: { startsWith: true },
  },
  {
    path: ROUTES.AGENTS,
    name: 'Agents',
    icon: Users,
    group: 'admin',
    permission: { role: 'admin' },
    activeMatch: { exact: true },
  },
  {
    path: ROUTES.DAILY_PUB_SCHEDULE,
    name: 'Daily Pub Schedule',
    icon: Calendar,
    group: 'admin',
    permission: { role: 'admin' },
    activeMatch: { startsWith: true },
  },
  {
    path: ROUTES.ADMIN_USER_ACTIVITY,
    name: 'User Activity',
    icon: BarChart,
    group: 'admin',
    permission: { role: 'admin' },
    activeMatch: { startsWith: true },
  },
  {
    path: ROUTES.REDDIT,
    name: 'Reddit',
    icon: Search,
    group: 'admin',
    permission: { role: 'admin' },
    activeMatch: { exact: true },
  },
  {
    path: ROUTES.VIDEOS,
    name: 'Videos',
    icon: Video,
    group: 'admin',
    permission: { role: 'admin' },
    activeMatch: { exact: true },
  },
];

/**
 * Default routes based on user role
 */
export const getDefaultRouteForRole = (isAdmin: boolean, isAuthenticated: boolean): string => {
  if (isAdmin) return ROUTES.AGENTS;
  if (isAuthenticated) return ROUTES.LIBRARY;
  return ROUTES.LANDING;
};
