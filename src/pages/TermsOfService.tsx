import { useEffect } from 'react';
import { useGA4 } from '@/hooks/useGA4';
import { MetaHead } from '@/components/common';
import { SITE_CONFIG, getSiteTitle } from '@/config/site';
import { Container } from '@/components/layout';
import { Header } from '@/components/layout';
import { Footer } from '@/components/landing/Footer';
import { useAuthContext } from '@/contexts/AuthContext';

const TermsOfService = () => {
  const { trackEvent } = useGA4();
  const { isAuthenticated, loading } = useAuthContext();

  useEffect(() => {
    trackEvent('page_view', {
      page_title: 'Terms of Service',
      page_location: window.location.href,
      page_path: '/terms-of-service'
    });
  }, [trackEvent]);

  const lastUpdated = "January 15, 2025";
  const shouldShowFooter = !isAuthenticated && !loading;

  return (
    <>
      <MetaHead
        metadata={{
          title: getSiteTitle('Terms of Service'),
          description: 'Terms of Service for Daily ABC Illustrations - Legal agreement governing use of our educational platform.',
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
              <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
              <p className="text-muted-foreground mb-8">
                Last Updated: {lastUpdated}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
                <p>
                  These Terms of Service ("Terms") constitute a legally binding agreement between you and 
                  Van7, LLC, doing business as Daily ABC Illustrations ("Company," "we," "us," or "our"), 
                  governing your access to and use of the Daily ABC Illustrations platform at 
                  dailyabcillustrations.com (the "Service").
                </p>
                <p>
                  By accessing or using the Service, you agree to be bound by these Terms and our Privacy Policy. 
                  If you do not agree to these Terms, you may not access or use the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                
                <h3 className="text-xl font-semibold mb-3">2.1 Educational Platform</h3>
                <p>
                  Daily ABC Illustrations is an AI-powered educational platform that creates and publishes 
                  personalized ABC books for children. Our Service includes:
                </p>
                <ul>
                  <li><strong>Daily Content:</strong> New educational ABC content automatically published daily at 7:01 AM Eastern Time</li>
                  <li><strong>AI Book Creation:</strong> Interactive tools to create custom ABC books using artificial intelligence</li>
                  <li><strong>Illustration Library:</strong> Access to AI-generated educational illustrations and graphics</li>
                  <li><strong>Kid Profiles:</strong> Ability to create and manage profiles for children, including rewards and progress tracking</li>
                  <li><strong>Publishing Schedule:</strong> View and access upcoming and past educational content</li>
                  <li><strong>Premium Features:</strong> Subscription-based access to advanced features and unlimited content</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.2 AI-Generated Content</h3>
                <p>
                  Our Service uses artificial intelligence (AI) to generate educational content, including text, 
                  illustrations, and interactive activities. While we strive for accuracy and appropriateness, 
                  AI-generated content may contain errors or inaccuracies. We encourage parental supervision when 
                  children use our Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                
                <h3 className="text-xl font-semibold mb-3">3.1 Account Creation</h3>
                <p>To access certain features of the Service, you must create an account. You agree to:</p>
                <ul>
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Be at least 18 years old or have parental consent to use the Service</li>
                  <li>Accept responsibility for all activities that occur under your account</li>
                  <li>Notify us immediately of any unauthorized access or security breach</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Account Termination</h3>
                <p>
                  We reserve the right to suspend or terminate your account at any time for violation of these Terms, 
                  illegal activity, or other reasons at our sole discretion. You may terminate your account at any 
                  time through your account settings or by contacting us.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Subscription and Payment Terms</h2>
                
                <h3 className="text-xl font-semibold mb-3">4.1 Subscription Plans</h3>
                <p>
                  We offer various subscription plans with different features and pricing. Current pricing and 
                  plan details are available on our pricing page. Subscription plans may include:
                </p>
                <ul>
                  <li>Free tier with limited access to daily content</li>
                  <li>Monthly or annual premium subscriptions</li>
                  <li>Family or educational institution plans</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Billing and Payments</h3>
                <ul>
                  <li><strong>Payment Processing:</strong> All payments are processed securely through Stripe</li>
                  <li><strong>Recurring Billing:</strong> Subscriptions automatically renew unless cancelled before the renewal date</li>
                  <li><strong>Price Changes:</strong> We may change subscription prices with 30 days' notice</li>
                  <li><strong>Taxes:</strong> You are responsible for any applicable taxes</li>
                  <li><strong>Failed Payments:</strong> Failed payments may result in service interruption or account suspension</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Refunds and Cancellations</h3>
                <ul>
                  <li>You may cancel your subscription at any time through your account settings or the Stripe Customer Portal</li>
                  <li>Cancellations take effect at the end of the current billing period</li>
                  <li>Refunds are provided at our sole discretion on a case-by-case basis</li>
                  <li>No refunds for partial months or unused portions of the subscription period</li>
                  <li>Free trial cancellations before the trial ends will not incur charges</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property Rights</h2>
                
                <h3 className="text-xl font-semibold mb-3">5.1 Our Intellectual Property</h3>
                <p>
                  The Service and its original content, features, and functionality are owned by Van7, LLC and are 
                  protected by international copyright, trademark, patent, trade secret, and other intellectual 
                  property laws. This includes:
                </p>
                <ul>
                  <li>Daily ABC Illustrations brand name, logo, and trademarks</li>
                  <li>Platform design, user interface, and visual elements</li>
                  <li>Software code, algorithms, and AI models</li>
                  <li>Daily published content and illustrations</li>
                  <li>Style guides, templates, and configuration systems</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">5.2 User-Generated Content</h3>
                <p>
                  When you create custom ABC books or other content using our Service ("User Content"), you retain 
                  ownership of your User Content. However, you grant us a worldwide, non-exclusive, royalty-free 
                  license to:
                </p>
                <ul>
                  <li>Store, display, and process your User Content to provide the Service</li>
                  <li>Create backups and derivatives for technical purposes</li>
                  <li>Use aggregated, anonymized data for service improvement</li>
                </ul>
                <p>
                  You represent and warrant that you own or have the necessary rights to all User Content you submit 
                  and that it does not violate any third-party rights.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">5.3 AI-Generated Content License</h3>
                <p>
                  For custom books you create using our AI tools, you receive a personal, non-commercial license 
                  to use the generated content for educational purposes. Commercial use of AI-generated content 
                  requires explicit written permission from Van7, LLC.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use Policy</h2>
                
                <h3 className="text-xl font-semibold mb-3">6.1 Permitted Uses</h3>
                <p>You may use the Service for:</p>
                <ul>
                  <li>Educational purposes for children</li>
                  <li>Personal, non-commercial use</li>
                  <li>Creating custom ABC books for your family or students</li>
                  <li>Accessing and viewing daily published content</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">6.2 Prohibited Activities</h3>
                <p>You agree NOT to:</p>
                <ul>
                  <li>Violate any laws, regulations, or third-party rights</li>
                  <li>Use the Service for any commercial purpose without authorization</li>
                  <li>Attempt to circumvent payment systems or access premium features without subscribing</li>
                  <li>Scrape, data mine, or extract content using automated tools</li>
                  <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                  <li>Upload malicious code, viruses, or harmful content</li>
                  <li>Harass, abuse, or harm other users or children</li>
                  <li>Impersonate others or provide false information</li>
                  <li>Generate inappropriate, offensive, or harmful content using our AI tools</li>
                  <li>Share your account credentials with others</li>
                  <li>Use the Service to train competing AI models</li>
                  <li>Resell, redistribute, or sublicense access to the Service</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">6.3 Content Moderation</h3>
                <p>
                  We reserve the right to review, monitor, and remove User Content that violates these Terms or is 
                  otherwise objectionable. Our AI content generation includes safety filters to prevent inappropriate 
                  content, but we cannot guarantee all generated content will be appropriate.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Children's Safety</h2>
                <p>
                  Daily ABC Illustrations is designed for use by parents, teachers, and caregivers to provide 
                  educational content to children. We are committed to children's online safety:
                </p>
                <ul>
                  <li>The Service is not directed to children under 13 without parental supervision</li>
                  <li>We do not knowingly collect personal information directly from children under 13</li>
                  <li>All AI-generated content goes through safety filters</li>
                  <li>Parents can create and manage kid profiles with limited data collection</li>
                  <li>We comply with COPPA (Children's Online Privacy Protection Act)</li>
                </ul>
                <p>
                  Parents and guardians are responsible for supervising children's use of the Service and ensuring 
                  content is appropriate for their child's age and development.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Disclaimers and Limitations of Liability</h2>
                
                <h3 className="text-xl font-semibold mb-3">8.1 Service Availability</h3>
                <p>
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS 
                  OR IMPLIED. We do not guarantee:
                </p>
                <ul>
                  <li>Uninterrupted or error-free operation</li>
                  <li>Accuracy or reliability of AI-generated content</li>
                  <li>Availability of specific features or content</li>
                  <li>Compatibility with all devices or browsers</li>
                  <li>Security of data transmission over the Internet</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">8.2 Educational Content Disclaimer</h3>
                <p>
                  While we strive to provide accurate and age-appropriate educational content, we make no guarantees 
                  about the educational efficacy or appropriateness of our content for any particular child. Parents 
                  and educators should review content and supervise children's use.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">8.3 Limitation of Liability</h3>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, VAN7, LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                  SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, DATA LOSS, OR BUSINESS 
                  INTERRUPTION, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
                </p>
                <p>
                  Our total liability to you for any claims arising from the Service shall not exceed the amount 
                  you paid us in the 12 months preceding the claim, or $100, whichever is greater.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Indemnification</h2>
                <p>
                  You agree to indemnify, defend, and hold harmless Van7, LLC, its officers, directors, employees, 
                  and agents from any claims, liabilities, damages, losses, and expenses (including reasonable 
                  attorney fees) arising out of or related to:
                </p>
                <ul>
                  <li>Your use or misuse of the Service</li>
                  <li>Your violation of these Terms</li>
                  <li>Your User Content or any content you submit</li>
                  <li>Your violation of any third-party rights</li>
                  <li>Your violation of any applicable laws or regulations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Third-Party Services</h2>
                <p>
                  Our Service integrates with third-party services including Supabase (database and authentication), 
                  Stripe (payment processing), Google Analytics (analytics), and AI providers (content generation). 
                  Your use of these integrated services is subject to their respective terms of service and privacy 
                  policies. We are not responsible for the actions or policies of third-party services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Modification of Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. We will notify users of material changes by:
                </p>
                <ul>
                  <li>Posting the updated Terms on this page with a new "Last Updated" date</li>
                  <li>Sending email notification to registered users (for material changes)</li>
                  <li>Displaying a prominent notice on the Service</li>
                </ul>
                <p>
                  Your continued use of the Service after changes are posted constitutes acceptance of the modified 
                  Terms. If you do not agree to the modified Terms, you must discontinue use of the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
                
                <h3 className="text-xl font-semibold mb-3">12.1 Termination by You</h3>
                <p>
                  You may terminate your account at any time by:
                </p>
                <ul>
                  <li>Using the account deletion option in your settings</li>
                  <li>Contacting our support team</li>
                  <li>Cancelling your subscription through Stripe Customer Portal</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">12.2 Termination by Us</h3>
                <p>
                  We may suspend or terminate your access to the Service immediately, without prior notice, for:
                </p>
                <ul>
                  <li>Violation of these Terms</li>
                  <li>Illegal activity or suspected fraud</li>
                  <li>Non-payment of subscription fees</li>
                  <li>Abuse of the Service or harm to other users</li>
                  <li>Any reason at our sole discretion</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">12.3 Effect of Termination</h3>
                <p>
                  Upon termination:
                </p>
                <ul>
                  <li>Your access to the Service will immediately cease</li>
                  <li>You will lose access to your User Content (export before terminating)</li>
                  <li>We may delete your account and data in accordance with our Privacy Policy</li>
                  <li>Provisions that should survive termination (e.g., indemnification, limitations of liability) will remain in effect</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">13. Dispute Resolution</h2>
                
                <h3 className="text-xl font-semibold mb-3">13.1 Informal Resolution</h3>
                <p>
                  Before filing a claim, you agree to contact us at support@dailyabcillustrations.com to attempt 
                  to resolve the dispute informally. We will attempt to resolve disputes in good faith within 30 days.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">13.2 Arbitration Agreement</h3>
                <p>
                  If informal resolution fails, you agree that any dispute arising out of or relating to these Terms 
                  or the Service shall be resolved through binding arbitration in accordance with the rules of the 
                  American Arbitration Association (AAA). Arbitration shall take place in the jurisdiction where 
                  Van7, LLC is headquartered.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">13.3 Class Action Waiver</h3>
                <p>
                  You agree to resolve disputes with us only on an individual basis and waive any right to 
                  participate in a class action lawsuit or class-wide arbitration.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">13.4 Exceptions</h3>
                <p>
                  Either party may seek equitable relief in court to protect intellectual property rights or 
                  confidential information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the State of 
                  [State where Van7, LLC is registered], without regard to its conflict of law provisions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">15. General Provisions</h2>
                
                <h3 className="text-xl font-semibold mb-3">15.1 Entire Agreement</h3>
                <p>
                  These Terms, together with our Privacy Policy, constitute the entire agreement between you and 
                  Van7, LLC regarding the Service.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">15.2 Severability</h3>
                <p>
                  If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions 
                  shall remain in full force and effect.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">15.3 Waiver</h3>
                <p>
                  Our failure to enforce any right or provision of these Terms shall not be deemed a waiver of 
                  such right or provision.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">15.4 Assignment</h3>
                <p>
                  You may not assign or transfer these Terms or your account without our prior written consent. 
                  We may assign these Terms without restriction.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">15.5 Force Majeure</h3>
                <p>
                  We shall not be liable for any failure to perform due to circumstances beyond our reasonable 
                  control, including natural disasters, war, terrorism, pandemics, or Internet service interruptions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">16. Contact Information</h2>
                <p>
                  For questions, concerns, or notices regarding these Terms, please contact us:
                </p>
                <div className="bg-muted p-6 rounded-lg mt-4">
                  <p className="font-semibold">Van7, LLC (DBA Daily ABC Illustrations)</p>
                  <p>Email: support@dailyabcillustrations.com</p>
                  <p>Legal inquiries: legal@dailyabcillustrations.com</p>
                  <p>Website: https://dailyabcillustrations.com</p>
                </div>
              </section>

              <section className="mb-8">
                <div className="bg-muted/50 border border-border p-6 rounded-lg">
                  <p className="text-sm">
                    <strong>Acknowledgment:</strong> By using Daily ABC Illustrations, you acknowledge that you have 
                    read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
                  </p>
                </div>
              </section>
            </article>
          </Container>
        </main>
        {shouldShowFooter && <Footer />}
      </div>
    </>
  );
};

export default TermsOfService;
