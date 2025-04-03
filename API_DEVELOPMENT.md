# API Development Guidelines

This document outlines best practices for developing API routes in the SmartText project, particularly when deploying to Vercel.

## Key Recommendations

### 1. Place API Routes in the `/api` Directory

**✅ Recommended:**
- Use the `/api` directory for serverless functions instead of `/pages/api`
- This follows Vercel's recommended approach for serverless functions

**❌ Avoid:**
- Placing API routes in `/pages/api` can cause deployment issues with Vercel

### 2. Keep API Routes Simple

**✅ Recommended:**
- Minimize dependencies on external modules
- Use simple, self-contained logic when possible
- For complex operations, create utility functions in separate files

**❌ Avoid:**
- Complex dependencies that may not be properly bundled during deployment
- Deep import chains that can break in the serverless environment

### 3. Use ES Modules Syntax

**✅ Recommended:**
- Use ES modules syntax (`export default function handler()`)
- Consistent with the rest of the Next.js project

**❌ Avoid:**
- CommonJS syntax (`module.exports = (req, res) => {}`)
- Mixing module systems can cause unexpected issues

## CORS Handling

Cross-Origin Resource Sharing (CORS) is essential when your API needs to be accessed from different domains.

### Basic CORS Setup

For simple API routes that need to allow cross-origin requests:

```javascript
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Your API logic here
  // ...
}
```

### Production CORS Configuration

For production environments, it's recommended to restrict allowed origins:

```javascript
export default async function handler(req, res) {
  // Define allowed origins
  const allowedOrigins = [
    'https://smarttext.ai',
    'https://app.smarttext.ai',
    'https://dashboard.smarttext.ai'
  ];
  
  // Get the origin from the request
  const origin = req.headers.origin;
  
  // Check if the origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Set other CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Your API logic here
  // ...
}
```

### Using CORS Middleware

For consistent CORS handling across multiple API routes, consider creating a CORS middleware:

```javascript
// lib/middleware/cors.js
export function cors(handler) {
  return async (req, res) => {
    // Set CORS headers based on environment
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? ['https://smarttext.ai', 'https://app.smarttext.ai']
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Call the original handler
    return handler(req, res);
  };
}

// Usage in API route
import { cors } from '../lib/middleware/cors';

function apiHandler(req, res) {
  // API logic here
}

export default cors(apiHandler);
```

### CORS with Next.js Config

For project-wide CORS settings, you can also configure CORS in your `next.config.mjs`:

