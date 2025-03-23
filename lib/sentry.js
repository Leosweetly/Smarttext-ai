import * as Sentry from '@sentry/nextjs';

// Initialize Sentry
// This should be called as early as possible in your application
export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1.0,
      // Set environment based on NODE_ENV
      environment: process.env.NODE_ENV,
    });
  }
}

// Helper function to capture exceptions
export function captureException(error, context) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    // Log to console in development
    console.error('Error captured by Sentry:', error, context);
  }
}

// Helper function to capture messages
export function captureMessage(message, level = 'info', context) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    // Log to console in development
    console.log(`[${level}] Message captured by Sentry:`, message, context);
  }
}

// Helper function to set user information
export function setUser(user) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && user) {
    Sentry.setUser({
      id: user.sub || user.id,
      email: user.email,
      username: user.name || user.email,
    });
  }
}

// Helper function to clear user information
export function clearUser() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

// Initialize Sentry if we're in the browser
if (typeof window !== 'undefined') {
  initSentry();
}

export default Sentry;
