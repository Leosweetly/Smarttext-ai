// Re-export Sentry functionality
export {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  default as Sentry
} from './sentry';

// Re-export error handling functionality
export {
  logError,
  formatErrorMessage,
  handleApiError,
  handleTwilioError,
  handleAirtableError,
  handleAuth0Error
} from './error-handler';

/**
 * Format a phone number to E.164 format
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} The formatted phone number
 */
export function formatPhoneNumberE164(phoneNumber) {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid US number
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`;
  }
  
  // If it already has a plus sign, return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  // Default case, just add a plus sign
  return `+${digits}`;
}

/**
 * Format a phone number for display
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} The formatted phone number
 */
export function formatPhoneNumberForDisplay(phoneNumber) {
  if (!phoneNumber) return 'Unknown';
  
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

/**
 * Format a date for display
 * @param {string|Date} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} The formatted date
 */
export function formatDate(date, options = {}) {
  if (!date) return 'Unknown';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now - dateObj;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Format time
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
  
  // Format date based on how recent it is
  if (options.timeOnly) {
    return timeString;
  } else if (diffDays === 0) {
    return `Today, ${timeString}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${timeString}`;
  } else if (diffDays < 7) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[dateObj.getDay()]}, ${timeString}`;
  } else {
    return `${dateObj.toLocaleDateString()}, ${timeString}`;
  }
}
