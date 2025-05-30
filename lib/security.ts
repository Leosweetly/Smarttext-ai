/**
 * Core Security Utilities for SmartText AI
 * 
 * Provides input sanitization, validation, and security helpers
 * optimized for Vercel deployment with environment-aware features.
 */

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const enableSecurityLogging = process.env.ENABLE_SECURITY_LOGS === 'true' || !isProduction;
const enableDebugMode = process.env.DEBUG_SECURITY === 'true' && !isProduction;

// Security event types
export type SecurityEventType = 
  | 'input_sanitization'
  | 'validation_failure' 
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'attack_detected'
  | 'auth_failure'
  | 'api_request'
  | 'form_submission'
  | 'security_alert';

export interface SecurityEvent {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
}

/**
 * Enhanced input sanitization with security logging
 */
export function sanitizeInput(input: string, options: {
  maxLength?: number;
  allowHtml?: boolean;
  fieldName?: string;
  logSanitization?: boolean;
} = {}): string {
  if (typeof input !== 'string') {
    logSecurityEvent('input_sanitization', 'low', 'Non-string input received', {
      inputType: typeof input,
      fieldName: options.fieldName
    });
    return '';
  }

  const originalInput = input;
  const maxLength = options.maxLength || 500;
  
  // Basic sanitization
  let sanitized = input.trim();
  
  if (!options.allowHtml) {
    // Remove potential HTML tags and dangerous content
    sanitized = sanitized
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/script/gi, '') // Remove script references
      .replace(/eval\(/gi, '') // Remove eval calls
      .replace(/expression\(/gi, '') // Remove CSS expressions
      .replace(/vbscript:/gi, '') // Remove vbscript protocol
      .replace(/data:/gi, ''); // Remove data URLs
  }
  
  // Length limiting
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Log if sanitization occurred
  if ((options.logSanitization !== false) && sanitized !== originalInput && enableSecurityLogging) {
    logSecurityEvent('input_sanitization', 'low', 'Input sanitized', {
      fieldName: options.fieldName,
      originalLength: originalInput.length,
      sanitizedLength: sanitized.length,
      hadHtml: originalInput !== originalInput.replace(/[<>]/g, ''),
      hadScript: /script|javascript:|eval\(|vbscript:/i.test(originalInput)
    });
  }

  return sanitized;
}

/**
 * Enhanced email validation with security checks
 */
export function validateEmail(email: string): { isValid: boolean; reason?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, reason: 'Email is required and must be a string' };
  }

  const sanitized = sanitizeInput(email, { maxLength: 254, fieldName: 'email' });
  
  // Basic format validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, reason: 'Invalid email format' };
  }

  // Additional security checks
  const suspiciousPatterns = [
    /\+.*\+/, // Multiple plus signs
    /\.{2,}/, // Multiple consecutive dots
    /@.*@/, // Multiple @ symbols
    /[<>]/, // HTML brackets (should be caught by sanitization)
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      logSecurityEvent('validation_failure', 'medium', 'Suspicious email pattern detected', {
        email: sanitized,
        pattern: pattern.toString()
      });
      return { isValid: false, reason: 'Email contains suspicious patterns' };
    }
  }

  return { isValid: true };
}

/**
 * Phone number validation with security checks
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; cleaned?: string; reason?: string } {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, reason: 'Phone number is required and must be a string' };
  }

  const sanitized = sanitizeInput(phone, { fieldName: 'phone' });
  const cleaned = sanitized.replace(/\D/g, '');

  // Check for suspicious patterns
  if (cleaned.length < 10 || cleaned.length > 15) {
    return { isValid: false, reason: 'Phone number must be 10-15 digits' };
  }

  // Check for obviously fake numbers
  const suspiciousPatterns = [
    /^0+$/, // All zeros
    /^1+$/, // All ones
    /^(123){3,}/, // Repeating 123
    /^1234567890$/, // Sequential
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(cleaned)) {
      logSecurityEvent('validation_failure', 'medium', 'Suspicious phone pattern detected', {
        phone: cleaned,
        pattern: pattern.toString()
      });
      return { isValid: false, reason: 'Phone number appears to be fake' };
    }
  }

  return { isValid: true, cleaned };
}

/**
 * Detect potential attack patterns in request data
 */
