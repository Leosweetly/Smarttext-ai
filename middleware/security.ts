/**
 * Extensible Security Middleware for SmartText AI
 * 
 * Provides a unified security layer that integrates rate limiting,
 * input validation, attack detection, and audit logging.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getSecurityHeaders, 
  detectAttackPatterns, 
  logSecurityEvent,
  extractClientInfo,
  validateOrigin 
} from '../lib/security';
import { 
  checkRateLimit, 
  RateLimitPresets, 
  createRateLimitMiddleware,
  createEndpointRateLimit,
  RateLimitConfig 
} from '../lib/rate-limiting';
import { logAuditEvent } from '../lib/audit';

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const enableDebugMode = process.env.DEBUG_SECURITY_MIDDLEWARE === 'true' && !isProduction;

// Security middleware configuration
export interface SecurityMiddlewareConfig {
  rateLimit?: RateLimitConfig | keyof typeof RateLimitPresets;
  validateOrigin?: boolean;
  detectAttacks?: boolean;
  auditRequests?: boolean;
  requireAuth?: boolean;
  allowedMethods?: string[];
  skipPaths?: string[];
  customHeaders?: Record<string, string>;
}

// Security check result
export interface SecurityCheckResult {
  allowed: boolean;
  status?: number;
  headers?: Record<string, string>;
  body?: any;
  reason?: string;
}

/**
 * Core security middleware that can be applied to any API route
 */
export async function applySecurity(
  request: NextRequest,
  config: SecurityMiddlewareConfig = {}
): Promise<SecurityCheckResult> {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  
  if (enableDebugMode) {
    console.log(`🔒 Security check: ${method} ${endpoint}`);
  }

  try {
    // Skip security checks for excluded paths
    if (config.skipPaths?.some(path => endpoint.includes(path))) {
      return { allowed: true };
    }

    // Method validation
    if (config.allowedMethods && !config.allowedMethods.includes(method)) {
      await logSecurityEvent(
        'suspicious_activity',
        'medium',
        'Disallowed HTTP method',
        { method, endpoint, allowedMethods: config.allowedMethods },
        request
      );
      
      return {
        allowed: false,
        status: 405,
        headers: {
          ...getSecurityHeaders(),
          'Allow': config.allowedMethods.join(', ')
        },
        body: {
          error: 'Method not allowed',
          message: `${method} method is not allowed for this endpoint`
        },
        reason: 'Method not allowed'
      };
    }

    // Origin validation (CSRF protection)
    if (config.validateOrigin && !validateOrigin(request)) {
      return {
        allowed: false,
        status: 403,
        headers: getSecurityHeaders(),
        body: {
          error: 'Invalid origin',
          message: 'Request origin is not allowed'
        },
        reason: 'Invalid origin'
      };
    }

    // Rate limiting
    if (config.rateLimit) {
      const rateLimitConfig = typeof config.rateLimit === 'string' 
        ? RateLimitPresets[config.rateLimit]
        : config.rateLimit;

      // Use endpoint-specific rate limiting
      const endpointRateLimit = {
        ...rateLimitConfig,
        keyGenerator: createEndpointRateLimit(endpoint)
      };

      const rateLimitResult = await checkRateLimit(request, endpointRateLimit);
      
      if (!rateLimitResult.allowed) {
        return {
          allowed: false,
          status: 429,
          headers: {
            ...getSecurityHeaders(),
            'X-RateLimit-Limit': endpointRateLimit.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          },
          body: {
            error: 'Rate limit exceeded',
            message: rateLimitResult.message,
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          },
          reason: 'Rate limit exceeded'
        };
      }
    }

    // Attack pattern detection
    if (config.detectAttacks) {
      let requestData: any = {};
      
      try {
        // Try to parse request body for attack detection
        if (request.body) {
          const clonedRequest = request.clone();
          requestData = await clonedRequest.json();
        }
      } catch (error) {
        // Ignore JSON parsing errors for attack detection
      }

      const attackEvents = detectAttackPatterns(requestData, endpoint);
      
      if (attackEvents.length > 0) {
        // Log all detected attacks
        for (const event of attackEvents) {
          await logSecurityEvent(
            event.type,
            event.severity,
            event.message,
            event.metadata,
            request
          );
        }

        // Block high-severity attacks
        const highSeverityAttacks = attackEvents.filter(e => 
          e.severity === 'high' || e.severity === 'critical'
        );

        if (highSeverityAttacks.length > 0) {
          return {
            allowed: false,
            status: 400,
            headers: getSecurityHeaders(),
            body: {
              error: 'Request blocked',
              message: 'Request contains potentially malicious content'
            },
            reason: 'Attack pattern detected'
          };
        }
      }
    }

    // Authentication check (if required)
    if (config.requireAuth) {
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        await logSecurityEvent(
          'auth_failure',
          'medium',
          'Missing or invalid authorization header',
          { endpoint },
          request
        );

        return {
          allowed: false,
          status: 401,
          headers: getSecurityHeaders(),
          body: {
            error: 'Unauthorized',
            message: 'Valid authentication required'
          },
          reason: 'Authentication required'
        };
      }
    }

    // Audit logging
    if (config.auditRequests) {
      await logAuditEvent('api_request', `${method} ${endpoint}`, {
        severity: 'low',
        success: true,
        resource: endpoint,
        duration: Date.now() - startTime,
        metadata: {
          method,
          securityConfig: {
            rateLimit: !!config.rateLimit,
            validateOrigin: !!config.validateOrigin,
            detectAttacks: !!config.detectAttacks,
            requireAuth: !!config.requireAuth
          }
        },
        request
      });
    }

    // All security checks passed
    const responseHeaders = {
      ...getSecurityHeaders(),
      ...config.customHeaders
    };

    if (enableDebugMode) {
      console.log(`✅ Security check passed: ${method} ${endpoint}`);
    }

    return {
      allowed: true,
      headers: responseHeaders
    };

  } catch (error: any) {
    console.error('Security middleware error:', error);
    
    await logSecurityEvent(
      'security_alert',
      'high',
      'Security middleware failure',
      { 
        error: error.message,
        endpoint,
        method,
        stack: enableDebugMode ? error.stack : undefined
      },
      request
    );

    // Fail securely - deny access on security system failure
    return {
      allowed: false,
      status: 500,
      headers: getSecurityHeaders(),
      body: {
        error: 'Security check failed',
        message: 'Unable to verify request security'
      },
      reason: 'Security system error'
    };
  }
}

