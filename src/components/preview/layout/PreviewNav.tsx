import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PreviewNav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const productItems = [
    { title: 'Overview', href: '/product', description: 'See all features' },
    { title: 'Reading & Library', href: '/tracking', description: 'Track reading progress' },
    { title: 'Habits', href: '/habits-info', description: 'Build daily routines' },
    { title: 'Rewards', href: '/rewards-info', description: 'Motivate with incentives' },
    { title: 'Snowboard Tricks', href: '/tricks-info', description: 'Track trick progress' },
    { title: 'Print-outs', href: '/print-outs', description: 'Coloring books to print' },
    { title: 'AI Book Studio', href: '/ai-studio', description: 'Create custom books' },
    { title: 'Parent Dashboard', href: '/dashboard-info', description: 'Monitor your family' }
  ];

  const familyItems = [
    { title: 'Multi-Kid Profiles', href: '/family', description: 'Manage your kids' },
    { title: 'For Families', href: '/for-families', description: 'Collaborate on reading' },
    { title: 'For Grandparents', href: '/for-grandparents', description: 'Stay connected' },
    { title: 'For Toddlers', href: '/for-families#toddlers', description: 'Ages 2-4' },
    { title: 'For Early Readers', href: '/for-families#early-readers', description: 'Ages 5-7' }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-foreground">Chairlift Habits</span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {/* Product - TEMPORARILY HIDDEN
              <NavigationMenuItem>
                <NavigationMenuTrigger>Product</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                    {productItems.map((item) => (
                      <li key={item.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.href}
                            className={cn(
                              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                            )}
                          >
                            <div className="text-sm font-medium leading-none">{item.title}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {item.description}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              */}

              {/* Library */}
              <NavigationMenuItem>
                <Link to="/explore">
                  <NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    Library
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {/* For Families - TEMPORARILY HIDDEN
              <NavigationMenuItem>
                <NavigationMenuTrigger>For Families</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4">
                    {familyItems.map((item) => (
                      <li key={item.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.href}
                            className={cn(
                              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                            )}
                          >
                            <div className="text-sm font-medium leading-none">{item.title}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {item.description}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              */}

              {/* Pricing */}
              <NavigationMenuItem>
                <Link to="/pricing-info">
                  <NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {/* Blog */}
              <NavigationMenuItem>
                <Link to="/blog-home">
                  <NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    Blog
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {/* About */}
              <NavigationMenuItem>
                <Link to="/about">
                  <NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    About
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* CTAs */}
          <div className="flex items-center gap-4">
            <Link
              to="/auth"
              className="hidden md:inline-flex items-center justify-center h-9 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center h-9 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
            >
              Start free
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="space-y-4">
              {/* Product - TEMPORARILY HIDDEN
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Product</p>
                <div className="space-y-2">
                  {productItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="block py-2 text-sm hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
              */}
              {/* For Families - TEMPORARILY HIDDEN
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">For Families</p>
                <div className="space-y-2">
                  {familyItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="block py-2 text-sm hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
              */}
              <Link
                to="/explore"
                className="block py-2 text-sm hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Library
              </Link>
              <Link
                to="/pricing-info"
                className="block py-2 text-sm hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/blog-home"
                className="block py-2 text-sm hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                to="/about"
                className="block py-2 text-sm hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
