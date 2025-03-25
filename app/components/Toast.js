'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import styles from './Toast.module.css';

// Create a context for the toast
const ToastContext = createContext();

/**
 * Toast provider component
 * @param {Object} props - The component props
 * @param {React.ReactNode} props.children - The child components
 * @returns {JSX.Element} The toast provider component
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  // Add a new toast
  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
    return id;
  };
  
  // Remove a toast by ID
  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };
  
  // Shorthand functions for different toast types
  const success = (message, duration) => addToast(message, 'success', duration);
  const error = (message, duration) => addToast(message, 'error', duration);
  const info = (message, duration) => addToast(message, 'info', duration);
  const warning = (message, duration) => addToast(message, 'warning', duration);
  
  // Context value
  const contextValue = {
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };
  
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Toast component
 * @param {Object} props - The component props
 * @param {string} props.id - The toast ID
 * @param {string} props.message - The toast message
 * @param {string} props.type - The toast type (success, error, info, warning)
 * @param {number} props.duration - The toast duration in milliseconds
 * @param {Function} props.onClose - The function to call when the toast is closed
 * @returns {JSX.Element} The toast component
 */
function Toast({ id, message, type, duration, onClose }) {
  const [visible, setVisible] = useState(true);
  
  // Auto-close the toast after the specified duration
  useEffect(() => {
    if (duration === 0) return; // Don't auto-close if duration is 0
    
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for the fade-out animation to complete
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  // Get the icon based on the toast type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };
  
  return (
    <div
      className={`${styles.toast} ${styles[type]} ${visible ? styles.visible : styles.hidden}`}
      role="alert"
    >
      <div className={styles.icon}>{getIcon()}</div>
      <div className={styles.message}>{message}</div>
      <button className={styles.closeButton} onClick={() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for the fade-out animation to complete
      }}>
        ×
      </button>
    </div>
  );
}

/**
 * Hook to use the toast context
 * @returns {Object} The toast context
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
