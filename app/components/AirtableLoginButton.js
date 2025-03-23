'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * A button component that initiates the Airtable OAuth flow
 * This is a client component that redirects the user to the Airtable authorization page
 */
export default function AirtableLoginButton({ className = '', children }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleLogin = () => {
    setIsLoading(true);
    router.push('/api/auth/airtable/authorize');
  };
  
  return (
    <button 
      onClick={handleLogin}
      disabled={isLoading}
      className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 ${className}`}
    >
      {isLoading ? 'Connecting...' : children || 'Connect to Airtable'}
    </button>
  );
}
