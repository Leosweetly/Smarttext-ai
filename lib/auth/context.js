'use client';

import { useUser } from '@auth0/nextjs-auth0';
import { setUser as setSentryUser, clearUser as clearSentryUser } from '@/lib/utils/sentry';
import { trackEvent } from '@/app/components/Analytics';

// Custom hook to use Auth0 authentication
export function useAuth() {
  const { user, error, isLoading } = useUser();
  
  // Set user in Sentry for error tracking if user exists
  if (user && !isLoading) {
    setSentryUser(user);
    // Track login event in analytics
    trackEvent('user_authenticated', 'authentication', 'User authenticated');
  }
  
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

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated,
  };
}
