import { Link } from 'react-router-dom';

export const PreviewFooter = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Product',
      links: [
        { label: 'Product overview', href: '/preview/product' },
        { label: 'Reading & Library', href: '/preview/tracking' },
        { label: 'Habits & Rewards', href: '/preview/habits' },
        { label: 'AI Book Studio', href: '/preview/ai-studio' },
        { label: 'Parent Dashboard', href: '/preview/dashboard' }
      ]
    },
    {
      title: 'Families',
      links: [
        { label: 'For toddlers', href: '/preview/for-families#toddlers' },
        { label: 'For early readers', href: '/preview/for-families#early-readers' },
        { label: 'For busy parents', href: '/preview/for-families' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Blog', href: '/preview/blog' },
        { label: 'Pricing', href: '/preview/pricing' }
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
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-foreground">Chairlift Education</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {currentYear} Chairlift Education. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
