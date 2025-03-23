"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState(null);
  
  // Check for error parameter in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'callback_error':
          setError('There was a problem logging in. Please try again.');
          break;
        case 'unauthorized':
          setError('You need to log in to access that page.');
          break;
        default:
          setError('An error occurred. Please try again.');
      }
    }
  }, [searchParams]);
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Handle login button click
  const handleLogin = () => {
    // Get the returnTo parameter from URL or default to dashboard
    const returnTo = searchParams.get('returnTo') || '/dashboard';
    login(returnTo);
  };
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginContainer}>
          <div className={styles.loadingSpinner}>Loading...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            SmartText AI
          </Link>
          <h1 className={styles.title}>Log in to your account</h1>
        </div>
        
        {error && (
          <div className={styles.errorAlert}>
            {error}
          </div>
        )}
        
        <div className={styles.loginOptions}>
          <button 
            onClick={handleLogin}
            className={styles.loginButton}
          >
            Continue with Auth0
          </button>
          
          <div className={styles.divider}>
            <span>OR</span>
          </div>
          
          <button 
            onClick={() => login('/dashboard')}
            className={styles.googleButton}
          >
            Continue with Google
          </button>
          
          <button 
            onClick={() => login('/dashboard')}
            className={styles.microsoftButton}
          >
            Continue with Microsoft
          </button>
        </div>
        
        <div className={styles.signupLink}>
          Don't have an account? <Link href="/signup">Sign up</Link>
        </div>
        
        <div className={styles.termsText}>
          By logging in, you agree to our <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.
        </div>
      </div>
    </div>
  );
}
