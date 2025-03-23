"use client";

import { useState, useEffect } from "react";
import styles from "./TwilioConnectionStatus.module.css";

export default function TwilioConnectionStatus({ phoneNumber }) {
  const [status, setStatus] = useState("loading");
  const [details, setDetails] = useState(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (phoneNumber) {
      checkStatus();
    } else {
      setStatus("not_configured");
      setDetails(null);
    }
  }, [phoneNumber]);

  const checkStatus = async () => {
    if (!phoneNumber) {
      setStatus("not_configured");
      setDetails(null);
      return;
    }

    setStatus("loading");
    try {
      const response = await fetch("/api/twilio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status.isConfigured ? "configured" : "not_configured");
        setDetails(data.status);
        setError(null);
      } else {
        setStatus("error");
        setError(data.error || "Failed to check Twilio status");
      }
    } catch (error) {
      setStatus("error");
      setError(error.message || "An error occurred while checking Twilio status");
    }
  };

  const configureTwilio = async () => {
    if (!phoneNumber) {
      return;
    }

    setIsConfiguring(true);
    try {
      const response = await fetch("/api/twilio/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus("configured");
        setDetails(data.result);
        setError(null);
      } else {
        setStatus("error");
        setError(data.error || "Failed to configure Twilio");
      }
    } catch (error) {
      setStatus("error");
      setError(error.message || "An error occurred while configuring Twilio");
    } finally {
      setIsConfiguring(false);
    }
  };

  const testConfiguration = async () => {
    if (!phoneNumber) {
      return;
    }

    setStatus("loading");
    try {
      const response = await fetch("/api/twilio/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.isValid ? "configured" : "not_configured");
        setDetails(data.status);
        setError(null);
      } else {
        setStatus("error");
        setError(data.error || "Failed to test Twilio configuration");
      }
    } catch (error) {
      setStatus("error");
      setError(error.message || "An error occurred while testing Twilio configuration");
    }
  };

  return (
    <div className={styles.container}>
      {status === "loading" && (
        <div className={styles.loading}>Checking Twilio configuration...</div>
      )}
      
      {status === "not_configured" && (
        <div className={styles.notConfigured}>
          <p>
            {!phoneNumber 
              ? "Please enter a phone number to configure Twilio." 
              : "Your Twilio number is not properly configured for missed call handling."}
          </p>
          {phoneNumber && (
            <button 
              className={styles.configureButton}
              onClick={configureTwilio}
              disabled={isConfiguring || !phoneNumber}
            >
              {isConfiguring ? "Configuring..." : "Configure Now"}
            </button>
          )}
        </div>
      )}
      
      {status === "configured" && (
        <div className={styles.configured}>
          <p>✅ Your Twilio number is properly configured!</p>
          {details && (
            <div className={styles.details}>
              <p><strong>Phone Number:</strong> {details.phoneNumber}</p>
              {details.voiceUrl && <p><strong>Voice URL:</strong> {details.voiceUrl}</p>}
              {details.statusCallback && <p><strong>Status Callback:</strong> {details.statusCallback}</p>}
              {details.friendlyName && <p><strong>Friendly Name:</strong> {details.friendlyName}</p>}
            </div>
          )}
          <button 
            className={styles.testButton}
            onClick={testConfiguration}
          >
            Test Configuration
          </button>
        </div>
      )}
      
      {status === "error" && (
        <div className={styles.error}>
          <p>There was an error with your Twilio configuration:</p>
          {error && <p className={styles.details}>{error}</p>}
          <button 
            className={styles.retryButton}
            onClick={checkStatus}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
