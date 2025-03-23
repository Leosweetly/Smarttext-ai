'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './error.module.css';

export default function ErrorPage({ error, reset }) {
  // Log the error to console
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <h1 className={styles.errorTitle}>Something went wrong</h1>
        
        <p className={styles.errorMessage}>
          We're sorry, but something went wrong. Our team has been notified and is working to fix the issue.
        </p>
        
        <div className={styles.errorActions}>
          <button 
            onClick={() => reset()}
            className={styles.resetButton}
          >
            Try again
          </button>
          
          <Link href="/" className={styles.homeLink}>
            Go to homepage
          </Link>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className={styles.errorDetails}>
            <h2>Error Details (Development Only)</h2>
            <p className={styles.errorName}>{error.name}: {error.message}</p>
            {error.stack && (
              <pre className={styles.errorStack}>
                {error.stack}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
