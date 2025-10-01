import { useEffect } from 'react';
import { useGA4 } from '@/hooks/useGA4';
import { MetaHead } from '@/components/common';
import { SITE_CONFIG, getSiteTitle } from '@/config/site';
import { Container } from '@/components/layout';
import { Header } from '@/components/layout';

const PrivacyPolicy = () => {
  const { trackEvent } = useGA4();

  useEffect(() => {
    trackEvent('page_view', {
      page_title: 'Privacy Policy',
      page_location: window.location.href,
      page_path: '/privacy-policy'
    });
  }, [trackEvent]);

  const lastUpdated = "January 15, 2025";

  return (
    <>
      <MetaHead
        metadata={{
          title: getSiteTitle('Privacy Policy'),
          description: 'Privacy Policy for Daily ABC Illustrations - Learn how we collect, use, and protect your data.',
          siteName: SITE_CONFIG.name,
          type: 'website',
          url: window.location.href,
          locale: SITE_CONFIG.locale,
          author: SITE_CONFIG.author
        }}
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="py-12">
          <Container size="lg">
            <article className="prose prose-slate dark:prose-invert max-w-none">
              <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-muted-foreground mb-8">
                Last Updated: {lastUpdated}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p>
                  Welcome to Daily ABC Illustrations, operated by Van7, LLC ("we," "us," or "our"). 
                  We are committed to protecting your privacy and the privacy of your children. This Privacy Policy 
                  explains how we collect, use, disclose, and safeguard your information when you use our educational 
                  platform at dailyabcillustrations.com (the "Service").
                </p>
                <p>
                  By using our Service, you agree to the collection and use of information in accordance with this policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold mb-3">2.1 Personal Information</h3>
                <p>We collect the following types of personal information:</p>
                <ul>
                  <li><strong>Account Information:</strong> Email address, password (encrypted), first name, last name</li>
                  <li><strong>Kid Profile Information:</strong> Child's first name, earned coins (rewards data)</li>
                  <li><strong>Payment Information:</strong> Processed securely through Stripe (we do not store credit card details)</li>
                  <li><strong>Authentication Data:</strong> Login credentials, OAuth tokens (Google Sign-In)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Usage Data</h3>
                <p>We automatically collect certain information when you use our Service:</p>
                <ul>
                  <li><strong>Analytics Data:</strong> Page views, session duration, user interactions (via Google Analytics 4)</li>
                  <li><strong>Device Information:</strong> Browser type, device type, operating system, IP address</li>
                  <li><strong>Reading Sessions:</strong> Books viewed, pages accessed, time spent on content</li>
                  <li><strong>Content Interactions:</strong> Custom book creation, AI chat interactions, image generation requests</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.3 User-Generated Content</h3>
                <ul>
                  <li>Custom ABC books you create using our AI tools</li>
                  <li>Uploaded images and files stored in Supabase Storage</li>
                  <li>Style guides and illustration configurations</li>
                  <li>Book descriptions and metadata</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                <p>We use the collected information for the following purposes:</p>
                <ul>
                  <li><strong>Service Delivery:</strong> Provide daily educational content at 7:01 AM ET, generate AI-powered illustrations and books</li>
                  <li><strong>Account Management:</strong> Create and maintain your user account, manage kid profiles</li>
                  <li><strong>Payment Processing:</strong> Process subscriptions and payments through Stripe</li>
                  <li><strong>Personalization:</strong> Customize content based on user preferences and reading history</li>
                  <li><strong>Analytics:</strong> Understand usage patterns, improve our Service, and optimize user experience</li>
                  <li><strong>Communication:</strong> Send important updates about the Service, subscription changes, and new features</li>
                  <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security incidents</li>
                  <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our Terms of Service</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
                <p>We use the following third-party services that may collect and process your data:</p>
                
                <h3 className="text-xl font-semibold mb-3">4.1 Supabase</h3>
                <p>
                  We use Supabase for database management, authentication, real-time subscriptions, and file storage. 
                  Supabase processes data in accordance with their privacy policy and complies with GDPR and CCPA regulations.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Stripe</h3>
                <p>
                  Payment processing is handled by Stripe, Inc. We do not store your credit card information. 
                  Stripe's processing is governed by their privacy policy and they are PCI-DSS compliant.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Google Analytics</h3>
                <p>
                  We use Google Analytics 4 (GA4) to analyze usage patterns. GA4 may use cookies and similar 
                  technologies to collect and analyze information about Service usage. You can opt-out of Google 
                  Analytics by installing the Google Analytics Opt-out Browser Add-on.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.4 AI Services</h3>
                <p>
                  We use AI models (including GPT-based language models) to generate educational content and illustrations. 
                  Prompts and generated content are processed in accordance with our AI provider's data handling practices.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.5 Netlify</h3>
                <p>
                  Our Service is hosted on Netlify, which provides CDN and hosting infrastructure. Netlify may 
                  collect standard server logs and performance metrics.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Children's Privacy (COPPA Compliance)</h2>
                <p>
                  Daily ABC Illustrations is designed for use by parents, teachers, and caregivers to provide 
                  educational content to children. We take children's privacy seriously and comply with the 
                  Children's Online Privacy Protection Act (COPPA).
                </p>
                <ul>
                  <li>We do not knowingly collect personal information directly from children under 13</li>
                  <li>Kid profiles are created and managed by parent/guardian accounts</li>
                  <li>We collect minimal information for kid profiles (first name, reward coins only)</li>
                  <li>Kid profile data is not shared with third parties for marketing purposes</li>
                  <li>Parents can view, edit, or delete their children's profiles at any time</li>
                </ul>
                <p>
                  If you believe we have inadvertently collected information from a child under 13 without 
                  parental consent, please contact us immediately at privacy@dailyabcillustrations.com.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
                <p>
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul>
                  <li><strong>Encryption:</strong> All data is encrypted in transit (HTTPS/SSL) and at rest</li>
                  <li><strong>Access Controls:</strong> Row-level security (RLS) policies in our database</li>
                  <li><strong>Authentication:</strong> Secure password hashing and JWT token-based sessions</li>
                  <li><strong>Regular Audits:</strong> Ongoing security reviews and updates</li>
                  <li><strong>Backup Systems:</strong> Regular data backups and disaster recovery procedures</li>
                </ul>
                <p>
                  However, no method of transmission over the Internet is 100% secure. While we strive to use 
                  commercially acceptable means to protect your data, we cannot guarantee its absolute security.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Your Data Rights</h2>
                <p>
                  Depending on your location, you may have the following rights regarding your personal information:
                </p>
                
                <h3 className="text-xl font-semibold mb-3">7.1 Access and Portability</h3>
                <p>You have the right to access and receive a copy of your personal data in a portable format.</p>

                <h3 className="text-xl font-semibold mb-3 mt-6">7.2 Correction</h3>
                <p>You can update or correct your account information at any time through your profile settings.</p>

                <h3 className="text-xl font-semibold mb-3 mt-6">7.3 Deletion</h3>
                <p>
                  You can request deletion of your account and associated data. Some information may be retained 
                  for legal compliance, fraud prevention, or legitimate business purposes.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">7.4 Opt-Out</h3>
                <p>You can opt-out of marketing communications and analytics tracking.</p>

                <h3 className="text-xl font-semibold mb-3 mt-6">7.5 Data Portability</h3>
                <p>You can export your custom books, kid profiles, and other user-generated content.</p>

                <p className="mt-6">
                  To exercise these rights, please contact us at privacy@dailyabcillustrations.com. 
                  We will respond to your request within 30 days.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking Technologies</h2>
                <p>We use cookies and similar tracking technologies to enhance your experience:</p>
                <ul>
                  <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
                  <li><strong>Analytics Cookies:</strong> Google Analytics for usage tracking (GA4)</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                </ul>
                <p>
                  You can control cookies through your browser settings. Disabling certain cookies may affect 
                  Service functionality.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Data Retention</h2>
                <p>We retain your data for the following periods:</p>
                <ul>
                  <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
                  <li><strong>Inactive Accounts:</strong> Data may be deleted after 24 months of inactivity</li>
                  <li><strong>Legal Requirements:</strong> Some data retained for legal compliance (e.g., payment records)</li>
                  <li><strong>User-Generated Content:</strong> Retained until you delete it or close your account</li>
                  <li><strong>Analytics Data:</strong> Aggregated analytics data retained indefinitely</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
                <p>
                  Your information may be transferred to and processed in countries other than your country of 
                  residence. We ensure appropriate safeguards are in place for international data transfers in 
                  compliance with applicable data protection laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by:
                </p>
                <ul>
                  <li>Posting the new Privacy Policy on this page</li>
                  <li>Updating the "Last Updated" date</li>
                  <li>Sending an email notification for material changes (if you have an account)</li>
                </ul>
                <p>
                  Your continued use of the Service after changes are posted constitutes acceptance of the updated policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
                <p>
                  If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-muted p-6 rounded-lg mt-4">
                  <p className="font-semibold">Van7, LLC (DBA Daily ABC Illustrations)</p>
                  <p>Email: privacy@dailyabcillustrations.com</p>
                  <p>Website: https://dailyabcillustrations.com</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">13. Specific State Privacy Rights</h2>
                
                <h3 className="text-xl font-semibold mb-3">California Residents (CCPA)</h3>
                <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
                <ul>
                  <li>Right to know what personal information is collected, used, shared, or sold</li>
                  <li>Right to delete personal information</li>
                  <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
                  <li>Right to non-discrimination for exercising CCPA rights</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">European Residents (GDPR)</h3>
                <p>If you are located in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR):</p>
                <ul>
                  <li>Right of access, rectification, erasure, and restriction of processing</li>
                  <li>Right to data portability</li>
                  <li>Right to object to processing</li>
                  <li>Right to withdraw consent</li>
                  <li>Right to lodge a complaint with a supervisory authority</li>
                </ul>
              </section>
            </article>
          </Container>
        </main>
      </div>
    </>
  );
};

export default PrivacyPolicy;