/**
 * Predefined security configurations for common use cases
 */
export const SecurityPresets = {
  // API endpoints with standard protection
  api: {
    rateLimit: 'api' as const,
    validateOrigin: true,
    detectAttacks: true,
    auditRequests: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },

  // Trial form with strict protection
  trialForm: {
    rateLimit: 'trialForm' as const,
    validateOrigin: true,
    detectAttacks: true,
    auditRequests: true,
    allowedMethods: ['POST']
  },

  // Authentication endpoints
  auth: {
    rateLimit: 'auth' as const,
    validateOrigin: true,
    detectAttacks: true,
    auditRequests: true,
    allowedMethods: ['POST']
  },

  // Webhook endpoints (more lenient)
  webhook: {
    rateLimit: 'webhook' as const,
    validateOrigin: false, // Webhooks come from external services
    detectAttacks: true,
    auditRequests: true,
    allowedMethods: ['POST']
  },

  // Public endpoints (minimal protection)
  public: {
    rateLimit: 'api' as const,
    validateOrigin: false,
    detectAttacks: true,
    auditRequests: false,
    allowedMethods: ['GET', 'POST']
  },

  // Admin endpoints (maximum protection)
  admin: {
    rateLimit: 'strict' as const,
    validateOrigin: true,
    detectAttacks: true,
    auditRequests: true,
    requireAuth: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
  }
} as const;

/**
 * Create a security middleware function for specific configuration
 */
export function createSecurityMiddleware(config: SecurityMiddlewareConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const result = await applySecurity(request, config);
    
    if (!result.allowed) {
      return NextResponse.json(
        result.body || { error: 'Request blocked' },
        { 
          status: result.status || 403,
          headers: result.headers || getSecurityHeaders()
        }
      );
    }
    
    // Return null to continue processing with security headers
    return null;
  };
}

/**
 * Apply security to API route handler
 */
export function withSecurity<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  config: SecurityMiddlewareConfig = {}
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    
    const securityResult = await applySecurity(request, config);
    
    if (!securityResult.allowed) {
      return NextResponse.json(
        securityResult.body || { error: 'Request blocked' },
        { 
          status: securityResult.status || 403,
          headers: securityResult.headers || getSecurityHeaders()
        }
      );
    }
    
    // Continue with original handler
    const response = await handler(...args);
    
    // Add security headers to response
    if (securityResult.headers) {
      Object.entries(securityResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    
    return response;
  };
}

/**
 * Security middleware for Next.js middleware.js
 */
export async function securityMiddleware(
  request: NextRequest,
  config: SecurityMiddlewareConfig = {}
): Promise<NextResponse | null> {
  // Apply security checks
  const result = await applySecurity(request, config);
  
  if (!result.allowed) {
    return NextResponse.json(
      result.body || { error: 'Request blocked' },
      { 
        status: result.status || 403,
        headers: result.headers || getSecurityHeaders()
      }
    );
  }
  
  // Continue with request, adding security headers
  const response = NextResponse.next();
  
  if (result.headers) {
    Object.entries(result.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  return response;
}

export default {
  applySecurity,
  createSecurityMiddleware,
  withSecurity,
  securityMiddleware,
  SecurityPresets
};
