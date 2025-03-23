// Re-export Sentry functionality
export {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  default as Sentry
} from './sentry';
