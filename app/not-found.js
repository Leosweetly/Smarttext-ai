import Link from 'next/link';
import styles from './error.module.css';

export default function NotFound() {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <h1 className={styles.errorTitle}>404 - Page Not Found</h1>
        
        <p className={styles.errorMessage}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className={styles.errorActions}>
          <Link href="/" className={styles.resetButton}>
            Go to homepage
          </Link>
          
          <Link href="/dashboard" className={styles.homeLink}>
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
