import { Link } from 'react-router-dom';

export const PreviewFooter = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Product',
      links: [
        { label: 'Product overview', href: '/product' },
        { label: 'Reading & Library', href: '/tracking' },
        { label: 'Habits & Rewards', href: '/habits-info' },
        { label: 'AI Book Studio', href: '/ai-studio' },
        { label: 'Parent Dashboard', href: '/dashboard-info' }
      ]
    },
    {
      title: 'Families',
      links: [
        { label: 'For toddlers', href: '/for-families#toddlers' },
        { label: 'For early readers', href: '/for-families#early-readers' },
        { label: 'For busy parents', href: '/for-families' },
        { label: 'For grandparents', href: '/for-grandparents' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Blog', href: '/blog-home' },
        { label: 'Pricing', href: '/pricing-info' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms', href: '/terms-of-service' },
        { label: 'Privacy', href: '/privacy-policy' }
      ]
    }
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <span className="text-sm text-muted-foreground/60 cursor-not-allowed">
                      {link.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-foreground">Chairlift Habits</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {currentYear} Chairlift Habits. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
