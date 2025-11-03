# Type Standardization Guide

This document provides guidelines for maintaining consistent type definitions across the Daily ABC Illustrations codebase.

## Status Enums ✅ Complete

All status enums are consolidated in `src/types/shared/status.ts`:

- `ProcessStatus` - For tracking multi-step operations
- `PublicationStatus` - For book publication states  
- `GenerationStatus` - For AI content generation tracking
- `AgentStatus` - For AI agent operational states
- `OptimizationStatus` - For optimization process tracking

**Note**: Backend edge functions (`supabase/functions/_shared/types.ts`) maintain a synchronized copy due to Deno runtime isolation.

### Usage

```typescript
import { ProcessStatus, PublicationStatus } from '@/types/shared';

const status: ProcessStatus = ProcessStatus.IN_PROGRESS;
const bookStatus: PublicationStatus = PublicationStatus.PUBLISHED;
```

## Modal Components ✅ Complete

All modal components extend the base `ModalProps` interface from `src/types/shared/base.ts`:

```typescript
import { ModalProps } from '@/types/shared/base';

interface MyModalProps extends ModalProps {
  title: string;
  onSubmit: () => void;
}
```

This eliminates duplicate `open: boolean; onOpenChange: (open: boolean) => void;` definitions.

## AI Provider Types ✅ Complete

`AIProvider` type is defined in:
- Frontend: `src/types/shared/agent.ts`
- Backend: `supabase/functions/_shared/types.ts`

Both include: `'openai' | 'deepseek' | 'google'`

### Usage

```typescript
import { AIProvider } from '@/types/shared';

const provider: AIProvider = 'google';
```

## Book-Related Types ✅ Complete

### Base Types
Core book types are in `src/types/book.ts`:
- `Book` - Core book entity
- `Page` - Individual page entity
- `BookWithPages` - Book with loaded pages
- `BookMetadata` - Structured metadata

### Extended Types
Specialized book types are in `src/types/book-extended.ts`:
- `BookWithSEO` - Book with SEO metadata
- `LandingPageImage` - Page image for landing
- `LandingDailyPublished` - Daily published for landing
- `LandingPopularBook` - Popular book for landing
- `LandingLibraryBook` - Library book with metadata
- `LandingPageData` - Complete landing page bundle
- `BookWithSystemPrompt` - Book with system prompt

### Usage

```typescript
import { Book, BookWithPages } from '@/types/book';
import { BookWithSEO, LandingPageData } from '@/types/book-extended';

// Use composition for specific needs
const book: Book = { /* ... */ };
const bookWithPages: BookWithPages = { ...book, pages: [] };
const bookWithSEO: BookWithSEO = { ...book, seo_title: '...' };
```

## Role-Based Access Components ✅ Complete

### Base Component: RoleGuard

Generic role guard in `src/components/RoleGuard.tsx`:

```typescript
import { RoleGuard } from '@/components/RoleGuard';

<RoleGuard
  requiredRole="admin"
  fallback={<div>Access denied</div>}
  showMessage={true}
  allowHigherRoles={false}
>
  <AdminContent />
</RoleGuard>
```

### Role Hierarchy

```
admin (level 3)
  └── moderator (level 2)
      └── teacher (level 1)
```

When `allowHigherRoles={true}`, higher roles can access lower-level content.

### Convenience Wrappers

Thin wrappers for common use cases:

```typescript
import { AdminOnly } from '@/components/AdminOnly';
import { ModeratorOnly } from '@/components/ModeratorOnly';
import { TeacherOnly } from '@/components/TeacherOnly';

// Admin-only (strict)
<AdminOnly showMessage={true}>
  <AdminPanel />
</AdminOnly>

// Moderator and above
<ModeratorOnly>
  <ModerationTools />
</ModeratorOnly>

// Teacher and above
<TeacherOnly>
  <TeacherResources />
</TeacherOnly>
```

## Base Component Props

Available base interfaces in `src/types/shared/base.ts`:

### BaseComponentProps
```typescript
interface BaseComponentProps {
  children?: ReactNode;
  className?: string;
}
```

### InteractiveProps
```typescript
interface InteractiveProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}
```

