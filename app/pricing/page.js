import Link from "next/link";
import styles from "./pricing.module.css";

export default function PricingPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>SmartText AI Pricing</h1>
        <p className={styles.description}>
          Choose the plan that's right for your business
        </p>
        <p className={styles.slogan}>Texting that works as hard as you do.</p>

        <div className={styles.pricingGrid}>
          {/* Core Plan */}
          <div className={styles.pricingCard}>
            <div className={styles.pricingHeader}>
              <h2>Core</h2>
              <div className={styles.price}>
                <span className={styles.amount}>$249</span>
                <span className={styles.period}>/mo</span>
              </div>
              <p className={styles.trial}>7-day free trial</p>
            </div>
            <div className={styles.pricingFeatures}>
              <ul>
                <li>Auto-text for missed calls</li>
                <li>Pre-built industry response templates</li>
                <li>Two-way SMS Inbox (mobile + desktop)</li>
                <li>Basic contact log + conversation history</li>
                <li>Simple appointment booking link support</li>
                <li>Tag and organize leads manually</li>
                <li>No setup fees. Cancel anytime.</li>
              </ul>
            </div>
            <div className={styles.pricingFooter}>
              <Link href="/signup?plan=core" className={styles.button}>
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Pro Plan */}
          <div className={`${styles.pricingCard} ${styles.featured}`}>
            <div className={styles.pricingHeader}>
              <div className={styles.popularBadge}>Most Popular</div>
              <h2>Pro</h2>
              <div className={styles.price}>
                <span className={styles.amount}>$399</span>
                <span className={styles.period}>/mo</span>
              </div>
              <p className={styles.trial}>7-day free trial</p>
            </div>
            <div className={styles.pricingFeatures}>
              <ul>
                <li>Everything in Core, plus:</li>
                <li>CRM integration (HubSpot, Zoho, Pipedrive via Zapier)</li>
                <li>AI-powered custom replies (trained on your business)</li>
                <li>Lead qualification flows (automated follow-up Q&A)</li>
                <li>Shared inbox with team assignments</li>
                <li>Advanced tagging & customer notes</li>
                <li>Internal team comments & response tracking</li>
                <li>Mobile-first support with push notifications</li>
                <li>SmartText Programmatic Marketing Tool</li>
              </ul>
            </div>
            <div className={styles.pricingFooter}>
              <Link href="/signup?plan=pro" className={`${styles.button} ${styles.featured}`}>
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Growth Plan */}
          <div className={styles.pricingCard}>
            <div className={styles.pricingHeader}>
              <h2>Growth</h2>
              <div className={styles.price}>
                <span className={styles.amount}>$599+</span>
                <span className={styles.period}>/mo</span>
              </div>
              <p className={styles.trial}>7-day free trial</p>
            </div>
            <div className={styles.pricingFeatures}>
              <ul>
                <li>Everything in Pro, plus:</li>
                <li>Multi-location support with location-specific auto-replies</li>
                <li>Priority onboarding & support access</li>
                <li>AI training on documents, SOPs, and FAQ libraries</li>
                <li>Bulk SMS campaigns (promos, follow-ups, review requests)</li>
                <li>Advanced analytics dashboard (response rates, lead conversions)</li>
                <li>SLA response time guarantee</li>
                <li>Advanced SmartText Marketing Tool features</li>
              </ul>
            </div>
            <div className={styles.pricingFooter}>
              <Link href="/signup?plan=growth" className={styles.button}>
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.faq}>
          <h2>Frequently Asked Questions</h2>
          
          <div className={styles.faqItem}>
            <h3>What's included in the 7-day trial?</h3>
            <p>
              All features of your selected plan are available during the trial period.
              No credit card required to start. We'll remind you before the trial ends.
            </p>
          </div>
          
          <div className={styles.faqItem}>
            <h3>Can I change plans later?</h3>
            <p>
              Yes, you can upgrade or downgrade your plan at any time. 
              Upgrades take effect immediately, while downgrades take effect at the end of your billing cycle.
            </p>
          </div>
          
          <div className={styles.faqItem}>
            <h3>How does the auto-text feature work?</h3>
            <p>
              When your business misses a call, our system automatically sends a personalized text message
              to the caller based on your business type and settings.
            </p>
          </div>
          
          <div className={styles.faqItem}>
            <h3>What are the industry templates?</h3>
            <p>
              We offer pre-built message templates optimized for different industries like restaurants,
              auto shops, salons, and more. You can customize these templates to fit your business.
            </p>
          </div>
        </div>
      </main>
      <footer className={styles.footer}>
        <p>Powered by SmartText AI</p>
      </footer>
    </div>
  );
}
