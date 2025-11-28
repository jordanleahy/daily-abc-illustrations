import { MetaHead } from '@/components/common';
import { SITE_CONFIG, getSiteTitle } from '@/config/site';
import { Container } from '@/components/layout';
import { Header } from '@/components/layout';
import { Footer } from '@/components/landing/Footer';
import { useAuthContext } from '@/contexts/AuthContext';

const TermsOfService = () => {
  const { isAuthenticated, loading } = useAuthContext();

  const lastUpdated = "October 1, 2025";
  const shouldShowFooter = !isAuthenticated && !loading;

  return (
    <>
      <MetaHead
        metadata={{
          title: getSiteTitle('Terms of Service'),
          description: 'Terms of Service for ChairLift - Legal agreement governing use of our educational platform.',
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
                <h2 className="text-2xl font-semibold mb-4">1) Agreement to Terms</h2>
                <p>
                  These Terms of Service ("Terms") are a legally binding agreement between Van7, LLC d/b/a Chairlift Habits 
                  ("Chairlift Habits," "Company," "we," "us," or "our") and you ("you," "User") governing your access to and use of
                  dailyabcillustrations.com and related apps, services, and APIs (the "Service"). Our Privacy Policy is incorporated by reference.
                </p>
                <p>
                  By using the Service, you agree to these Terms. If you do not agree, do not use the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2) The Service</h2>
                
                <h3 className="text-xl font-semibold mb-3">2.1 Overview</h3>
                <p>
                  Chairlift Habits is an AI-powered educational platform that helps adults create personalized books and
                  illustrations for children, with progress tracking and reward systems to build lasting reading habits.
                </p>
                <p>Features may include:</p>
                <ul>
                  <li><strong>Daily Content:</strong> New educational content scheduled around 7:01 AM ET</li>
                  <li><strong>AI Book Creation & Illustrations</strong></li>
                  <li><strong>Kid Profiles:</strong> Parent/guardian-managed profiles with rewards/progress</li>
                  <li><strong>Library & History:</strong> Access to prior and upcoming content</li>
                  <li><strong>Premium Features:</strong> Subscription tiers, institution/family plans</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.2 AI-Generated Content</h3>
                <p>
                  Content (text/images) may be generated or assisted by AI and can contain inaccuracies or artifacts. Parental supervision 
                  is required when children engage with content. You acknowledge AI limitations and agree to review outputs before sharing 
                  with children.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Beta/Experimental Features</h3>
                <p>
                  We may offer beta or experimental features that are provided as-is, may be rate-limited, changed, or discontinued without notice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3) Eligibility & Accounts</h2>
                
                <h3 className="text-xl font-semibold mb-3">3.1 Eligibility</h3>
                <p>
                  You must be 18+ (or the age of majority in your jurisdiction) to create an account. Parents/guardians may create and manage 
                  child profiles. If you are an educator using the Service for students, you represent you have obtained all required 
                  permissions/consents.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Registration & Security</h3>
                <p>
                  You agree to provide accurate, current information; keep credentials confidential; and promptly update changes. You are 
                  responsible for activities under your account and must notify us of any suspected unauthorized access.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.3 Termination by You</h3>
                <p>
                  You may delete your account at any time in Settings or by contacting support@chairlifthabits.com. Export your content 
                  before deletion.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.4 Suspension/Termination by Us</h3>
                <p>
                  We may suspend or terminate access immediately (with or without notice) for breach, suspected fraud/abuse, non-payment, 
                  legal risk, platform integrity risk, or as otherwise reasonably necessary. We are not liable for termination consistent 
                  with these Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4) Subscriptions, Billing, and Refunds</h2>
                
                <h3 className="text-xl font-semibold mb-3">4.1 Plans & Pricing</h3>
                <p>
                  Plan details and current pricing appear on our site and may change. Changes apply on the next renewal after notice.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Billing</h3>
                <ul>
                  <li>Payments are processed by Stripe; we do not store full card numbers</li>
                  <li>Subscriptions auto-renew unless canceled before the renewal date</li>
                  <li>You authorize recurring charges and applicable taxes</li>
                  <li>Failed payments may result in suspension</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Cancellations & Refunds</h3>
                <ul>
                  <li>Cancel anytime in Settings or the Stripe Customer Portal; service continues through the paid term</li>
                  <li><strong>Refunds:</strong> At our sole discretion; no refunds for partial periods unless required by law</li>
                  <li><strong>Trials:</strong> If you cancel before the trial ends, you will not be charged</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5) Intellectual Property & Licenses</h2>
                
                <h3 className="text-xl font-semibold mb-3">5.1 Our Rights</h3>
                <p>
                  The Service, including software, design, UI, databases, models, templates, style guides, daily content, and trademarks 
                  (collectively, "Company Materials"), are owned by us or our licensors and protected by IP laws. Except for the limited 
                  license below, no rights are granted.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Your User Content</h3>
                <p>
                  "User Content" includes books, prompts, uploads, metadata, and other content you submit. You retain ownership of your 
                  User Content.
                </p>
                <p>
                  <strong>License to Us:</strong> You grant us a worldwide, non-exclusive, royalty-free license to host, process, transmit, 
                  display, and create technical derivatives of your User Content solely to operate, secure, and improve the Service 
                  (e.g., backups, caching, formatting, abuse/malware scanning). We do not use children's personal data for advertising 
                  or third-party marketing.
                </p>
                <p>
                  You represent and warrant you have all rights to submit User Content and that it does not infringe others' rights or 
                  violate law or these Terms.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">5.3 AI Outputs</h3>
                <p>
                  For content you generate via our AI tools ("AI Output"), we grant you a personal, non-exclusive, non-transferable, 
                  non-sublicensable license to use, display, and reproduce the AI Output for personal, non-commercial educational purposes. 
                  Commercial use (e.g., sale, licensing, merchandising, brand collateral) requires our prior written permission.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">5.4 Feedback</h3>
                <p>
                  If you provide ideas or suggestions, you grant us a perpetual, irrevocable, royalty-free license to use them without 
                  restriction or attribution.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">5.5 DMCA / Takedowns</h3>
                <p>
                  We respond to notices under the DMCA and analogous regimes. Submit notices to support@chairlifthabits.com with 
                  required details. We may remove content and/or terminate repeat infringers.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6) Acceptable Use</h2>
                <p>You agree not to:</p>
                <ul>
                  <li>Violate any law or third-party rights; submit unlawful/infringing content</li>
                  <li>Attempt unauthorized access, probe, or disrupt the Service</li>
                  <li>Upload malware or harmful code; interfere with security or RLS controls</li>
                  <li>Scrape, crawl, or harvest data except via documented APIs and allowed export tools</li>
                  <li>Reverse engineer or decompile the Service, except to the extent permitted by law</li>
                  <li>Bypass paywalls, quotas, or rate limits</li>
                  <li>Generate content that is obscene, exploitative, harassing, or harmful to children</li>
                  <li>Share credentials or resell/lease the Service to others</li>
                  <li>Use the Service or outputs to train or improve competing AI models or datasets, or for benchmarking to disparage the Service without permission</li>
                </ul>
                <p>
                  We may throttle, block, or remove content and/or suspend accounts to enforce this section.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7) Children's Safety</h2>
                <p>
                  The Service is built for adults to create and manage content for children. We do not permit direct accounts for children 
                  under 13. Parents/guardians must supervise child use and determine age-appropriateness. We comply with COPPA as described 
                  in our Privacy Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8) Third-Party Services</h2>
                <p>
                  The Service integrates with third-party services (e.g., Stripe, Supabase, hosting/CDN, analytics, AI vendors). Their 
                  terms and privacy policies apply to their services. We are not responsible for third-party actions; we select and manage 
                  vendors with reasonable diligence.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9) Service Availability, Changes, and Support</h2>
                <p>
                  We may modify, discontinue, or deprecate features at any time. We aim for high availability but do not guarantee 
                  uninterrupted Service. Planned maintenance and incidents may cause downtime. Support channels and response targets are 
                  posted on our site (if applicable).
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10) Disclaimers</h2>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold uppercase">
                    THE SERVICE (INCLUDING AI FEATURES AND BETA FEATURES) IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE FULLEST EXTENT 
                    PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR 
                    PURPOSE, NON-INFRINGEMENT, AND ACCURACY. YOU ARE RESPONSIBLE FOR REVIEWING AI OUTPUTS BEFORE USING OR SHARING THEM 
                    WITH CHILDREN.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11) Limitation of Liability</h2>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold uppercase mb-4">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
                    EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS INTERRUPTION, EVEN IF 
                    ADVISED OF THE POSSIBILITY.
                  </p>
                  <p className="font-semibold uppercase">
                    OUR AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THE SERVICE SHALL NOT EXCEED THE GREATER OF 
                    (A) THE AMOUNT PAID BY YOU TO US IN THE 12 MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY, OR (B) USD $100.
                  </p>
                </div>
                <p className="text-sm mt-4">
                  Some jurisdictions do not allow certain limitations; some limits may not apply.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12) Indemnification</h2>
                <p>
                  You will indemnify and hold harmless Van7, LLC and its officers, directors, employees, and agents from claims, damages, 
                  losses, and expenses (including reasonable attorneys' fees) arising from: (a) your use or misuse of the Service or AI Output; 
                  (b) your User Content; (c) your breach of these Terms; or (d) your violation of law or third-party rights.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">13) Dispute Resolution; Arbitration; Class-Action Waiver</h2>
                
                <h3 className="text-xl font-semibold mb-3">13.1 Informal Resolution</h3>
                <p>
                  Contact support@chairlifthabits.com first. We will attempt to resolve disputes in good faith within 30 days.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">13.2 Binding Arbitration</h3>
                <p>
                  Except for the Opt-Out and Exceptions below, any dispute arising out of or relating to these Terms or the Service will 
                  be resolved by final and binding arbitration administered by the American Arbitration Association (AAA) under its Consumer 
                  Arbitration Rules. The seat and venue of arbitration will be [County, State], unless otherwise required by law. The language 
                  is English. Judgment may be entered on the award in any court of competent jurisdiction.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">13.3 Class-Action and Jury Trial Waiver</h3>
                <p>
                  You and we agree to bring claims only in an individual capacity, not as a plaintiff or class member in any purported class 
                  or representative proceeding. You waive the right to a jury trial.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">13.4 30-Day Arbitration Opt-Out</h3>
                <p>
                  You may opt out of arbitration by emailing support@chairlifthabits.com within 30 days of creating your account or first 
                  becoming subject to this clause, with subject "Arbitration Opt-Out," and including your full name, account email, and a 
                  statement that you opt out.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">13.5 Exceptions</h3>
                <p>
                  Either party may seek: (a) injunctive or equitable relief in court to protect IP or confidentiality; and (b) claims within 
                  the jurisdictional limits of small claims court.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">14) Governing Law & Venue</h2>
                <p>
                  These Terms are governed by the laws of the State of [State], without regard to conflict-of-laws rules. Subject to 
                  arbitration, the exclusive venue for disputes will be the state or federal courts located in [County, State], and you 
                  consent to personal jurisdiction there.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">15) Data; Privacy; Security</h2>
                <p>
                  Use of the Service is subject to our Privacy Policy. You acknowledge that (i) we process personal data as described there; 
                  (ii) third-party processors support the Service; and (iii) you will comply with applicable laws when using or uploading 
                  data, including child data.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">16) Educational/Institution Accounts (If Applicable)</h2>
                <p>If you are a school or district:</p>
                <ul>
                  <li>You represent you have authority to bind your institution and to provide/obtain all required notices and consents (e.g., COPPA school authorization)</li>
                  <li>You agree not to provide unnecessary personal data and to use available privacy controls</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">17) Export Control; Sanctions</h2>
                <p>
                  You may not use the Service in or for the benefit of any country or person embargoed or restricted by the U.S. or other 
                  applicable sanctions laws, or for prohibited end-uses.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">18) Changes to the Terms</h2>
                <p>
                  We may update these Terms from time to time. For material changes, we will provide notice (e.g., email, in-app notice, or banner) 
                  and update the "Last Updated" date. Changes become effective on the stated effective date. If you continue using the Service 
                  after changes take effect, you accept the revised Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">19) General</h2>
                <ul>
                  <li><strong>Entire Agreement:</strong> These Terms and the Privacy Policy are the entire agreement</li>
                  <li><strong>Severability:</strong> If any provision is unenforceable, the remainder remains in effect</li>
                  <li><strong>No Waiver:</strong> Failure to enforce a provision is not a waiver</li>
                  <li><strong>Assignment:</strong> You may not assign these Terms without our consent; we may assign to an affiliate or in connection with a merger, acquisition, or asset sale</li>
                  <li><strong>Force Majeure:</strong> We are not liable for delays/failures due to events beyond reasonable control (e.g., internet outages, disasters, war, labor disputes, government action)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">20) Contact</h2>
                <div className="bg-muted p-6 rounded-lg">
                  <p className="font-semibold">Van7, LLC (DBA Chairlift Habits)</p>
                  <p><strong>Email:</strong> support@chairlifthabits.com</p>
                  <p><strong>Website:</strong> https://dailyabcillustrations.com</p>
                </div>
                <div className="bg-muted p-4 rounded-lg mt-4">
                  <p className="font-semibold">
                    Acknowledgment: By using the Service, you confirm you have read, understood, and agree to these Terms and our Privacy Policy.
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
