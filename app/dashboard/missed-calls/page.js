"use client";

import { useState } from "react";
import { useMissedCalls } from "@/lib/hooks/use-data";
import { useAuth } from "@/lib/auth/context";
import styles from "./missed-calls.module.css";

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return "Unknown";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Format time
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
  
  // Format date based on how recent it is
  if (diffDays === 0) {
    return `Today, ${timeString}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${timeString}`;
  } else if (diffDays < 7) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[date.getDay()]}, ${timeString}`;
  } else {
    return `${date.toLocaleDateString()}, ${timeString}`;
  }
}

// Helper function to format phone number
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return "Unknown";
  
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return original if not a standard format
  return phoneNumber;
}

// Helper function to format duration
function formatDuration(seconds) {
  if (!seconds) return "N/A";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds} sec`;
  } else {
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className={styles.loadingSkeleton}>
      <div className={styles.skeletonPulse}></div>
    </div>
  );
}

export default function MissedCallsPage() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const [filter, setFilter] = useState('all'); // 'all', 'with-text', 'without-text'
  
  // Fetch missed calls
  const { 
    missedCalls, 
    isLoading, 
    isError,
    mutate
  } = useMissedCalls({ days });
  
  // Filter missed calls
  const filteredCalls = missedCalls.filter(call => {
    if (filter === 'all') return true;
    if (filter === 'with-text') return call.autoTextSent;
    if (filter === 'without-text') return !call.autoTextSent;
    return true;
  });
  
  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };
  
  // Handle days change
  const handleDaysChange = (e) => {
    const newDays = parseInt(e.target.value, 10);
    setDays(newDays);
  };
  
  return (
    <div className={styles.missedCallsPage}>
      <h1 className={styles.pageTitle}>Missed Calls</h1>
      
      <div className={styles.controls}>
        <div className={styles.filters}>
          <button 
            className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All Calls
          </button>
          <button 
            className={`${styles.filterButton} ${filter === 'with-text' ? styles.active : ''}`}
            onClick={() => handleFilterChange('with-text')}
          >
            With Auto-Text
          </button>
          <button 
            className={`${styles.filterButton} ${filter === 'without-text' ? styles.active : ''}`}
            onClick={() => handleFilterChange('without-text')}
          >
            Without Auto-Text
          </button>
        </div>
        
        <div className={styles.daysFilter}>
          <label htmlFor="days-filter">Show calls from last:</label>
          <select 
            id="days-filter" 
            value={days} 
            onChange={handleDaysChange}
            className={styles.daysSelect}
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
      </div>
      
      <div className={styles.missedCallsContainer}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
          </div>
        ) : isError ? (
          <div className={styles.errorContainer}>
            <p>Error loading missed calls</p>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className={styles.emptyContainer}>
            <p>No missed calls found for the selected filters</p>
          </div>
        ) : (
          <table className={styles.missedCallsTable}>
            <thead>
              <tr>
                <th>Phone Number</th>
                <th>Date & Time</th>
                <th>Duration</th>
                <th>Auto-Text</th>
                <th>Auto-Text Time</th>
                <th>Business</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalls.map(call => (
                <tr key={call.id}>
                  <td>{formatPhoneNumber(call.phoneNumber)}</td>
                  <td>{formatDate(call.timestamp)}</td>
                  <td>{formatDuration(call.callDuration)}</td>
                  <td>
                    {call.autoTextSent ? (
                      <span className={styles.textSent}>Sent</span>
                    ) : (
                      <span className={styles.textNotSent}>Not Sent</span>
                    )}
                  </td>
                  <td>{call.autoTextSent ? formatDate(call.autoTextTimestamp) : 'N/A'}</td>
                  <td>{call.businessName || 'Unknown'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>Total Missed Calls</h3>
          <p className={styles.statValue}>{filteredCalls.length}</p>
        </div>
        
        <div className={styles.statCard}>
          <h3>Auto-Texts Sent</h3>
          <p className={styles.statValue}>
            {filteredCalls.filter(call => call.autoTextSent).length}
          </p>
        </div>
        
        <div className={styles.statCard}>
          <h3>Response Rate</h3>
          <p className={styles.statValue}>
            {filteredCalls.length > 0 
              ? `${Math.round((filteredCalls.filter(call => call.autoTextSent).length / filteredCalls.length) * 100)}%` 
              : '0%'}
          </p>
        </div>
      </div>
    </div>
  );
}
