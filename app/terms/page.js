import Link from "next/link";
import styles from "./legal.module.css";

export default function TermsPage() {
  return (
    <div className={styles.legalPage}>
      <div className={styles.legalContainer}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo}>
            SmartText AI
          </Link>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.lastUpdated}>Effective Date: January 1, 2025</p>
        </header>
        
        <div className={styles.content}>
          <p>
            These Terms of Service ("Terms") govern your access to and use of SmartText AI ("we", "our", or "us") services.
          </p>
          <p>
            By using SmartText AI, you agree to these Terms. If you do not agree, do not use our services.
          </p>
          
          <section className={styles.section}>
            <h2>1. Account Use</h2>
            <p>
              You must be at least 18 years old to use our services. You are responsible for maintaining the confidentiality of your account and for all activity under your login.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>2. Acceptable Use</h2>
            <p>
              You agree not to:
            </p>
            <ul>
              <li>Use SmartText AI to send spam or unsolicited messages</li>
              <li>Violate any local, state, or federal laws (e.g., TCPA compliance)</li>
              <li>Interfere with or disrupt the service</li>
              <li>Attempt to reverse-engineer or replicate our platform</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms or abuse the system.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>3. Customer Responsibilities</h2>
            <p>
              You are solely responsible for:
            </p>
            <ul>
              <li>Ensuring recipients of your SMS messages have given proper consent</li>
              <li>Verifying the accuracy of your customer contact data</li>
              <li>Using the service in compliance with applicable marketing and communication laws</li>
            </ul>
          </section>
          
          <section className={styles.section}>
            <h2>4. Payments & Billing</h2>
            <ul>
              <li>Subscriptions are billed monthly or annually.</li>
              <li>Failed payments may result in account suspension.</li>
              <li>No refunds are offered unless legally required.</li>
            </ul>
          </section>
          
          <section className={styles.section}>
            <h2>5. Service Availability</h2>
            <p>
              We strive for high uptime, but we do not guarantee uninterrupted service. Maintenance and outages may occur.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>6. Changes to the Service</h2>
            <p>
              We may update, change, or discontinue features at any time. If we make a material change to the Terms, we will notify you in advance.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>7. Limitation of Liability</h2>
            <p>
              We are not liable for:
            </p>
            <ul>
              <li>Loss of revenue, customers, or data</li>
              <li>Errors resulting from misuse of the platform</li>
              <li>Third-party service failures (e.g., Twilio outages)</li>
            </ul>
            <p>
              Our total liability shall not exceed the amount you paid us in the past 6 months.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>8. Termination</h2>
            <p>
              You may cancel your account at any time. We may suspend or terminate access for violations of these Terms, or if required by law.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>9. Privacy</h2>
            <p>
              Your privacy is important to us. Please review our <Link href="/privacy">Privacy Policy</Link>, which explains how we collect, use, and disclose information about you.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>10. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p>
              SmartText AI<br />
              Email: kdavis72490@gmail.com
            </p>
          </section>
        </div>
        
        <footer className={styles.footer}>
          <p>© 2025 SmartText AI. All rights reserved.</p>
          <div className={styles.footerLinks}>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/about">About Us</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
