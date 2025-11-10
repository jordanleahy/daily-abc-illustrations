# Contributing to Daily ABC Illustrations

Thank you for contributing! Please read this guide before making changes.

---

## 🚨 Critical Systems - Handle with Care

### Image Optimization System (DO NOT MODIFY WITHOUT REVIEW)

Our app uses a sophisticated image optimization system that provides:
- **75-85% bandwidth savings**
- **Instant image loads** (cache hit rate >80%)
- **Professional UX** (shimmer effects, no layout shift)

**📖 READ FIRST**: `docs/IMAGE_OPTIMIZATION_ARCHITECTURE.md`

#### Rules for Image-Related Changes

✅ **DO:**
- Use `BookImage` component for all user-facing images
- Create specialized preloader hooks following existing patterns
- Test changes with Performance Dashboard (Ctrl+Shift+P)
- Verify cache hit rates remain >80% after changes

❌ **DO NOT:**
- Replace `BookImage` with plain `<img>` tags
- Create duplicate image/preloading components
- Bypass `optimizeImageUrl()` function
- Remove or disable service worker caching
- Modify core optimization files without performance testing

#### Before Submitting Image-Related PRs

1. ✅ Read `docs/IMAGE_OPTIMIZATION_ARCHITECTURE.md`
2. ✅ Run development server and check browser console for warnings
3. ✅ Open Performance Dashboard (Ctrl+Shift+P) and verify:
   - Cache hit rate >80%
   - Image load times <1s
   - LCP <2.5s
4. ✅ Search for plain `<img>` tags in your changes:
   ```bash
   grep -r "<img" src/
   ```
5. ✅ Ensure all new images use `BookImage` component

---

## 🎨 Design System

- Use semantic tokens from `src/index.css` and `tailwind.config.ts`
- Do NOT use direct colors like `text-white`, `bg-black`
- Customize shadcn components with variants, not inline overrides
- Maintain responsive design across all breakpoints

---

## 🔒 Security

- Validate all user inputs client-side AND server-side
- Use Zod schemas for type-safe validation
- Never trust user input in database queries
- Properly encode data for external APIs

---

## 🧪 Testing Changes

### Development Checklist
1. Run `npm run dev` and test in browser
2. Check browser console for errors/warnings
3. Test on mobile viewport
4. Verify no TypeScript errors
5. Test authentication flows if relevant

### Performance Checklist (for image changes)
1. Open Performance Dashboard (Ctrl+Shift+P)
2. Navigate through app and verify metrics
3. Check Network tab for optimized image URLs
4. Verify service worker caching in DevTools

---

## 📝 Code Style

- Use TypeScript strict mode
- Prefer functional components with hooks
- Keep components small and focused (<200 lines)
- Use meaningful variable/function names
- Add JSDoc comments for complex logic

---

## 🔄 Git Workflow

1. Create feature branch from `main`
2. Make focused, atomic commits
3. Write clear commit messages
4. Test thoroughly before pushing
5. Create PR with description of changes

---

## 🆘 Getting Help

- Check existing documentation in `/docs`
- Review similar code patterns in codebase
- Ask questions in PR comments
- Refer to architecture documentation for critical systems

---

## 📚 Key Documentation

- `docs/IMAGE_OPTIMIZATION_ARCHITECTURE.md` - Image system (CRITICAL)
- `docs/TYPE-STANDARDIZATION.md` - TypeScript patterns
- `README.md` - Project overview and setup

---

**Remember**: This is an educational app for children. Quality, performance, and safety are paramount. When in doubt, ask for review before making significant changes.