export function detectAttackPatterns(data: any, context: string = 'unknown'): SecurityEvent[] {
  const events: SecurityEvent[] = [];
  
  if (!data) return events;

  const dataString = JSON.stringify(data).toLowerCase();
  
  // SQL Injection patterns
  const sqlPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+set/i,
    /exec\s*\(/i,
    /script\s*>/i,
  ];

  // XSS patterns
  const xssPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
  ];

  // Check SQL injection
  for (const pattern of sqlPatterns) {
    if (pattern.test(dataString)) {
      events.push({
        type: 'attack_detected',
        severity: 'high',
        message: 'Potential SQL injection detected',
        metadata: {
          context,
          pattern: pattern.toString(),
          dataPreview: dataString.substring(0, 100)
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Check XSS
  for (const pattern of xssPatterns) {
    if (pattern.test(dataString)) {
      events.push({
        type: 'attack_detected',
        severity: 'high',
        message: 'Potential XSS attack detected',
        metadata: {
          context,
          pattern: pattern.toString(),
          dataPreview: dataString.substring(0, 100)
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  return events;
}

/**
 * Security headers for API responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Robots-Tag': 'noindex, nofollow',
  };
}

/**
 * Extract client information from request for security logging
 */
export function extractClientInfo(request: any): { ip?: string; userAgent?: string; endpoint?: string } {
  const ip = request.headers?.get?.('x-forwarded-for') || 
             request.headers?.get?.('x-real-ip') || 
             request.connection?.remoteAddress ||
             request.socket?.remoteAddress ||
             'unknown';

  const userAgent = request.headers?.get?.('user-agent') || 'unknown';
  const endpoint = request.url || request.nextUrl?.pathname || 'unknown';

  return { ip, userAgent, endpoint };
}

/**
 * Log security events with environment awareness
 */
export function logSecurityEvent(
  type: SecurityEventType, 
  severity: 'low' | 'medium' | 'high' | 'critical',
  message: string, 
  metadata: Record<string, any> = {},
  request?: any
): void {
  if (!enableSecurityLogging && severity === 'low') {
    return; // Skip low-severity logs in production unless explicitly enabled
  }

  const event: SecurityEvent = {
    type,
    severity,
    message,
    metadata,
    timestamp: new Date().toISOString(),
    ...extractClientInfo(request || {})
  };

  // Always log high/critical events
  if (severity === 'high' || severity === 'critical') {
    console.error('🚨 SECURITY EVENT:', JSON.stringify(event, null, 2));
  } else if (enableDebugMode || !isProduction) {
    console.log(`🔒 Security [${severity}]:`, message, metadata);
  }

  // In production, you might want to send to external logging service
  if (isProduction && (severity === 'high' || severity === 'critical')) {
    // TODO: Integrate with external alerting (Slack, email, etc.)
    // sendSecurityAlert(event);
  }
}

/**
 * Validate request origin for CSRF protection (future use)
 */
export function validateOrigin(request: any, allowedOrigins: string[] = []): boolean {
  const origin = request.headers?.get?.('origin');
  const referer = request.headers?.get?.('referer');
  
  if (!origin && !referer) {
    logSecurityEvent('suspicious_activity', 'medium', 'Request missing origin and referer headers');
    return false;
  }

  const defaultAllowed = [
    'https://www.getsmarttext.com',
    'https://api.getsmarttext.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3004'
  ];

  const allowed = [...defaultAllowed, ...allowedOrigins];
  
  if (origin && !allowed.some(allowed => origin.startsWith(allowed))) {
    logSecurityEvent('suspicious_activity', 'high', 'Request from unauthorized origin', { origin });
    return false;
  }

  return true;
}

/**
 * Generate honeypot field for bot detection
 */
export function generateHoneypot(): { fieldName: string; expectedValue: string } {
  const fieldNames = ['website', 'url', 'homepage', 'company_site', 'business_url'];
  const fieldName = fieldNames[Math.floor(Math.random() * fieldNames.length)];
  
  return {
    fieldName: `_${fieldName}_${Date.now()}`,
    expectedValue: '' // Bots often fill this, humans should leave empty
  };
}

/**
 * Check honeypot field for bot detection
 */
export function checkHoneypot(formData: any, honeypotField: string): boolean {
  const honeypotValue = formData[honeypotField];
  
  if (honeypotValue && honeypotValue.trim() !== '') {
    logSecurityEvent('attack_detected', 'medium', 'Honeypot field filled - potential bot detected', {
      honeypotField,
      honeypotValue: honeypotValue.substring(0, 50)
    });
    return false; // Bot detected
  }
  
  return true; // Likely human
}

export default {
  sanitizeInput,
  validateEmail,
  validatePhoneNumber,
  detectAttackPatterns,
  getSecurityHeaders,
  extractClientInfo,
  logSecurityEvent,
  validateOrigin,
  generateHoneypot,
  checkHoneypot
};
