'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
// TODO: Re-enable this import when the auth-context module is implemented
// import { useAuth } from '@/lib/auth-context';
import styles from './Navigation.module.css';
import { useEffect, useState } from 'react';

// TODO: Remove this mock when the auth-context module is implemented
const useAuth = () => {
  return {
    isAuthenticated: false,
    isLoading: false,
    logout: (redirectTo) => {
      console.log('Mock logout called, would redirect to:', redirectTo);
      // In a real implementation, this would log the user out
    }
  };
};

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [isClient, setIsClient] = useState(false);

  // Fix for hydration issues - ensure we're running on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle navigation manually to ensure it works
  const handleNavigation = (e, path) => {
    e.preventDefault();
    console.log('Navigating to:', path);
    router.push(path);
  };

  // Handle logout with confirmation
  const handleLogout = (e) => {
    e.preventDefault();
    console.log('Logging out');
    logout('/');
  };

  return (
    <>
      <nav className={styles.navigation}>
        <div className={styles.logo}>
          <a href="/" onClick={(e) => handleNavigation(e, '/')} className={styles.logoLink}>
            <span className={styles.logoText}>SmartText AI</span>
          </a>
        </div>
        <div className={styles.links}>
          <a 
            href="/" 
            onClick={(e) => handleNavigation(e, '/')} 
            className={pathname === '/' ? styles.active : ''}
          >
            Home
          </a>
          <a 
            href="/about" 
            onClick={(e) => handleNavigation(e, '/about')} 
            className={pathname === '/about' ? styles.active : ''}
          >
            About
          </a>
          <a 
            href="/pricing" 
            onClick={(e) => handleNavigation(e, '/pricing')} 
            className={pathname === '/pricing' ? styles.active : ''}
          >
            Pricing
          </a>
          <a 
            href="/demo" 
            onClick={(e) => handleNavigation(e, '/demo')} 
            className={pathname === '/demo' ? styles.active : ''}
          >
            Demo
          </a>
          {isClient && isAuthenticated && (
            <a 
              href="/dashboard" 
              onClick={(e) => handleNavigation(e, '/dashboard')} 
              className={pathname.startsWith('/dashboard') ? styles.active : ''}
            >
              Dashboard
            </a>
          )}
        </div>
        <div className={styles.auth}>
          {isLoading ? (
            <span className={styles.loadingAuth}>Loading...</span>
          ) : isAuthenticated ? (
            <>
              <a 
                href="/dashboard/settings" 
                onClick={(e) => handleNavigation(e, '/dashboard/settings')} 
                className={styles.loginButton}
              >
                Account
              </a>
              <button onClick={handleLogout} className={styles.signupButton}>
                Logout
              </button>
            </>
          ) : (
            <>
              <a 
                href="/login" 
                onClick={(e) => handleNavigation(e, '/login')} 
                className={styles.loginButton}
              >
                Login
              </a>
              <a 
                href="/signup" 
                onClick={(e) => handleNavigation(e, '/signup')} 
                className={styles.signupButton}
              >
                Sign Up
              </a>
            </>
          )}
        </div>
      </nav>
      
      {/* Footer with legal links */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <a 
            href="/terms" 
            onClick={(e) => handleNavigation(e, '/terms')} 
            className={pathname === '/terms' ? styles.active : ''}
          >
            Terms of Service
          </a>
          <a 
            href="/privacy" 
            onClick={(e) => handleNavigation(e, '/privacy')} 
            className={pathname === '/privacy' ? styles.active : ''}
          >
            Privacy Policy
          </a>
          <a 
            href="/about" 
            onClick={(e) => handleNavigation(e, '/about')} 
            className={pathname === '/about' ? styles.active : ''}
          >
            About Us
          </a>
        </div>
        <div className={styles.copyright}>
          © {new Date().getFullYear()} SmartText AI. All rights reserved.
        </div>
      </footer>
    </>
  );
}
