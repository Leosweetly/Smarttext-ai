import styles from './about.module.css';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>About SmartText AI</h1>
        <p className={styles.description}>
          Changing the way service-based businesses handle customer communication
        </p>

        <div className={styles.content}>
          <div className={styles.section}>
            <p>
              At SmartText AI, we're changing the way service-based businesses handle customer communication. 
              Whether it's a missed call, a lead that slips through the cracks, or a customer trying to book 
              after hours, we've built an AI-powered system that helps businesses stay responsive without 
              staying glued to their phones.
            </p>
            
            <p>
              SmartText AI is designed for simplicity, clarity, and reliability. We serve hard-working teams 
              like auto shops, restaurants, and blue-collar businesses that don't have time for complicated 
              software. Our platform connects with your existing phone system, captures missed calls, and 
              automatically sends personalized follow-up texts — so you never miss a chance to serve a customer.
            </p>
            
            <p>
              We believe technology should work for you, not get in your way. That's why SmartText AI is 
              intuitive, fast to set up, and always working in the background to keep your business moving.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Our Mission</h2>
            <p>
              Our mission is to help service-based businesses never miss another opportunity. We understand 
              that every missed call could be a potential customer, and in today's competitive market, 
              responding quickly can make all the difference.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Key Features</h2>
            <ul>
              <li>Automatic text responses for missed calls</li>
              <li>Industry-specific templates for personalized communication</li>
              <li>AI-powered responses that sound natural and helpful</li>
              <li>Simple lead management and tracking</li>
              <li>Integration with your existing phone system</li>
              <li>Easy setup with no technical expertise required</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Get Started Today</h2>
            <p>
              Ready to stop missing opportunities? Start your free trial today and see how SmartText AI 
              can transform your customer communication.
            </p>
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <Link href="/pricing" className="button" style={{
                backgroundColor: '#0070f3',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '5px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block'
              }}>
                View Pricing Plans
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© 2025 SmartText AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
