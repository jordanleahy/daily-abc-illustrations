import { MetaHead } from '@/components/common';
import { SITE_CONFIG, getSiteTitle } from '@/config/site';
import { Container } from '@/components/layout';
import { Header } from '@/components/layout';
import { Footer } from '@/components/landing/Footer';
import { useAuthContext } from '@/contexts/AuthContext';

const PrivacyPolicy = () => {
  const { isAuthenticated, loading } = useAuthContext();

  const lastUpdated = "October 1, 2025";
  const shouldShowFooter = !isAuthenticated && !loading;

  return (
    <>
      <MetaHead
        metadata={{
          title: getSiteTitle('Privacy Policy'),
          description: 'Privacy Policy for ChairLift - Learn how we collect, use, and protect your data.',
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
                  Welcome to Chairlift Habits, operated by <strong>Van7, LLC</strong> ("Chairlift Habits," "we," "us," or "our").
                  We are committed to protecting your privacy and the privacy of your children. This Privacy Policy explains how we collect, use, 
                  disclose, and safeguard <strong>Personal Data</strong> when you use our educational platform at chairlifthabits.com and 
                  related applications (the "Service").
                </p>
                <p>
                  By using the Service, you agree to the collection and use of Personal Data in accordance with this Policy and our Terms of Service.
                </p>
                
                <h3 className="text-xl font-semibold mb-3 mt-6">Controller / Processor Roles</h3>
                <p>
                  For users in the <strong>EEA/UK</strong>, Van7, LLC is the <strong>data controller</strong> for Personal Data processed via the Service. 
                  We engage third-party <strong>data processors</strong> (e.g., hosting, database, analytics, AI vendors) under data processing agreements.
                </p>
                
                <h3 className="text-xl font-semibold mb-3 mt-6">Definitions</h3>
                <p>
                  "Personal Data" means information that identifies or can reasonably be linked to an individual. "Controller" determines purposes and means 
                  of processing; "Processor" processes Personal Data on behalf of a controller.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Personal Data We Collect</h2>
                
                <h3 className="text-xl font-semibold mb-3">2.1 Account & Identity Data</h3>
                <ul>
                  <li><strong>Account Information:</strong> Email address, encrypted password, first and last name</li>
                  <li><strong>Kid Profile Information:</strong> Child's first name and reward coins (progress/rewards)</li>
                  <li><strong>Payment Information:</strong> Processed by Stripe; we do not store full card numbers. We may receive limited billing metadata (e.g., last 4 digits, card brand, expiry month/year), subscription plan, status, and transaction records for tax/compliance</li>
                  <li><strong>Authentication Data:</strong> OAuth tokens (e.g., Google Sign-In), session/JWT identifiers</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Usage & Event Data</h3>
                <ul>
                  <li><strong>Analytics & Telemetry:</strong> Page views, session duration, events, user interactions (Google Analytics 4)</li>
                  <li><strong>Device/Log Data:</strong> Browser, device type/OS, IP address, timestamps, server logs</li>
                  <li><strong>Reading Sessions:</strong> Books viewed, pages accessed, time spent</li>
                  <li><strong>Content Interactions:</strong> Custom book creation, AI chat requests, illustration generation events</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.3 User-Generated Content (UGC)</h3>
                <ul>
                  <li><strong>Custom Books & Prompts:</strong> ABC books, prompts, styles, illustration configurations</li>
                  <li><strong>Uploads:</strong> Images/files stored in Supabase Storage</li>
                  <li><strong>Metadata:</strong> Titles, descriptions, tags</li>
                </ul>
                <p>
                  We may scan UGC for malware/abuse and remove content that violates our Terms.
                </p>
                <div className="bg-muted p-4 rounded-lg mt-4">
                  <p className="text-sm">
                    <strong>Note on Children's Data:</strong> A child's first name may be Personal Data, especially when linked to account identifiers. 
                    We limit child data to what is necessary for personalization and progress tracking and do not use it for marketing.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Personal Data</h2>
                
                <h3 className="text-xl font-semibold mb-3">Service Delivery & Operations</h3>
                <p>
                  Provide daily educational content (including scheduled content), generate AI-powered illustrations/books, maintain accounts and kid profiles, 
                  process payments/subscriptions, provide support, and ensure functionality (including RLS and access controls).
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">Personalization & Improvements</h3>
                <p>
                  Personalize content and recommendations; understand usage patterns; measure performance; improve UX and features; prevent fraud and abuse; 
                  ensure security and integrity.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">Communications</h3>
                <p>
                  Service, transactional, and policy updates; feature announcements. You may opt out of marketing emails via unsubscribe links and account settings 
                  (transactional emails will still be sent).
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">Legal Bases (EEA/UK)</h3>
                <p>We process Personal Data under:</p>
                <ul>
                  <li><strong>Contract</strong> – to provide the Service and fulfill our agreement with you</li>
                  <li><strong>Legitimate Interests</strong> – security, fraud prevention, analytics, improvements</li>
                  <li><strong>Consent</strong> – non-essential cookies/marketing and certain AI features where required</li>
                  <li><strong>Legal Obligation</strong> – tax, accounting, and regulatory compliance</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services (Processors / Subprocessors)</h2>
                
                <h3 className="text-xl font-semibold mb-3">4.1 Supabase</h3>
                <p>
                  Database, authentication, real-time, file storage. Operates under its privacy policy and DPA. <strong>Region:</strong> US-East. 
                  <strong>RLS</strong> enforced for data minimization and access control.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Stripe</h3>
                <p>
                  Payment processing and subscription management. PCI-DSS compliant. We do not store full card details. Retention of payment records for 
                  legal obligations.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Google Analytics 4 (GA4)</h3>
                <p>
                  Usage analytics via cookies/SDKs. For EEA/UK, non-essential analytics run only with your consent. Opt-out tools may be available 
                  (e.g., Google Analytics Opt-out Add-on).
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.4 AI Services</h3>
                <p>
                  We use third-party AI providers (e.g., OpenAI, Anthropic, Google, or equivalents) to generate educational content and illustrations.
                </p>
                <ul>
                  <li>We <strong>disable provider training on your data</strong> where controls exist</li>
                  <li>We restrict prompts to the minimum necessary and instruct providers <strong>not to retain</strong> Personal Data beyond providing the requested output, subject to each provider's policies</li>
                  <li>If a provider cannot disable training or may retain data, we will list that provider here and obtain <strong>consent</strong> where required</li>
                  <li>We do <strong>not</strong> allow AI vendors to use children's data for advertising or model training</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.5 Hosting & Delivery (Netlify/CDN)</h3>
                <p>
                  The Service is hosted on Netlify with global CDN delivery and an origin region of United States. Netlify may collect standard server logs 
                  and performance metrics.
                </p>
                <p className="mt-4">
                  We maintain written DPAs with processors and assess vendor security controls.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Children's Privacy (COPPA)</h2>
                <p>
                  Chairlift Habits is designed for <strong>parents, teachers, and caregivers</strong> to provide educational content to children.
                  We comply with the <strong>Children's Online Privacy Protection Act (COPPA)</strong>.
                </p>
                <ul>
                  <li><strong>No Direct Accounts for Children Under 13:</strong> Only a parent/guardian may create an account and set up child profiles</li>
                  <li><strong>Verifiable Parental Consent:</strong> We use email verification to obtain verifiable parental consent before enabling child features</li>
                  <li><strong>Data Minimization:</strong> Kid profiles store first name and reward coins solely for personalization and progress. No public sharing or direct messaging features are provided to children</li>
                  <li><strong>Parental Rights:</strong> Parents can review, correct, or delete child data via Settings → Kid Profiles or by contacting support@chairlifthabits.com</li>
                  <li><strong>Schools/Teachers (if applicable):</strong> If used in a classroom, we rely on school authorization as permitted by COPPA. Schools must provide required notices/consents to parents</li>
                </ul>
                <p>
                  If you believe we collected data from a child under 13 without parental consent, contact us immediately at support@chairlifthabits.com.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Security</h2>
                <p>We implement industry-standard security measures:</p>
                <ul>
                  <li><strong>Encryption</strong> in transit (HTTPS/TLS) and at rest</li>
                  <li><strong>Access Controls</strong> including least privilege, Row-Level Security (RLS), and access logging</li>
                  <li><strong>Authentication</strong> with secure password hashing and token-based sessions</li>
                  <li><strong>Vendor Risk Management</strong> and contractual DPAs with processors</li>
                  <li><strong>Backups & DR:</strong> Regular backups and disaster recovery procedures</li>
                  <li><strong>Abuse/Malware Scanning</strong> for uploads and suspicious activity</li>
                </ul>
                <div className="bg-muted p-4 rounded-lg mt-4">
                  <p className="text-sm">
                    No method of transmission or storage is 100% secure. If we become aware of a <strong>data breach</strong> affecting your Personal Data, 
                    we will <strong>notify you and regulators</strong> as required.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Your Privacy Rights</h2>
                <p>Depending on your location, you may have rights to:</p>
                <ul>
                  <li><strong>Access & Portability:</strong> Obtain a copy of your Personal Data in a portable format</li>
                  <li><strong>Correction:</strong> Update or correct your information in account settings</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and associated data (subject to legal retention)</li>
                  <li><strong>Opt-Out:</strong> Opt out of marketing communications and, where applicable, analytics/targeting cookies</li>
                  <li><strong>Object/Restrict (EEA/UK):</strong> Object to or request restriction of processing, and withdraw consent where processing is based on consent</li>
                  <li><strong>Appeal (certain US states):</strong> If we deny your request, you may appeal by emailing support@chairlifthabits.com; we will respond within 45 days</li>
                </ul>
                <p className="mt-4">
                  <strong>Verification:</strong> We may verify your identity (e.g., email confirmation, request metadata) before fulfilling rights requests.
                </p>
                <p>
                  To exercise rights, contact support@chairlifthabits.com. We generally respond within 30 days (extendable where permitted by law).
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Cookies & Similar Technologies</h2>
                <p>We use cookies and similar technologies to operate and improve the Service.</p>
                <ul>
                  <li><strong>Essential Cookies:</strong> Required for authentication, security, and core functionality</li>
                  <li><strong>Non-Essential Cookies:</strong> Analytics (e.g., GA4)</li>
                </ul>
                <p className="mt-4">
                  <strong>EEA/UK:</strong> We set non-essential cookies only with your consent via our cookie banner. You can change preferences anytime 
                  via Cookie Settings. Disabling certain cookies may affect functionality.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Data Retention</h2>
                <p>We retain Personal Data only as long as necessary for the purposes described above or as required by law.</p>
                <ul>
                  <li><strong>Account Data:</strong> While your account is active and 12 months after closure (unless longer retention is required by law)</li>
                  <li><strong>Backups:</strong> 30–90 days rolling retention</li>
                  <li><strong>Server/Security Logs:</strong> 30–180 days</li>
                  <li><strong>Payment/Tax Records:</strong> 7 years to meet legal obligations</li>
                  <li><strong>User-Generated Content:</strong> Retained until you delete it or close your account</li>
                  <li><strong>Aggregated/De-identified Analytics:</strong> May be retained indefinitely and cannot reasonably be re-linked to an individual</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
                <p>
                  Your information may be transferred to and processed in countries other than your country of residence. For <strong>EEA/UK</strong> Personal Data, 
                  we rely on the <strong>EU Standard Contractual Clauses (SCCs)</strong> and the <strong>UK IDTA/Addendum</strong>, and conduct 
                  <strong>transfer impact assessments</strong> where required. We implement appropriate safeguards consistent with applicable data protection laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
                <p>We may update this Privacy Policy from time to time. We will notify you by:</p>
                <ul>
                  <li>Posting the updated Policy on this page</li>
                  <li>Updating the "Last Updated" date</li>
                  <li>Sending an email for material changes (if you have an account)</li>
                </ul>
                <p>
                  Your continued use of the Service after changes take effect signifies acceptance of the updated Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
                <div className="bg-muted p-6 rounded-lg">
                  <p className="font-semibold">Van7, LLC (DBA Chairlift Habits)</p>
                  <p>Email: support@chairlifthabits.com</p>
                  <p>Website: https://chairlifthabits.com</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">13. State & Regional Disclosures</h2>
                
                <h3 className="text-xl font-semibold mb-3">California (CCPA/CPRA)</h3>
                <p>
                  California residents have the right to know, access, delete, correct, and portability; to limit use of sensitive personal information; 
                  and to non-discrimination for exercising rights.
                </p>
                <ul>
                  <li>We <strong>do not sell</strong> Personal Data</li>
                  <li>We <strong>do not share</strong> Personal Data for <strong>cross-context behavioral advertising</strong></li>
                  <li>If this changes, we will provide a "Do Not Sell or Share My Personal Information" link and honor Global Privacy Control (GPC) signals</li>
                </ul>
                <p>Submit requests via dailyabcillustrations@gmail.com.</p>

                <h3 className="text-xl font-semibold mb-3 mt-6">Colorado / Connecticut / Virginia / Other US State Laws</h3>
                <p>
                  Residents may have similar rights (access, correction, deletion, portability, and appeal). Submit requests via dailyabcillustrations@gmail.com. 
                  We will respond within the required timeframe.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">EEA/UK (GDPR/UK GDPR)</h3>
                <p>
                  EEA/UK residents have rights to access, rectification, erasure, restriction, portability, and objection; and to withdraw consent where processing 
                  is based on consent. You may lodge a complaint with your local supervisory authority. Contact dailyabcillustrations@gmail.com to exercise rights.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">14. Additional Notes on UGC & Moderation</h2>
                <p>
                  We may use automated and/or manual review to detect malware or abusive content in uploads and to enforce our Terms. We reserve the right to 
                  remove UGC that violates our policies or the law.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">15. Regional Infrastructure (Transparency)</h2>
                <ul>
                  <li><strong>Supabase Region:</strong> US-East</li>
                  <li><strong>Netlify Origin:</strong> United States; global CDN delivery</li>
                  <li><strong>AI Processing:</strong> Per-provider infrastructure; safeguards and SCCs/IDTA where applicable</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-xl font-semibold mb-3">Version Control</h3>
                <p>
                  We maintain prior versions of this Privacy Policy upon request. Material changes will be summarized at the top of the document upon update.
                </p>
              </section>
            </article>
          </Container>
        </main>
        {shouldShowFooter && <Footer />}
      </div>
    </>
  );
};

export default PrivacyPolicy;
