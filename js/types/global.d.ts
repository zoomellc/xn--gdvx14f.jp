// Global type definitions for 敬語.jp

// Extend Window interface for custom properties
interface Window {
  // Theme management
  __theme: 'light' | 'dark';
  __setTheme: (theme: 'light' | 'dark') => void;
  
  // Bundle loader
  bundleLoader?: {
    loadBundle: (bundleName: string) => Promise<void>;
    loaded: Set<string>;
  };
  
  // Feature flags and settings
  dataLayer?: any[];
  gtag?: (...args: any[]) => void;
  
  // Service Worker
  swRegistration?: ServiceWorkerRegistration;
}

// Article data structure
interface ArticleData {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  date?: string;
  tags?: string[];
}

// Favorite item structure
interface FavoriteItem {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  savedAt: string;
}

// User profile data
interface UserProfile {
  nickname: string;
  level: string;
  studyGoal: string;
  preferredTopics: string[];
  stats: {
    daysActive: number;
    articlesRead: number;
    quizzesTaken: number;
    commentsPosted: number;
  };
}

// Comment data structure
interface Comment {
  id: string;
  articleId: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  replies?: Comment[];
}

// Quiz question structure
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Honorific dictionary entry
interface HonorificEntry {
  term: string;
  reading: string;
  meaning: string;
  examples: string[];
  category: string;
  level: 'basic' | 'intermediate' | 'advanced';
}

// Event detail types
interface BundleLoadedEvent extends CustomEvent {
  detail: {
    bundleName: string;
  };
}

interface ThemeChangedEvent extends CustomEvent {
  detail: {
    theme: 'light' | 'dark';
  };
}

// Module loader types
type ModuleLoader = {
  name: string;
  triggers: string[];
  condition?: () => boolean;
  load: () => Promise<void>;
};

// Storage helper types
type StorageKey = 
  | 'keigo-jp-favorites'
  | 'keigo-jp-theme'
  | 'keigo-jp-font-size'
  | 'keigo-jp-user-profile'
  | 'keigo-jp-quiz-progress'
  | 'keigo-jp-learning-plan'
  | 'honorific-favorites'
  | 'keigo-jp-comments';

// Utility types
type Nullable<T> = T | null;
type Optional<T> = T | undefined;

// DOM query helper types
type QuerySelector = <T extends Element = Element>(
  selector: string
) => Nullable<T>;

type QuerySelectorAll = <T extends Element = Element>(
  selector: string
) => NodeListOf<T>;

// Export empty object to make this a module
export {};