"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./CookieConsent.module.css";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  
  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem("cookieConsent");
    if (!hasConsented) {
      setShowBanner(true);
    }
  }, []);
  
  const handleAccept = () => {
    // Store consent in localStorage
    localStorage.setItem("cookieConsent", "true");
    setShowBanner(false);
    
    // Here you would initialize analytics, etc.
    // For example: initializeAnalytics();
  };
  
  const handleDecline = () => {
    // Store decline in localStorage
    localStorage.setItem("cookieConsent", "false");
    setShowBanner(false);
    
    // Here you would disable non-essential cookies
    // For example: disableAnalytics();
  };
  
  if (!showBanner) {
    return null;
  }
  
  return (
    <div className={styles.cookieBanner}>
      <div className={styles.cookieContent}>
        <h3 className={styles.cookieTitle}>Cookie Consent</h3>
        <p className={styles.cookieText}>
          We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. Read our{" "}
          <Link href="/privacy" className={styles.cookieLink}>
            Privacy Policy
          </Link>{" "}
          to learn more.
        </p>
        <div className={styles.cookieButtons}>
          <button 
            className={styles.declineButton}
            onClick={handleDecline}
          >
            Decline
          </button>
          <button 
            className={styles.acceptButton}
            onClick={handleAccept}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
