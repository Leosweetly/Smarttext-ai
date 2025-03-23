import Link from "next/link";
import styles from "../terms/legal.module.css";

export default function PrivacyPage() {
  return (
    <div className={styles.legalPage}>
      <div className={styles.legalContainer}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo}>
            SmartText AI
          </Link>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.lastUpdated}>Last Updated: March 20, 2025</p>
        </header>
        
        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Introduction</h2>
            <p>
              At SmartText AI ("we," "our," or "us"), we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile applications, or any of our services (collectively, the "Services").
            </p>
            <p>
              Please read this Privacy Policy carefully. By accessing or using the Services, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with our policies and practices, please do not use our Services.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>2. Information We Collect</h2>
            <h3>2.1 Information You Provide to Us</h3>
            <p>
              We collect information that you provide directly to us, including:
            </p>
            <ul>
              <li>Account Information: When you register for an account, we collect your name, email address, password, business name, business type, phone number, and address.</li>
              <li>Payment Information: When you subscribe to our Services, we collect payment information, which may include credit card details, billing address, and other financial information necessary to process your payment.</li>
              <li>Business Information: Information about your business, including business hours, services offered, and other details you provide to customize our Services.</li>
              <li>Communications: Information you provide when you contact us for customer support or otherwise communicate with us.</li>
            </ul>
            
            <h3>2.2 Information We Collect Automatically</h3>
            <p>
              When you use our Services, we may automatically collect certain information, including:
            </p>
            <ul>
              <li>Device Information: Information about the device you use to access our Services, including device type, operating system, browser type, and device identifiers.</li>
              <li>Usage Information: Information about your use of our Services, including the pages you visit, the time and duration of your visits, and the actions you take within our Services.</li>
              <li>Location Information: General location information based on your IP address.</li>
              <li>Log Data: Information that your browser or device automatically sends whenever you use our Services, including your IP address, browser type, and operating system.</li>
            </ul>
            
            <h3>2.3 Information from Third Parties</h3>
            <p>
              We may receive information about you from third parties, including:
            </p>
            <ul>
              <li>Business Partners: We may receive information about you from our business partners, such as when you integrate our Services with other services you use.</li>
              <li>Service Providers: We may receive information from service providers that help us operate, provide, improve, and market our Services.</li>
            </ul>
          </section>
          
          <section className={styles.section}>
            <h2>3. How We Use Your Information</h2>
            <p>
              We use the information we collect for various purposes, including:
            </p>
            <ul>
              <li>To provide, maintain, and improve our Services</li>
              <li>To process transactions and manage your account</li>
              <li>To send you technical notices, updates, security alerts, and administrative messages</li>
              <li>To respond to your comments, questions, and customer service requests</li>
              <li>To communicate with you about products, services, offers, and events, and provide news and information we think will be of interest to you</li>
              <li>To monitor and analyze trends, usage, and activities in connection with our Services</li>
              <li>To detect, investigate, and prevent fraudulent transactions and other illegal activities and protect the rights and property of SmartText AI and others</li>
              <li>To personalize your experience and deliver content and product and service offerings relevant to your interests</li>
            </ul>
          </section>
          
          <section className={styles.section}>
            <h2>4. How We Share Your Information</h2>
            <p>
              We may share your information in the following circumstances:
            </p>
            <ul>
              <li>With service providers that perform services on our behalf</li>
              <li>With business partners when you choose to integrate our Services with their services</li>
              <li>In response to a request for information if we believe disclosure is in accordance with, or required by, any applicable law, regulation, or legal process</li>
              <li>If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of SmartText AI or others</li>
              <li>In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business by another company</li>
              <li>With your consent or at your direction</li>
            </ul>
          </section>
          
          <section className={styles.section}>
            <h2>5. Your Choices</h2>
            <h3>5.1 Account Information</h3>
            <p>
              You can update your account information at any time by logging into your account and accessing your account settings. If you wish to delete your account, please contact us at privacy@getsmarttext.com.
            </p>
            
            <h3>5.2 Marketing Communications</h3>
            <p>
              You can opt out of receiving promotional emails from us by following the instructions in those emails. If you opt out, we may still send you non-promotional emails, such as those about your account or our ongoing business relations.
            </p>
            
            <h3>5.3 Cookies</h3>
            <p>
              Most web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove or reject cookies. Please note that if you choose to remove or reject cookies, this could affect the availability and functionality of our Services.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>6. Data Security</h2>
            <p>
              We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the Internet or method of electronic storage is 100% secure. Therefore, while we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>7. Data Retention</h2>
            <p>
              We will retain your personal information for as long as necessary to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements. To determine the appropriate retention period for personal information, we consider the amount, nature, and sensitivity of the personal information, the potential risk of harm from unauthorized use or disclosure of your personal information, the purposes for which we process your personal information and whether we can achieve those purposes through other means, and the applicable legal requirements.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>8. Children's Privacy</h2>
            <p>
              Our Services are not intended for children under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and you believe your child has provided us with personal information, please contact us at privacy@getsmarttext.com.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>9. International Data Transfers</h2>
            <p>
              Your personal information may be transferred to, and processed in, countries other than the country in which you are resident. These countries may have data protection laws that are different from the laws of your country. Specifically, our servers are located in the United States. By providing your personal information, you consent to such transfers and processing.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>10. Your California Privacy Rights</h2>
            <p>
              If you are a California resident, you have certain rights regarding your personal information under the California Consumer Privacy Act (CCPA). These rights include:
            </p>
            <ul>
              <li>The right to know what personal information we collect, use, disclose, and sell</li>
              <li>The right to request deletion of your personal information</li>
              <li>The right to opt-out of the sale of your personal information</li>
              <li>The right to non-discrimination for exercising your CCPA rights</li>
            </ul>
            <p>
              To exercise these rights, please contact us at privacy@getsmarttext.com.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes to this Privacy Policy, we will notify you by email or by posting a notice on our website. Your continued use of the Services after such modifications will constitute your acknowledgment of the modified Privacy Policy and agreement to abide and be bound by the modified Privacy Policy.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>12. Contact Information</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p>
              SmartText AI<br />
              Email: privacy@getsmarttext.com
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
