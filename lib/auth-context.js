'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { setUser as setSentryUser, clearUser as clearSentryUser } from '@/lib/sentry';
import { trackEvent } from '@/app/components/Analytics';

// Create the authentication context
const AuthContext = createContext({
  user: null,
  isLoading: true,
  error: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

// Provider component that wraps the app and makes auth available to any child component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the user on initial load
  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/auth/me');
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          
          // Set user in Sentry for error tracking
          setSentryUser(data.user);
          
          // Track login event in analytics
          trackEvent('user_authenticated', 'authentication', 'User authenticated');
          
          setError(null);
        } else {
          setUser(null);
          
          // Clear user in Sentry
          clearSentryUser();
          
          // Don't set error for 401 responses, as they're expected for unauthenticated users
          if (res.status !== 401) {
            const errorData = await res.json();
            setError(errorData.error || 'Failed to fetch user');
          }
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to fetch user');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
    
    // Cleanup function
    return () => {
      clearSentryUser();
    };
  }, []);

  // Login function
  const login = (returnTo = '/dashboard') => {
    // Track login attempt in analytics
    trackEvent('login_attempt', 'authentication', 'User attempted to log in');
    
    window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  };

  // Logout function
  const logout = (returnTo = '/') => {
    // Track logout in analytics
    trackEvent('logout', 'authentication', 'User logged out');
    
    // Clear user in Sentry
    clearSentryUser();
    
    window.location.href = `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`;
  };

  // Determine if the user is authenticated
  const isAuthenticated = !!user;

  // Create the value object that will be provided to consumers
  const value = {
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
