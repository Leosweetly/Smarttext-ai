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
          <p className={styles.lastUpdated}>Last Updated: March 20, 2025</p>
        </header>
        
        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Introduction</h2>
            <p>
              Welcome to SmartText AI ("we," "our," or "us"). By accessing or using our website, mobile applications, or any of our services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). Please read these Terms carefully.
            </p>
            <p>
              By accessing or using the Services, you represent that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>2. Eligibility</h2>
            <p>
              You must be at least 18 years old to use our Services. By using our Services, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms.
            </p>
            <p>
              If you are using the Services on behalf of a business or other entity, you represent and warrant that you have the authority to bind that business or entity to these Terms.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>3. Account Registration</h2>
            <p>
              To access certain features of the Services, you may need to register for an account. When you register, you agree to provide accurate, current, and complete information about yourself and your business.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>4. Subscription and Payments</h2>
            <p>
              SmartText AI offers various subscription plans. By subscribing to a plan, you agree to pay the applicable fees as described on our pricing page. All payments are non-refundable except as expressly stated in these Terms or as required by applicable law.
            </p>
            <p>
              We offer a 7-day free trial for new users. If you do not cancel your subscription before the end of the trial period, you will be charged the applicable subscription fee.
            </p>
            <p>
              You may cancel your subscription at any time through your account settings. If you cancel, you will continue to have access to the Services until the end of your current billing period.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>5. Use of Services</h2>
            <p>
              You agree to use the Services only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul>
              <li>Use the Services in any way that violates any applicable law or regulation</li>
              <li>Use the Services to send unsolicited communications or spam</li>
              <li>Attempt to interfere with or disrupt the Services or servers or networks connected to the Services</li>
              <li>Attempt to gain unauthorized access to any part of the Services</li>
              <li>Use the Services to harass, abuse, or harm another person</li>
              <li>Use the Services to collect or store personal data about other users without their consent</li>
            </ul>
          </section>
          
          <section className={styles.section}>
            <h2>6. Intellectual Property</h2>
            <p>
              The Services and all content and materials included on the Services, including but not limited to text, graphics, logos, images, and software, are the property of SmartText AI or its licensors and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              We grant you a limited, non-exclusive, non-transferable, and revocable license to use the Services for your personal or business purposes, subject to these Terms.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>7. Privacy</h2>
            <p>
              Your privacy is important to us. Please review our <Link href="/privacy">Privacy Policy</Link>, which explains how we collect, use, and disclose information about you.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT THE SERVICES OR THE SERVERS THAT MAKE THEM AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>9. Limitation of Liability</h2>
            <p>
              IN NO EVENT WILL SMARTTEXT AI, ITS AFFILIATES, OR THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS, OFFICERS, OR DIRECTORS BE LIABLE FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL THEORY, ARISING OUT OF OR IN CONNECTION WITH YOUR USE, OR INABILITY TO USE, THE SERVICES, INCLUDING ANY DIRECT, INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>10. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless SmartText AI, its affiliates, and their respective officers, directors, employees, and agents from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Services.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>11. Termination</h2>
            <p>
              We may terminate or suspend your access to the Services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
            </p>
            <p>
              Upon termination, your right to use the Services will immediately cease. If you wish to terminate your account, you may simply discontinue using the Services or cancel your subscription through your account settings.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. If we make material changes to these Terms, we will notify you by email or by posting a notice on our website. Your continued use of the Services after such modifications will constitute your acknowledgment of the modified Terms and agreement to abide and be bound by the modified Terms.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>14. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p>
              SmartText AI<br />
              Email: legal@getsmarttext.com
            </p>
          </section>
        </div>
        
        <footer className={styles.footer}>
          <p>© 2025 SmartText AI. All rights reserved.</p>
          <div className={styles.footerLinks}>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
