/**
 * Rate limiting middleware for API routes
 * 
 * This module provides rate limiting functionality to protect API endpoints
 * from abuse. It uses a simple in-memory store for development and testing,
 * but can be configured to use Redis or another store for production.
 */

import { NextResponse } from "next/server";
import { logError } from "@/lib/utils";

// In-memory store for rate limiting
// Note: This is only suitable for development and testing
// For production, use Redis or another distributed store
const store = new Map();

// Clean up the store periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, { resetTime }] of store.entries()) {
    if (resetTime <= now) {
      store.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Rate limiting middleware
 * @param {Object} options - Rate limiting options
 * @param {number} options.limit - Maximum number of requests allowed in the window
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {Function} options.keyGenerator - Function to generate a key for the request
 * @param {string} options.message - Error message to return when rate limit is exceeded
 * @returns {Function} Middleware function
 */
export function rateLimit(options = {}) {
  const {
    limit = 60,
    windowMs = 60000, // 1 minute
    keyGenerator = (req) => {
      // Default key generator uses IP address
      const ip = req.headers.get("x-forwarded-for") || 
                 req.headers.get("x-real-ip") || 
                 "unknown";
      return `rate-limit:${ip}`;
    },
    message = "Too many requests, please try again later"
  } = options;

  return async function rateLimitMiddleware(req) {
    try {
      const key = keyGenerator(req);
      const now = Date.now();
      
      // Get or create rate limit info
      let rateLimitInfo = store.get(key);
      
      if (!rateLimitInfo) {
        rateLimitInfo = {
          count: 0,
          resetTime: now + windowMs
        };
        store.set(key, rateLimitInfo);
      }
      
      // Reset count if the window has passed
      if (rateLimitInfo.resetTime <= now) {
        rateLimitInfo.count = 0;
        rateLimitInfo.resetTime = now + windowMs;
      }
      
      // Increment count
      rateLimitInfo.count += 1;
      
      // Set rate limit headers
      const headers = new Headers();
      headers.set("X-RateLimit-Limit", limit.toString());
      headers.set("X-RateLimit-Remaining", Math.max(0, limit - rateLimitInfo.count).toString());
      headers.set("X-RateLimit-Reset", Math.ceil(rateLimitInfo.resetTime / 1000).toString());
      
      // Check if rate limit is exceeded
      if (rateLimitInfo.count > limit) {
        headers.set("Retry-After", Math.ceil((rateLimitInfo.resetTime - now) / 1000).toString());
        
        return NextResponse.json(
          { success: false, error: message },
          { status: 429, headers }
        );
      }
      
      // Continue with the request
      const response = NextResponse.next();
      
      // Add rate limit headers to the response
      Object.entries(Object.fromEntries(headers.entries())).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    } catch (error) {
      logError(error, { path: req.nextUrl.pathname }, "rate-limit-middleware");
      
      // If there's an error, continue with the request
      return NextResponse.next();
    }
  };
}

/**
 * Apply rate limiting to specific API routes
 * @param {Object} options - Rate limiting options
 * @returns {Function} Middleware function
 */
export function apiRateLimit(options = {}) {
  const middleware = rateLimit({
    limit: 100, // 100 requests per minute
    windowMs: 60000, // 1 minute
    ...options
  });
  
  return async function apiRateLimitMiddleware(req) {
    // Only apply rate limiting to API routes
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return middleware(req);
    }
    
    // Skip rate limiting for non-API routes
    return NextResponse.next();
  };
}

/**
 * Apply stricter rate limiting to authentication routes
 * @param {Object} options - Rate limiting options
 * @returns {Function} Middleware function
 */
export function authRateLimit(options = {}) {
  const middleware = rateLimit({
    limit: 10, // 10 requests per minute
    windowMs: 60000, // 1 minute
    ...options
  });
  
  return async function authRateLimitMiddleware(req) {
    // Only apply rate limiting to auth routes
    if (req.nextUrl.pathname.startsWith("/api/auth/")) {
      return middleware(req);
    }
    
    // Skip rate limiting for non-auth routes
    return NextResponse.next();
  };
}

/**
 * Apply rate limiting to webhook routes
 * @param {Object} options - Rate limiting options
 * @returns {Function} Middleware function
 */
export function webhookRateLimit(options = {}) {
  const middleware = rateLimit({
    limit: 60, // 60 requests per minute
    windowMs: 60000, // 1 minute
    ...options
  });
  
  return async function webhookRateLimitMiddleware(req) {
    // Only apply rate limiting to webhook routes
    if (req.nextUrl.pathname.startsWith("/api/webhooks/")) {
      return middleware(req);
    }
    
    // Skip rate limiting for non-webhook routes
    return NextResponse.next();
  };
}
