import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>Never Miss a Lead From a Missed Call Again</h1>
            <p className={styles.description}>
              AI-powered text automation for businesses
            </p>
            <p className={styles.slogan}>
              Texting that works as hard as you do.
            </p>
            <div className={styles.cta}>
              <Link href="/pricing" className={styles.button}>
                Start Free Trial
              </Link>
              <Link href="/demo" className={styles.secondaryButton}>
                See How It Works
              </Link>
            </div>
          </div>
          <div className={styles.heroImage}>
            <Image 
              src="https://images.unsplash.com/photo-1516387938699-a93567ec168e" 
              alt="Business person checking phone messages" 
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </section>

        {/* Statistics Section */}
        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>78%</div>
              <p className={styles.statText}>
                of customers buy from the first business that responds
              </p>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>10x</div>
              <p className={styles.statText}>
                better conversion rate when missed calls are followed up within 5 minutes
              </p>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>20%</div>
              <p className={styles.statText}>
                of small businesses follow up on missed calls within an hour
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <h2 className={styles.title} style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Key Features</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Auto-text for Missed Calls</h2>
            <p>Never miss a lead again. Automatically respond to missed calls with personalized text messages.</p>
          </div>

          <div className={styles.card}>
            <h2>Industry Templates</h2>
            <p>Pre-built response templates for restaurants, auto shops, salons, and more.</p>
          </div>

          <div className={styles.card}>
            <h2>AI-Powered Responses</h2>
            <p>Custom AI-generated messages trained on your business to provide relevant information.</p>
          </div>

          <div className={styles.card}>
            <h2>Lead Management</h2>
            <p>Track, tag, and organize leads with our simple but powerful CRM integration.</p>
          </div>
        </div>

        {/* Industry Section */}
        <section className={styles.industrySection}>
          <h2 className={styles.title} style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Industry Solutions</h2>
          <div className={styles.industryGrid}>
            <div className={styles.industryCard}>
              <Image 
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0" 
                alt="Restaurant interior" 
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className={styles.industryOverlay}>
                <h3 className={styles.industryTitle}>Restaurants</h3>
                <p className={styles.industryDescription}>
                  Handle reservation requests, answer menu questions, and manage waitlists automatically.
                </p>
              </div>
            </div>
            <div className={styles.industryCard}>
              <Image 
                src="https://images.unsplash.com/photo-1486006920555-c77dcf18193c" 
                alt="Auto shop mechanic" 
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className={styles.industryOverlay}>
                <h3 className={styles.industryTitle}>Auto Shops</h3>
                <p className={styles.industryDescription}>
                  Schedule service appointments, provide estimates, and follow up on repairs.
                </p>
              </div>
            </div>
            <div className={styles.industryCard}>
              <Image 
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035" 
                alt="Salon interior" 
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className={styles.industryOverlay}>
                <h3 className={styles.industryTitle}>Salons</h3>
                <p className={styles.industryDescription}>
                  Book appointments, confirm services, and send reminders to clients.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Marketing Section */}
        <div className={styles.marketingSection}>
          <h2>SmartText Programmatic Marketing Tool</h2>
          <p>Track your leads from different sources and optimize your marketing spend.</p>
          <ul className={styles.featureList}>
            <li>Automatically tag leads based on source (Google, Yelp, Ads, etc.)</li>
            <li>See which channels produce the most missed calls and leads</li>
            <li>One-click SMS follow-up campaigns</li>
            <li>Lead funnel insights and conversion tracking</li>
          </ul>
        </div>

        {/* Final CTA Section */}
        <section className={styles.finalCta}>
          <h2>Ready to stop losing leads from missed calls?</h2>
          <p>Join thousands of businesses that are converting more leads and growing their revenue with SmartText AI.</p>
          <div className={styles.cta}>
            <Link href="/pricing" className={styles.button}>
              Start Your Free 7-Day Trial
            </Link>
            <Link href="/demo" className={styles.secondaryButton}>
              Schedule a Demo
            </Link>
          </div>
          <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>No credit card required. Cancel anytime.</p>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© 2025 SmartText AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