```javascript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        // Apply these headers to all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' }, // Customize this in production
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

## Error Handling Best Practices

Proper error handling is crucial for building robust API endpoints. Here are best practices for handling errors in your API routes:

### 1. Use Try-Catch Blocks

Always wrap your API logic in try-catch blocks to prevent unhandled exceptions:

```javascript
export default async function handler(req, res) {
  try {
    // API logic here
    const result = await someAsyncOperation();
    return res.status(200).json(result);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 2. Structured Error Responses

Return consistent error response structures to make error handling easier for clients:

```javascript
// Good error response structure
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Must be a valid email address" }
    ]
  }
}
```

Example implementation:

```javascript
export default async function handler(req, res) {
  try {
    // Validate input
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: [
            { field: 'email', message: 'Must be a valid email address' }
          ]
        }
      });
    }
    
    // Process valid request...
    
  } catch (error) {
    // Handle unexpected errors
    console.error('API error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId: generateRequestId() // Optional: for tracking in logs
      }
    });
  }
}
```

### 3. HTTP Status Codes

Use appropriate HTTP status codes to indicate the nature of errors:

| Status Code | Use Case |
|-------------|----------|
| 400 | Bad Request - Invalid input, missing parameters |
| 401 | Unauthorized - Missing authentication |
| 403 | Forbidden - Authenticated but not authorized |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource state conflict |
| 422 | Unprocessable Entity - Validation errors |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Unexpected server errors |
| 503 | Service Unavailable - Server temporarily unavailable |

### 4. Error Logging

Implement proper error logging to help with debugging:

```javascript
export default async function handler(req, res) {
  try {
    // API logic
  } catch (error) {
    // Log detailed error information
    console.error('API Error:', {
      endpoint: req.url,
      method: req.method,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      requestId: req.headers['x-request-id'] || generateRequestId(),
      timestamp: new Date().toISOString()
    });
    
    // Return sanitized error to client
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
}
```

### 5. Custom Error Classes

For complex APIs, consider creating custom error classes:

```javascript
// lib/errors.js
export class APIError extends Error {
  constructor(code, message, status = 500, details = null) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
  
  toResponse() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details })
      }
    };
  }
}

export class ValidationError extends APIError {
  constructor(message, details) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthError extends APIError {
  constructor(message) {
    super('UNAUTHORIZED', message, 401);
    this.name = 'AuthError';
  }
}

// Usage in API route
import { ValidationError, AuthError } from '../lib/errors';

export default async function handler(req, res) {
  try {
    // Validate request
    if (!req.body.email) {
      throw new ValidationError('Invalid input', [
        { field: 'email', message: 'Email is required' }
      ]);
    }
    
    // Check authentication
    if (!isAuthenticated(req)) {
      throw new AuthError('Authentication required');
    }
    
    // Process request...
    
  } catch (error) {
    if (error instanceof APIError) {
      // Handle known error types
      return res.status(error.status).json(error.toResponse());
    }
    
    // Handle unexpected errors
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
}
```

### 6. Async Error Handling

Be careful with async/await error handling, especially in middleware:

```javascript
// Correct async error handling
export default async function handler(req, res) {
  try {
    const data = await fetchData();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Incorrect - errors in fetchData will not be caught
export default function handler(req, res) {
  fetchData()
    .then(data => {
      return res.status(200).json(data);
    });
  // Missing .catch() handler!
}
```

## Rate Limiting

Rate limiting is essential for protecting your API from abuse and ensuring fair usage. Here are approaches to implement rate limiting in your API routes:

### 1. Basic In-Memory Rate Limiting

For simple applications, you can implement a basic in-memory rate limiter:

```javascript
// Simple in-memory store (not suitable for production with multiple instances)
const rateLimit = {
  store: new Map(),
  
  // Check if request is within limits
  check(key, limit, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get or initialize record
    const record = this.store.get(key) || { 
      count: 0, 
      requests: [] 
    };
    
    // Filter out old requests
    record.requests = record.requests.filter(time => time > windowStart);
    record.count = record.requests.length;
    
    // Check if limit is exceeded
    if (record.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(record.requests[0] + windowMs)
      };
    }
    
    // Update record
    record.requests.push(now);
    record.count++;
    this.store.set(key, record);
    
    return {
      allowed: true,
      remaining: limit - record.count,
      resetAt: new Date(now + windowMs)
    };
  }
};

// Usage in API route
export default async function handler(req, res) {
  // Get client IP or user identifier
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  // Check rate limit (100 requests per minute)
  const result = rateLimit.check(clientIp, 100, 60 * 1000);
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', '100');
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.floor(result.resetAt.getTime() / 1000).toString());
  
  // Return 429 if limit exceeded
  if (!result.allowed) {
    return res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)
      }
    });
  }
  
  // Process the request normally
  try {
    // API logic here
  } catch (error) {
    // Error handling
  }
}
```

### 2. Using a Rate Limiting Middleware

For more maintainable code, create a rate limiting middleware:

```javascript
// lib/middleware/rateLimit.js
export function rateLimit(options = {}) {
  const {
    limit = 100,
    windowMs = 60 * 1000, // 1 minute
    keyGenerator = (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    handler = defaultHandler
  } = options;
  
  const store = new Map();
  
  function defaultHandler(req, res) {
    return res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later'
      }
    });
  }
  
  return (handler) => async (req, res) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get or initialize record
    const record = store.get(key) || { count: 0, requests: [] };
    
    // Filter out old requests
    record.requests = record.requests.filter(time => time > windowStart);
    record.count = record.requests.length;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - record.count).toString());
    
    // Check if limit is exceeded
    if (record.count >= limit) {
      const oldestRequest = record.requests[0] || now;
      const resetTime = new Date(oldestRequest + windowMs);
      res.setHeader('X-RateLimit-Reset', Math.floor(resetTime.getTime() / 1000).toString());
      return handler(req, res);
    }
    
    // Update record
    record.requests.push(now);
    record.count++;
    store.set(key, record);
    
    // Call the original handler
    return handler(req, res);
  };
}

// Usage in API route
import { rateLimit } from '../lib/middleware/rateLimit';

const apiHandler = async (req, res) => {
  // API logic here
};

// Apply rate limiting: 50 requests per minute
export default rateLimit({
  limit: 50,
  windowMs: 60 * 1000,
  // Custom key generator (e.g., by user ID if authenticated)
  keyGenerator: (req) => {
    return req.headers.authorization 
      ? extractUserIdFromToken(req.headers.authorization) 
      : req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  }
})(apiHandler);
```

### 3. Different Limits for Different Routes

Apply different rate limits based on the endpoint or user role:

```javascript
// lib/middleware/rateLimit.js
// ... (same as above)

// Usage with different limits
const publicLimit = rateLimit({ limit: 20, windowMs: 60 * 1000 });
const authenticatedLimit = rateLimit({ 
  limit: 100, 
  windowMs: 60 * 1000,
  keyGenerator: (req) => extractUserIdFromToken(req.headers.authorization)
});
const adminLimit = rateLimit({ limit: 500, windowMs: 60 * 1000 });

// Public endpoint
export const publicApiHandler = publicLimit((req, res) => {
  // Public API logic
});

// Authenticated endpoint
export const userApiHandler = authenticatedLimit((req, res) => {
  // User API logic
});

// Admin endpoint
export const adminApiHandler = adminLimit((req, res) => {
  // Admin API logic
});
```

### 4. Using Redis for Distributed Rate Limiting

For production environments with multiple server instances, use Redis to store rate limit data:

```javascript
// lib/middleware/redisRateLimit.js
import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL);

export function redisRateLimit(options = {}) {
  const {
    limit = 100,
    windowMs = 60 * 1000,
    keyPrefix = 'ratelimit:',
    keyGenerator = (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    handler = defaultHandler
  } = options;
  
  function defaultHandler(req, res) {
    return res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later'
      }
    });
  }
  
  return (handler) => async (req, res) => {
    const key = `${keyPrefix}${keyGenerator(req)}`;
    const now = Date.now();
    const windowStartMs = now - windowMs;
    
    try {
      // Remove old requests
      await redis.zremrangebyscore(key, 0, windowStartMs);
      
      // Count requests in current window
      const count = await redis.zcard(key);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count).toString());
      
      // Check if limit is exceeded
      if (count >= limit) {
        // Get reset time (time when oldest request expires)
        const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
        const resetTime = oldestRequest.length ? parseInt(oldestRequest[1]) + windowMs : now + windowMs;
        
        res.setHeader('X-RateLimit-Reset', Math.floor(resetTime / 1000).toString());
        return handler(req, res);
      }
      
      // Add current request to window
      await redis.zadd(key, now, `${now}-${Math.random().toString(36).substring(2, 10)}`);
      
      // Set expiration on the key
      await redis.expire(key, Math.ceil(windowMs / 1000));
      
      // Call the original handler
      return handler(req, res);
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow the request if Redis is down
      return handler(req, res);
    }
  };
}
```

### 5. Using Third-Party Libraries

For production applications, consider using established libraries:

```bash
npm install --save @vercel/rate-limit
```

```javascript
// Using @vercel/rate-limit
import rateLimit from '@vercel/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});

export default async function handler(req, res) {
  try {
    // Apply rate limiting
    await limiter.check(res, 100, 'api-token'); // 100 requests per minute per token
    
    // Your API logic here
    
  } catch (error) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
}
```

### 6. Rate Limiting Headers

Always include standard rate limiting headers in your responses:

```javascript
// Standard rate limiting headers
res.setHeader('X-RateLimit-Limit', limit.toString());          // Maximum requests allowed
res.setHeader('X-RateLimit-Remaining', remaining.toString());  // Requests remaining in window
res.setHeader('X-RateLimit-Reset', resetTime.toString());      // Timestamp when limit resets
```

When a rate limit is exceeded, also include:

```javascript
res.setHeader('Retry-After', retryAfterSeconds.toString());    // Seconds until retry is allowed
```

## API Versioning

API versioning is crucial for maintaining backward compatibility while evolving your API. Here are strategies for implementing versioning in your API routes:

### 1. URL Path Versioning

The most straightforward approach is to include the version in the URL path:

```
/api/v1/users
/api/v2/users
```

Implementation in Next.js:

```
/api/v1/users.js
/api/v2/users.js
```

This approach is explicit and easy to understand, but it requires clients to update their URLs when migrating to a new version.

### 2. Directory Structure for Versioning

Organize your API routes by version:

```
/api/v1/users/index.js
/api/v2/users/index.js
```

This keeps your codebase organized and makes it clear which endpoints belong to which version.

### 3. Query Parameter Versioning

Use a query parameter to specify the version:

```
/api/users?version=1
/api/users?version=2
```

Implementation:

```javascript
// api/users.js
export default async function handler(req, res) {
  const version = parseInt(req.query.version) || 1; // Default to version 1
  
  if (version === 1) {
    return handleV1(req, res);
  } else if (version === 2) {
    return handleV2(req, res);
  } else {
    return res.status(400).json({ error: 'Unsupported API version' });
  }
}

function handleV1(req, res) {
  // Version 1 implementation
}

function handleV2(req, res) {
  // Version 2 implementation
}
```

This approach allows a single endpoint to handle multiple versions, but it's less explicit than URL path versioning.

### 4. Header-Based Versioning

Use a custom header to specify the API version:

```
Accept-Version: 1
Accept-Version: 2
```

Implementation:

```javascript
// api/users.js
export default async function handler(req, res) {
  const version = parseInt(req.headers['accept-version']) || 1; // Default to version 1
  
  if (version === 1) {
    return handleV1(req, res);
  } else if (version === 2) {
    return handleV2(req, res);
  } else {
    return res.status(400).json({ error: 'Unsupported API version' });
  }
}
```

This approach keeps the URLs clean but requires clients to set the appropriate headers.

### 5. Content Negotiation (Accept Header)

Use the standard `Accept` header for versioning:

```
Accept: application/vnd.smarttext.v1+json
Accept: application/vnd.smarttext.v2+json
```

Implementation:

```javascript
// api/users.js
export default async function handler(req, res) {
  const acceptHeader = req.headers.accept || '';
  
  if (acceptHeader.includes('application/vnd.smarttext.v2+json')) {
    return handleV2(req, res);
  } else {
    // Default to v1
    return handleV1(req, res);
  }
}
```

This is a more standards-compliant approach but can be more complex to implement.

### 6. Middleware for Version Routing

Create a middleware to handle versioning across all API routes:

```javascript
// lib/middleware/apiVersion.js
export function withVersioning(handlers) {
  return async (req, res) => {
    // Get version from URL path, header, or query parameter
    let version;
    
    // Check URL path first (e.g., /api/v2/users)
    const pathMatch = req.url.match(/\/api\/v(\d+)\//);
    if (pathMatch) {
      version = parseInt(pathMatch[1]);
    } else {
      // Check header
      version = parseInt(req.headers['accept-version']) || 
                // Check query parameter
                parseInt(req.query.version) || 
                // Default to latest version
                Object.keys(handlers).length;
    }
    
    // Convert version to string key (e.g., "v1")
    const versionKey = `v${version}`;
    
    // Check if requested version exists
    if (handlers[versionKey]) {
      return handlers[versionKey](req, res);
    } else {
      return res.status(400).json({ 
        error: {
          code: 'UNSUPPORTED_VERSION',
          message: `API version ${version} is not supported`,
          supportedVersions: Object.keys(handlers).map(v => v.substring(1))
        }
      });
    }
  };
}

// Usage in API route
import { withVersioning } from '../lib/middleware/apiVersion';

const handleV1 = (req, res) => {
  // V1 implementation
};

const handleV2 = (req, res) => {
  // V2 implementation with new features
};

export default withVersioning({
  v1: handleV1,
  v2: handleV2
});
```

### 7. Version-Specific Models and Services

Separate your business logic by version:

```javascript
// lib/api/v1/userService.js
export function getUserData(userId) {
  // V1 implementation
}

// lib/api/v2/userService.js
export function getUserData(userId) {
  // V2 implementation with additional fields
}

// API route
import { getUserData as getUserDataV1 } from '../lib/api/v1/userService';
import { getUserData as getUserDataV2 } from '../lib/api/v2/userService';

export default async function handler(req, res) {
  const version = parseInt(req.headers['accept-version']) || 1;
  
  try {
    const userId = req.query.id;
    
    if (version === 1) {
      const userData = await getUserDataV1(userId);
      return res.status(200).json(userData);
    } else if (version === 2) {
      const userData = await getUserDataV2(userId);
      return res.status(200).json(userData);
    } else {
      return res.status(400).json({ error: 'Unsupported API version' });
    }
  } catch (error) {
    // Error handling
  }
}
```

### 8. Versioning Best Practices

1. **Document API Changes**: Maintain clear documentation of changes between versions.

2. **Semantic Versioning**: Consider using semantic versioning principles (MAJOR.MINOR.PATCH):
   - MAJOR: Breaking changes
   - MINOR: New features, backward compatible
   - PATCH: Bug fixes, backward compatible

3. **Deprecation Policy**: Clearly communicate when older versions will be deprecated:

   ```javascript
   export default async function handler(req, res) {
     const version = parseInt(req.headers['accept-version']) || 1;
     
     if (version === 1) {
       // Add deprecation warning header
       res.setHeader('Warning', '299 - "This API version is deprecated and will be removed on 2025-06-01. Please migrate to v2."');
       return handleV1(req, res);
     } else if (version === 2) {
       return handleV2(req, res);
     }
   }
   ```

4. **Version Lifecycle**:
   - **Alpha/Beta**: For testing new features
   - **Stable**: For production use
   - **Deprecated**: Still available but scheduled for removal
   - **Sunset**: No longer available

5. **Gradual Migration**: Allow clients time to migrate to newer versions before removing old ones.

### 9. Example: Complete Versioned API Route

```javascript
// api/users.js
import { withVersioning } from '../../lib/middleware/apiVersion';
import { cors } from '../../lib/middleware/cors';
import { rateLimit } from '../../lib/middleware/rateLimit';
import * as userServiceV1 from '../../lib/api/v1/userService';
import * as userServiceV2 from '../../lib/api/v2/userService';

// V1 handler
const handleV1 = async (req, res) => {
  try {
    const users = await userServiceV1.getUsers();
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// V2 handler with enhanced response format
const handleV2 = async (req, res) => {
  try {
    const users = await userServiceV2.getUsers();
    return res.status(200).json({ 
      data: { users },
      meta: { 
        version: 2,
        count: users.length
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

// Apply middleware stack: CORS -> Rate Limiting -> Versioning
export default cors(
  rateLimit({ limit: 100, windowMs: 60 * 1000 })(
    withVersioning({
      v1: handleV1,
      v2: handleV2
    })
  )
);
```

## Example Implementation

```javascript
// Good example: /api/example.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple, self-contained logic
    const data = req.body;
    
    // Process data...
    
    return res.status(200).json({ 
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

## Deployment Considerations

- Vercel automatically deploys API routes as serverless functions
- Each function has its own cold start and execution context
- Consider performance implications for frequently accessed endpoints
- Use appropriate caching strategies for data-intensive operations

## Testing API Routes

- Test locally before deploying to production
- Use tools like Postman or simple Node.js scripts to verify functionality
- Include error handling and validation in your tests

## Resources

- [Vercel Serverless Functions Documentation](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Next.js API Routes Documentation](https://nextjs.org/docs/api-routes/introduction)
- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
- [API Versioning Strategies](https://www.freecodecamp.org/news/rest-api-design-best-practices-build-a-rest-api/)