### FormProps
```typescript
interface FormProps {
  onSubmit: () => void | Promise<void>;
  onCancel?: () => void;
  hasUnsavedChanges?: boolean;
  isLoading?: boolean;
}
```

### ModalProps
```typescript
interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### Usage Patterns

```typescript
import { BaseComponentProps, InteractiveProps, FormProps } from '@/types/shared/base';

// Card components
interface BookCardProps extends BaseComponentProps, InteractiveProps {
  book: Book;
}

// Form components
interface BookFormProps extends FormProps {
  initialData?: Book;
}

// Layout components
interface PageLayoutProps extends BaseComponentProps {
  title?: string;
  fullHeight?: boolean;
}
```

## Agent Configuration Types

### Frontend Types
`src/types/shared/agent.ts`:
- Uses **camelCase** (e.g., `maxCompletionTokens`)
- Includes full metadata (version tracking, deployment info)
- `AgentConfigFrontend` - Complete agent with UI metadata
- `AgentConfigBackend` - Simplified for edge functions

### Backend Types
`supabase/functions/_shared/types.ts`:
- Uses **snake_case** (e.g., `max_completion_tokens`)
- Simplified for edge function performance
- `AgentConfig` - Backend agent configuration

### Field Mapping

| Frontend (camelCase) | Backend (snake_case) |
|---------------------|---------------------|
| `maxCompletionTokens` | `max_completion_tokens` |
| `topP` | `top_p` |
| `modelSettings` | Flattened to `model`, `max_completion_tokens`, `top_p` |

### Transformation Pattern

```typescript
// Frontend → Backend
const backendConfig = {
  id: frontendConfig.id,
  name: frontendConfig.name,
  type: frontendConfig.type,
  intent: frontendConfig.intent,
  status: frontendConfig.status,
  instructions: frontendConfig.instructions,
  provider: frontendConfig.provider,
  model: frontendConfig.modelSettings.model,
  max_completion_tokens: frontendConfig.modelSettings.maxCompletionTokens,
  top_p: frontendConfig.modelSettings.topP,
};

// Backend → Frontend
const frontendConfig = {
  ...backendConfig,
  modelSettings: {
    model: backendConfig.model,
    maxCompletionTokens: backendConfig.max_completion_tokens,
    topP: backendConfig.top_p,
  },
};
```

## Best Practices

### 1. Use Shared Types
Always import from shared type files rather than defining duplicates:

```typescript
// ✅ Good
import { ProcessStatus } from '@/types/shared';

// ❌ Bad
type ProcessStatus = 'not_started' | 'in_progress' | 'complete';
```

### 2. Extend Base Interfaces
Leverage composition with base interfaces:

```typescript
// ✅ Good
interface MyModalProps extends ModalProps {
  title: string;
}

// ❌ Bad
interface MyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
}
```

### 3. Use Type Composition
Build specialized types from base types:

```typescript
// ✅ Good
import { Book } from '@/types/book';
import { BookWithSEO } from '@/types/book-extended';

// ❌ Bad
interface BookWithSEO {
  id: string;
  user_id: string;
  book_name: string;
  // ... duplicating all Book fields
  seo_title?: string;
}
```

### 4. Document Type Mappings
When types differ between frontend/backend, document the mapping clearly:

```typescript
/**
 * Frontend uses camelCase, backend uses snake_case
 * @see supabase/functions/_shared/types.ts for backend equivalent
 */
export interface AgentConfigFrontend {
  maxCompletionTokens: number; // → max_completion_tokens
  topP: number;                 // → top_p
}
```

## Migration Checklist

When adding new types:

- [ ] Check if a shared type already exists
- [ ] Use composition with base interfaces when possible
- [ ] Add to appropriate shared type file (`src/types/shared/` or `src/types/`)
- [ ] Export from index files for easy imports
- [ ] Document any frontend/backend mapping differences
- [ ] Update this guide with new patterns

## File Organization

```
src/types/
├── shared/              # Cross-cutting types used everywhere
│   ├── index.ts        # Barrel export
│   ├── status.ts       # Status enums
│   ├── agent.ts        # Agent types
│   └── base.ts         # Base component props
├── book.ts             # Core book types
├── book-extended.ts    # Extended book types
├── dailyPublished.ts   # Daily published types
├── habit.ts            # Habit system types
└── ...                 # Other domain types
```
