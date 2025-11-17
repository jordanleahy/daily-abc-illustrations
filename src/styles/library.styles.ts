export const LIBRARY_STYLES = {
  bookCard: {
    container: 'group relative bg-card hover:bg-accent/50 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 md:hover:scale-[1.02] md:hover:shadow-lg active:scale-[0.98] select-none',
    badge: 'absolute top-2 right-2 bg-primary text-primary-foreground z-10 text-xs',
    imageContainer: 'aspect-square relative overflow-hidden bg-muted',
    image: 'w-full h-full object-cover',
    placeholder: {
      container: 'w-full h-full flex items-center justify-center',
      text: 'text-6xl font-bold text-primary/20',
    },
    content: 'p-3',
    title: 'font-semibold text-sm line-clamp-2 mb-1',
    targetAge: 'text-xs text-muted-foreground',
  },
  
  carousel: {
    section: 'py-8 -mx-4 md:-mx-6',
    header: 'px-4 md:px-6 mb-4 flex items-center justify-center md:justify-start',
    title: 'text-2xl font-bold flex items-center gap-2',
    icon: 'w-6 h-6',
    viewAllButton: 'flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors',
    chevron: 'w-4 h-4',
    wrapper: 'w-full touch-pan-x pl-4 md:pl-6',
    content: '-ml-4 md:-ml-6',
    item: 'pl-4 md:pl-6 basis-[50vw] sm:basis-[45vw] md:basis-[35vw] lg:basis-[22vw]',
  },
  
  emptyState: {
    card: 'p-8 text-center',
    icon: 'w-12 h-12 mx-auto mb-4 text-muted-foreground',
    text: 'text-muted-foreground',
  },
  
  page: {
    container: 'pb-8',
    content: 'space-y-6',
    header: {
      container: 'text-center mb-8',
      title: 'text-2xl font-bold tracking-tight',
      subtitle: 'text-muted-foreground mt-2',
    },
  },
} as const;
