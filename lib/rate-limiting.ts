/**
 * Rate Limiting for SmartText AI
 * 
 * Vercel-optimized rate limiting with memory-based fallback
 * and Redis upgrade path for production persistence.
 */

import { logSecurityEvent } from './security';

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const enableDebugMode = process.env.DEBUG_RATE_LIMIT === 'true' && !isProduction;

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyGenerator?: (request: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

// Rate limit result
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
  message?: string;
}

// In-memory store for rate limiting (handles Vercel cold starts gracefully)
class MemoryRateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.store.forEach((value, key) => {
      if (value.resetTime <= now) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.store.delete(key));
    
    if (enableDebugMode) {
      console.log(`🧹 Rate limit cleanup: ${this.store.size} active entries`);
    }
  }

  get(key: string): { count: number; resetTime: number } | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (entry.resetTime <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return entry;
  }

  set(key: string, count: number, resetTime: number): void {
    this.store.set(key, { count, resetTime });
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const existing = this.get(key);
    
    if (!existing) {
      // First request in window
      const resetTime = now + windowMs;
      this.set(key, 1, resetTime);
      return { count: 1, resetTime };
    }
    
    // Increment existing
    const newCount = existing.count + 1;
    this.set(key, newCount, existing.resetTime);
    return { count: newCount, resetTime: existing.resetTime };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Redis store for production (future implementation)
class RedisRateLimitStore {
  private redisClient: any;

  constructor(redisUrl: string) {
    // TODO: Implement Redis connection
    // this.redisClient = new Redis(redisUrl);
    console.log('Redis rate limiting not yet implemented, falling back to memory');
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    // TODO: Implement Redis get
    return null;
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    // TODO: Implement Redis increment with expiration
    return { count: 1, resetTime: Date.now() + windowMs };
  }
}

// Global store instance (survives across requests in same container)
let globalStore: MemoryRateLimitStore | RedisRateLimitStore | null = null;

function getStore(): MemoryRateLimitStore | RedisRateLimitStore {
  if (!globalStore) {
    if (process.env.REDIS_URL && isProduction) {
      globalStore = new RedisRateLimitStore(process.env.REDIS_URL);
    } else {
      globalStore = new MemoryRateLimitStore();
    }
  }
  return globalStore;
}

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(request: any): string {
  const ip = request.headers?.get?.('x-forwarded-for') || 
             request.headers?.get?.('x-real-ip') || 
             request.connection?.remoteAddress ||
             request.socket?.remoteAddress ||
             'unknown';
  
  return `rate_limit:${ip}`;
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  request: any, 
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const store = getStore();
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;
  const key = keyGenerator(request);
  
  try {
    let result: { count: number; resetTime: number };
    
    if (store instanceof MemoryRateLimitStore) {
      result = store.increment(key, config.windowMs);
    } else {
      result = await store.increment(key, config.windowMs);
    }
    
    const allowed = result.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - result.count);
    
    // Log rate limit events
    if (!allowed) {
      logSecurityEvent(
        'rate_limit_exceeded',
        'medium',
        'Rate limit exceeded',
        {
          key,
          count: result.count,
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
          resetTime: result.resetTime
        },
        request
      );
    } else if (enableDebugMode) {
      console.log(`🚦 Rate limit check: ${result.count}/${config.maxRequests} for ${key}`);
    }
    
    return {
      allowed,
      remaining,
      resetTime: result.resetTime,
      totalHits: result.count,
      message: allowed ? undefined : (config.message || 'Rate limit exceeded')
    };
    
  } catch (error) {
    console.error('Rate limit check failed:', error);
    
    // Fail open - allow request if rate limiting fails
    logSecurityEvent(
      'rate_limit_exceeded',
      'high',
      'Rate limiting system failure - failing open',
      { error: error.message, key },
      request
    );
    
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
      totalHits: 0,
      message: 'Rate limiting temporarily unavailable'
    };
  }
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  // API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests, please try again later'
  },
  
  // Trial form submissions
  trialForm: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many trial submissions, please try again later'
  },
  
  // Authentication attempts
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later'
  },
  
  // General form submissions
  form: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    message: 'Too many form submissions, please slow down'
  },
  
  // Webhook endpoints (more lenient for legitimate services)
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Webhook rate limit exceeded'
  },
  
  // Strict rate limiting for suspicious activity
  strict: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1,
    message: 'Request blocked due to suspicious activity'
  }
} as const;

/**
 * Create rate limit middleware for API routes
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (request: any) => {
    const result = await checkRateLimit(request, config);
    
    if (!result.allowed) {
      return {
        blocked: true,
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
        },
        body: {
          error: 'Rate limit exceeded',
          message: result.message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }
      };
    }
    
    return {
      blocked: false,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
      }
    };
  };
}

/**
 * Rate limit by user ID (for authenticated requests)
 */
export function createUserRateLimit(userId: string): (request: any) => string {
  return () => `rate_limit:user:${userId}`;
}

/**
 * Rate limit by endpoint (for specific API routes)
 */
export function createEndpointRateLimit(endpoint: string): (request: any) => string {
  return (request: any) => {
    const ip = defaultKeyGenerator(request).replace('rate_limit:', '');
    return `rate_limit:endpoint:${endpoint}:${ip}`;
  };
}

/**
 * Rate limit by form type (for different form submissions)
 */
export function createFormRateLimit(formType: string): (request: any) => string {
  return (request: any) => {
    const ip = defaultKeyGenerator(request).replace('rate_limit:', '');
    return `rate_limit:form:${formType}:${ip}`;
  };
}

/**
 * Progressive rate limiting - stricter limits for repeated violations
 */
export async function checkProgressiveRateLimit(
  request: any,
  baseConfig: RateLimitConfig,
  violationKey?: string
): Promise<RateLimitResult> {
  // Check base rate limit first
  const baseResult = await checkRateLimit(request, baseConfig);
  
  if (baseResult.allowed) {
    return baseResult;
  }
  
  // Check for repeated violations
  const vKey = violationKey || `${defaultKeyGenerator(request)}:violations`;
  const store = getStore();
  
  let violationCount = 1;
  if (store instanceof MemoryRateLimitStore) {
    const violations = store.increment(vKey, 24 * 60 * 60 * 1000); // 24 hour window
    violationCount = violations.count;
  }
  
  // Apply progressive penalties
  let penaltyMultiplier = 1;
  if (violationCount > 5) {
    penaltyMultiplier = 4; // 4x longer penalty
  } else if (violationCount > 3) {
    penaltyMultiplier = 2; // 2x longer penalty
  }
  
  if (penaltyMultiplier > 1) {
    logSecurityEvent(
      'rate_limit_exceeded',
      'high',
      'Progressive rate limit penalty applied',
      {
        violationCount,
        penaltyMultiplier,
        originalResetTime: baseResult.resetTime
      },
      request
    );
    
    return {
      ...baseResult,
      resetTime: baseResult.resetTime + (baseConfig.windowMs * (penaltyMultiplier - 1)),
      message: `Rate limit exceeded. Penalty applied due to repeated violations.`
    };
  }
  
  return baseResult;
}

export default {
  checkRateLimit,
  createRateLimitMiddleware,
  createUserRateLimit,
  createEndpointRateLimit,
  createFormRateLimit,
  checkProgressiveRateLimit,
  RateLimitPresets
};
