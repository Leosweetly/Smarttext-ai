'use client';

import { useState, useEffect } from 'react';
import { useTwilioNumbers, saveTwilioNumber } from '@/lib/hooks/use-data';
import { useToast } from '@/app/components/Toast';
import styles from './TwilioNumberSelector.module.css';

/**
 * TwilioNumberSelector component
 * @param {Object} props - Component props
 * @param {string} props.currentNumber - The currently selected phone number
 * @param {Function} props.onNumberSelected - Callback when a number is selected
 * @param {boolean} props.disabled - Whether the selector is disabled
 * @returns {JSX.Element} The component
 */
export default function TwilioNumberSelector({ currentNumber, onNumberSelected, disabled = false }) {
  const toast = useToast();
  const { phoneNumbers, isLoading, isError, mutate } = useTwilioNumbers();
  const [selectedNumber, setSelectedNumber] = useState(currentNumber || '');
  const [isSaving, setIsSaving] = useState(false);

  // Update selected number when currentNumber changes
  useEffect(() => {
    if (currentNumber && currentNumber !== selectedNumber) {
      setSelectedNumber(currentNumber);
    }
  }, [currentNumber]);

  // Handle number selection
  const handleNumberChange = (e) => {
    setSelectedNumber(e.target.value);
  };

  // Handle save button click
  const handleSave = async () => {
    if (!selectedNumber) {
      toast.warning('Please select a phone number');
      return;
    }

    try {
      setIsSaving(true);
      const result = await saveTwilioNumber(selectedNumber);
      
      if (result.success) {
        toast.success('Phone number saved successfully');
        if (onNumberSelected) {
          onNumberSelected(selectedNumber);
        }
      } else {
        toast.error(result.error || 'Failed to save phone number');
      }
    } catch (error) {
      console.error('Error saving phone number:', error);
      toast.error('Failed to save phone number: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    
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
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={styles.loading}>
        Loading Twilio phone numbers...
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className={styles.error}>
        <p>Error loading Twilio phone numbers.</p>
        <button 
          className={styles.retryButton}
          onClick={() => mutate()}
        >
          Retry
        </button>
      </div>
    );
  }

  // Render empty state
  if (phoneNumbers.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No Twilio phone numbers found in your account.</p>
        <p className={styles.helpText}>
          You need to purchase a phone number in your Twilio account before you can use this feature.
        </p>
      </div>
    );
  }

  // Render selector
  return (
    <div className={styles.container}>
      <div className={styles.selectorContainer}>
        <select
          className={styles.selector}
          value={selectedNumber}
          onChange={handleNumberChange}
          disabled={disabled || isSaving}
        >
          <option value="">Select a phone number</option>
          {phoneNumbers.map((number) => (
            <option key={number.sid} value={number.phoneNumber}>
              {formatPhoneNumber(number.phoneNumber)} 
              {number.friendlyName ? ` - ${number.friendlyName}` : ''}
              {number.isConfigured ? ' (Configured)' : ''}
            </option>
          ))}
        </select>
        
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={disabled || isSaving || !selectedNumber || selectedNumber === currentNumber}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
      
      <p className={styles.helpText}>
        Select a phone number from your Twilio account to use for missed call auto-texting.
        {selectedNumber && !phoneNumbers.find(n => n.phoneNumber === selectedNumber)?.isConfigured && (
          ' This number will be configured for SmartText AI when you save.'
        )}
      </p>
    </div>
  );
}
