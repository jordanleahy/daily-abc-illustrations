# Why Edge Functions Can't Import from `/src`

## Runtime Environment Difference

Edge functions run in **Deno** on Supabase's servers, while your React app runs in the **browser** (or Node.js during build). These are completely different runtime environments that cannot share code directly.

## Key Differences

| Frontend (`/src`) | Edge Functions |
|-------------------|----------------|
| Runs in browser/Node.js | Runs in Deno on Supabase servers |
| Uses TypeScript/JSX | Uses TypeScript (Deno-compatible) |
| Has access to React, DOM APIs | No DOM, different APIs |
| Imports from `node_modules` | Uses Deno imports (URLs) |

## The Problem

```typescript
// ❌ This WILL NOT work in edge functions
import { supabase } from "@/integrations/supabase/client";
import { SomeType } from "@/types/myTypes";
```

**Why it fails:**
- `@/` alias doesn't exist in Deno
- `/src` directory isn't available on Supabase servers
- Different module resolution systems

## Solutions

### 1. Shared Code in `_shared/`
Place reusable code in this directory:

```typescript
// ✅ supabase/functions/_shared/types.ts
export interface SharedType {
  id: string;
  name: string;
}
```

```typescript
// ✅ In edge function
import { SharedType } from "../_shared/types.ts";
```

### 2. Duplicate Types (When Needed)
Sometimes it's cleaner to duplicate simple types:

```typescript
// ✅ In edge function
interface LocalType {
  id: string;
  name: string;
}
```

### 3. Use Supabase Client Directly
Create a fresh Supabase client in edge functions:

```typescript
// ✅ In edge function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
```

## Best Practices

1. **Keep edge functions self-contained** - Include all necessary logic
2. **Use `_shared/` for common utilities** - Database helpers, validation functions
3. **Duplicate simple types** - Don't over-engineer sharing for basic interfaces
4. **Document dependencies** - Make it clear what each function needs

## Example Structure

```
supabase/functions/
├── _shared/
│   ├── README.md (this file)
│   ├── types.ts (shared type definitions)
│   ├── utils.ts (utility functions)
│   └── safeSpaceConfig.ts (configuration)
├── my-function/
│   └── index.ts (self-contained function)
└── another-function/
    └── index.ts (self-contained function)
```

Remember: Edge functions are **backend services**, not frontend code. They need to be independent and deployable to Supabase's Deno runtime.