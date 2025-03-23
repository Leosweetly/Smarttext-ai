'use client';

import { useState, useEffect } from 'react';
import AirtableLoginButton from './AirtableLoginButton';

/**
 * Component to display the Airtable connection status and provide connection options
 * This component checks if the user is connected to Airtable and shows appropriate UI
 */
export default function AirtableConnectionStatus() {
  const [connectionStatus, setConnectionStatus] = useState('loading');
  const [error, setError] = useState(null);
  
  // Check if the user is connected to Airtable
  useEffect(() => {
    async function checkConnection() {
      try {
        const response = await fetch('/api/auth/airtable/status');
        
        if (!response.ok) {
          throw new Error('Failed to check Airtable connection status');
        }
        
        const data = await response.json();
        setConnectionStatus(data.connected ? 'connected' : 'disconnected');
      } catch (error) {
        console.error('Error checking Airtable connection:', error);
        setConnectionStatus('error');
        setError(error.message);
      }
    }
    
    checkConnection();
  }, []);
  
  // Handle disconnecting from Airtable
  const handleDisconnect = async () => {
    try {
      setConnectionStatus('loading');
      
      const response = await fetch('/api/auth/airtable/disconnect', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect from Airtable');
      }
      
      setConnectionStatus('disconnected');
    } catch (error) {
      console.error('Error disconnecting from Airtable:', error);
      setConnectionStatus('error');
      setError(error.message);
    }
  };
  
  // Render based on connection status
  if (connectionStatus === 'loading') {
    return (
      <div className="p-4 border rounded bg-gray-50">
        <p className="text-gray-600">Checking Airtable connection...</p>
      </div>
    );
  }
  
  if (connectionStatus === 'error') {
    return (
      <div className="p-4 border rounded bg-red-50">
        <h3 className="font-semibold text-red-700">Connection Error</h3>
        <p className="text-red-600">{error || 'Failed to check Airtable connection'}</p>
        <AirtableLoginButton className="mt-3">
          Try Connecting Again
        </AirtableLoginButton>
      </div>
    );
  }
  
  if (connectionStatus === 'connected') {
    return (
      <div className="p-4 border rounded bg-green-50">
        <h3 className="font-semibold text-green-700">Connected to Airtable</h3>
        <p className="text-green-600">Your application is successfully connected to Airtable.</p>
        <button
          onClick={handleDisconnect}
          className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Disconnect from Airtable
        </button>
      </div>
    );
  }
  
  // Default: disconnected
  return (
    <div className="p-4 border rounded bg-yellow-50">
      <h3 className="font-semibold text-yellow-700">Not Connected to Airtable</h3>
      <p className="text-yellow-600">
        Your application needs to connect to Airtable to access your business data.
      </p>
      <AirtableLoginButton className="mt-3">
        Connect to Airtable
      </AirtableLoginButton>
    </div>
  );
}
