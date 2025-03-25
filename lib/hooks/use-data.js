'use client';

import useSWR from 'swr';
import { useToast } from '@/app/components/Toast';

// Fetcher function for SWR
const fetcher = async (url) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.info = await response.json();
    error.status = response.status;
    throw error;
  }
  
  return response.json();
};

/**
 * Hook for fetching missed calls
 * @param {Object} options - Options for the hook
 * @param {number} options.days - Number of days to fetch missed calls for
 * @param {number} options.limit - Maximum number of missed calls to fetch
 * @returns {Object} The hook result
 */
export function useMissedCalls({ days = 7, limit = 50 } = {}) {
  const { data, error, mutate, isLoading, isValidating } = useSWR(
    `/api/missed-calls?days=${days}&limit=${limit}`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // Refresh every minute
      dedupingInterval: 5000, // Deduplicate requests within 5 seconds
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Only retry up to 3 times
        if (retryCount >= 3) return;
        
        // Retry after 5 seconds
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    }
  );
  
  return {
    missedCalls: data?.missedCalls || [],
    isLoading,
    isError: error,
    mutate,
    isValidating,
  };
}

/**
 * Hook for fetching conversations
 * @param {Object} options - Options for the hook
 * @param {number} options.limit - Maximum number of conversations to fetch
 * @returns {Object} The hook result
 */
export function useConversations({ limit = 50 } = {}) {
  const { data, error, mutate, isLoading, isValidating } = useSWR(
    `/api/conversations?limit=${limit}`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
      dedupingInterval: 5000, // Deduplicate requests within 5 seconds
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Only retry up to 3 times
        if (retryCount >= 3) return;
        
        // Retry after 5 seconds
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    }
  );
  
  return {
    conversations: data?.conversations || [],
    isLoading,
    isError: error,
    mutate,
    isValidating,
  };
}

/**
 * Hook for fetching messages for a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Object} The hook result
 */
export function useMessages(conversationId) {
  const { data, error, mutate, isLoading, isValidating } = useSWR(
    conversationId ? `/api/conversations/messages?conversationId=${conversationId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 10000, // Refresh every 10 seconds
      dedupingInterval: 2000, // Deduplicate requests within 2 seconds
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Only retry up to 3 times
        if (retryCount >= 3) return;
        
        // Retry after 5 seconds
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    }
  );
  
  return {
    messages: data?.messages || [],
    isLoading,
    isError: error,
    mutate,
    isValidating,
  };
}

/**
 * Hook for fetching Twilio phone numbers
 * @returns {Object} The hook result
 */
export function useTwilioNumbers() {
  const toast = useToast();
  const { data, error, mutate, isLoading, isValidating } = useSWR(
    '/api/twilio/numbers',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0, // Don't auto-refresh
      dedupingInterval: 10000, // Deduplicate requests within 10 seconds
      onError: (err) => {
        console.error('[API] Error fetching Twilio numbers:', err);
        toast.error('Failed to fetch Twilio phone numbers');
      },
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Only retry up to 2 times
        if (retryCount >= 2) return;
        
        // Retry after 5 seconds
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    }
  );
  
  return {
    phoneNumbers: data?.phoneNumbers || [],
    isLoading,
    isError: error,
    mutate,
    isValidating,
  };
}

/**
 * Function to save Twilio phone number selection
 * @param {string} phoneNumber - The selected phone number
 * @returns {Promise<Object>} The result of saving the phone number
 */
export async function saveTwilioNumber(phoneNumber) {
  try {
    const response = await fetch('/api/twilio/configure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save Twilio number');
    }
    
    return response.json();
  } catch (error) {
    console.error('[API] Error saving Twilio number:', error);
    throw error;
  }
}

/**
 * Function to send a message
 * @param {Object} messageData - The message data
 * @param {string} messageData.conversationId - The conversation ID
 * @param {string} messageData.message - The message text
 * @param {string} messageData.toPhone - The phone number to send the message to (if no conversationId)
 * @returns {Promise<Object>} The result of sending the message
 */
export async function sendMessage({ conversationId, message, toPhone }) {
  try {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversationId, message, toPhone }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }
    
    return response.json();
  } catch (error) {
    console.error('[API] Error sending message:', error);
    throw error;
  }
}
