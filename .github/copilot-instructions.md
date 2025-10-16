# Copilot Instructions for Daily ABC Illustrations

## Project Overview

This is a React/TypeScript application for creating and managing children's ABC book illustrations. The platform enables users to generate daily illustrated ABC books using AI agents, manage book collections, and publish educational content for children aged 3-5.

### Key Technologies
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui with Tailwind CSS
- **Backend**: Supabase (PostgreSQL database and Edge Functions)
- **AI Integration**: OpenAI Agents API for illustration generation
- **Deployment**: Netlify with Edge Functions
- **Mobile**: Capacitor for iOS/Android

## Architecture Patterns

### Component Structure
- Use functional components with TypeScript interfaces for props
- Leverage React hooks (`useState`, `useEffect`, `useContext`)
- Follow shadcn/ui patterns for UI components in `src/components/ui/`
- Keep business logic in custom hooks in `src/hooks/`
- Store reusable utilities in `src/utils/`

### State Management
- Use React Context for global state (Auth, Role contexts in `src/contexts/`)
- Use TanStack Query (React Query) for server state management
- Local state with `useState` for component-specific data

### Type Safety
- Define all types in `src/types/` directory
- Use strict TypeScript configuration
- Avoid `any` type - use proper type definitions or `unknown` with type guards
- Export shared types from `src/types/shared/`

### API Integration
- Supabase client configured in `src/integrations/supabase/`
- Edge functions in `netlify/edge-functions/` for serverless operations
- Supabase functions in `supabase/functions/` for backend logic

## Coding Standards

### React & TypeScript
- Use arrow functions for components
- Destructure props in function parameters
- Use TypeScript interfaces over types for object shapes
- Implement proper error boundaries for resilient UIs
- Follow React hooks rules (order, conditional usage)

### Styling
- Use Tailwind CSS utility classes
- Follow existing color scheme and design system
- Maintain responsive design patterns
- Use CSS variables defined in `index.css` for theming

### File Organization
- Components: `src/components/[feature]/ComponentName.tsx`
- Pages: `src/pages/PageName.tsx`
- Hooks: `src/hooks/use[HookName].ts`
- Types: `src/types/[feature].ts`
- Utils: `src/utils/[utility].ts`

## Development Guidelines

### Before Making Changes
1. Run `npm install` to ensure dependencies are up to date
2. Run `npm run lint` to check for linting errors
3. Run `npm run build` to verify the build works

### Code Quality
- Fix ESLint warnings and errors before committing
- Avoid using `@typescript-eslint/no-explicit-any` - define proper types
- Handle React hooks dependencies correctly (exhaustive-deps)
- Avoid unnecessary escape characters in regex
- Use optional chaining safely without non-null assertions

### Testing Strategy
- Test components in isolation where possible
- Verify builds complete successfully
- Check for console errors in development
- Test responsive layouts on different screen sizes

### Performance Considerations
- Lazy load large components with `React.lazy()` and `Suspense`
- Optimize images and assets
- Use React Query's caching strategically
- Consider code splitting for large bundles

## AI Agent Integration

The project uses OpenAI Agents API for generating illustrations:
- Agent configurations stored in database
- Instructions templates in `docs/` directory
- Image generation workflows in `src/services/`
- Style guides define visual consistency across illustrations

### Working with Agents
- Follow the patterns in `README-OpenAI-Agents.md`
- Use structured JSON for style guide definitions
- Maintain age-appropriate content for 3-5 year olds
- Ensure visual consistency across book illustrations

## Supabase Integration

### Database Operations
- Use typed Supabase client from `src/integrations/supabase/client.ts`
- Follow Row Level Security (RLS) policies
- Handle authentication state properly
- Use real-time subscriptions for live updates where appropriate

### Edge Functions
- Keep edge functions lightweight and focused
- Handle CORS properly for API endpoints
- Use environment variables for secrets
- Test edge functions locally before deployment

## Common Pitfalls to Avoid

1. **Type Safety**: Don't use `any` - define proper interfaces
2. **React Hooks**: Follow rules of hooks strictly
3. **Async Operations**: Always handle errors and loading states
4. **Performance**: Avoid unnecessary re-renders with memoization
5. **Security**: Never commit API keys or secrets
6. **Accessibility**: Maintain ARIA labels and semantic HTML

## Project-Specific Notes

### Children's Content Guidelines
- All content must be age-appropriate for 3-5 year olds
- Visual elements should be educational and engaging
- Color palettes should be child-friendly with high contrast
- Avoid complex or scary imagery

### Book Generation Workflow
1. User selects book category and theme
2. AI agent generates style guide (JSON format)
3. Illustrations created based on style guide
4. Book assembled with consistent visual elements
5. Published to library or scheduled for daily release

### Image Optimization
- Follow guidelines in `docs/IMAGE_LOADING_OPTIMIZATIONS.md`
- Use appropriate image formats and sizes
- Implement lazy loading for better performance
- Cache generated images effectively

## Getting Help

- Check existing documentation in `docs/` directory
- Review similar implementations in the codebase
- Follow patterns established in existing components
- Refer to shadcn/ui documentation for UI components
- Consult Supabase docs for database operations
