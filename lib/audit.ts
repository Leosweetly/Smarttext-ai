/**
 * Security Audit Logging for SmartText AI
 * 
 * Environment-aware audit logging that integrates with existing
 * monitoring infrastructure and provides security event tracking.
 */

import { SecurityEvent, SecurityEventType, extractClientInfo } from './security';

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const enableAuditLogging = process.env.ENABLE_AUDIT_LOGS !== 'false'; // Default enabled
const enableDebugMode = process.env.DEBUG_AUDIT === 'true' && !isProduction;

// Audit event types (extends security events)
export type AuditEventType = SecurityEventType |
  'user_login' |
  'user_logout' |
  'business_created' |
  'business_updated' |
  'subscription_changed' |
  'payment_processed' |
  'api_key_used' |
  'data_export' |
  'admin_action' |
  'system_error';

export interface AuditEvent {
  type: AuditEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  userId?: string;
  businessId?: string;
  sessionId?: string;
  action: string;
  resource?: string;
  success: boolean;
  duration?: number;
  errorCode?: string;
  changes?: Record<string, any>;
}

// Audit log storage interface
interface AuditStorage {
  store(event: AuditEvent): Promise<void>;
  query(filters: AuditQueryFilters): Promise<AuditEvent[]>;
}

export interface AuditQueryFilters {
  userId?: string;
  businessId?: string;
  type?: AuditEventType;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  startTime?: Date;
  endTime?: Date;
  limit?: number;
}

// In-memory audit storage (for development and fallback)
class MemoryAuditStorage implements AuditStorage {
  private events: AuditEvent[] = [];
  private maxEvents = 10000; // Prevent memory bloat

  async store(event: AuditEvent): Promise<void> {
    this.events.push(event);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    if (enableDebugMode) {
      console.log(`📝 Audit stored: ${event.type} - ${event.action}`);
    }
  }

  async query(filters: AuditQueryFilters): Promise<AuditEvent[]> {
    let filtered = this.events;

    if (filters.userId) {
      filtered = filtered.filter(e => e.userId === filters.userId);
    }
    
    if (filters.businessId) {
      filtered = filtered.filter(e => e.businessId === filters.businessId);
    }
    
    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }
    
    if (filters.severity) {
      filtered = filtered.filter(e => e.severity === filters.severity);
    }
    
    if (filters.startTime) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= filters.startTime!);
    }
    
    if (filters.endTime) {
      filtered = filtered.filter(e => new Date(e.timestamp) <= filters.endTime!);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply limit
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }
}

// Supabase audit storage (future implementation)
class SupabaseAuditStorage implements AuditStorage {
  async store(event: AuditEvent): Promise<void> {
    // TODO: Implement Supabase audit log storage
    // Could create an 'audit_logs' table in Supabase
    console.log('Supabase audit storage not yet implemented');
  }

  async query(filters: AuditQueryFilters): Promise<AuditEvent[]> {
    // TODO: Implement Supabase audit log querying
    return [];
  }
}

// Global storage instance
let auditStorage: AuditStorage | null = null;

function getAuditStorage(): AuditStorage {
  if (!auditStorage) {
    if (process.env.SUPABASE_URL && isProduction) {
      auditStorage = new SupabaseAuditStorage();
    } else {
      auditStorage = new MemoryAuditStorage();
    }
  }
  return auditStorage;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(
  type: AuditEventType,
  action: string,
  options: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    success?: boolean;
    userId?: string;
    businessId?: string;
    sessionId?: string;
    resource?: string;
    duration?: number;
    errorCode?: string;
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
    request?: any;
  } = {}
): Promise<void> {
  if (!enableAuditLogging) {
    return;
  }

  const event: AuditEvent = {
    type,
    action,
    severity: options.severity || 'low',
    success: options.success !== false, // Default to true
    message: `${action} ${options.success !== false ? 'succeeded' : 'failed'}`,
    timestamp: new Date().toISOString(),
    userId: options.userId,
    businessId: options.businessId,
    sessionId: options.sessionId,
    resource: options.resource,
    duration: options.duration,
    errorCode: options.errorCode,
    changes: options.changes,
    metadata: options.metadata || {},
    ...extractClientInfo(options.request || {})
  };

  try {
    const storage = getAuditStorage();
    await storage.store(event);

    // Console logging based on environment and severity
    if (event.severity === 'high' || event.severity === 'critical') {
      console.error('🚨 AUDIT EVENT:', JSON.stringify(event, null, 2));
    } else if (enableDebugMode || (!isProduction && event.severity === 'medium')) {
      console.log(`📋 Audit [${event.severity}]:`, event.action, event.metadata);
    }

    // Integration with existing monitoring system
    if (typeof global !== 'undefined' && (global as any).monitoring) {
      // Integrate with existing monitoring if available
      (global as any).monitoring.recordEvent('audit', event);
    }

  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break application flow
  }
}

/**
 * Query audit events
 */
export async function queryAuditEvents(filters: AuditQueryFilters): Promise<AuditEvent[]> {
  try {
    const storage = getAuditStorage();
    return await storage.query(filters);
  } catch (error) {
    console.error('Failed to query audit events:', error);
    return [];
  }
}

/**
 * Audit middleware for API requests
 */
export function createAuditMiddleware(options: {
  includeBody?: boolean;
  excludePaths?: string[];
  logSuccess?: boolean;
} = {}) {
  return async (request: any, response: any, next?: () => void) => {
    const startTime = Date.now();
    const endpoint = request.url || request.nextUrl?.pathname || 'unknown';
    
    // Skip excluded paths
    if (options.excludePaths?.some(path => endpoint.includes(path))) {
      return next?.();
    }

    // Extract request info
    const clientInfo = extractClientInfo(request);
    const method = request.method || 'GET';
    
    try {
      // Log request start
      await logAuditEvent('api_request', `${method} ${endpoint}`, {
        severity: 'low',
        success: true,
        resource: endpoint,
        metadata: {
          method,
          userAgent: clientInfo.userAgent,
          body: options.includeBody ? request.body : undefined
        },
        request
      });

      // Continue with request processing
      const result = next?.();
      
      // Log successful completion if enabled
      if (options.logSuccess !== false) {
        const duration = Date.now() - startTime;
        await logAuditEvent('api_request', `${method} ${endpoint} completed`, {
          severity: 'low',
          success: true,
          resource: endpoint,
          duration,
          metadata: {
            method,
            statusCode: response?.status || 200
          },
          request
        });
      }

      return result;

    } catch (error: any) {
      // Log error
      const duration = Date.now() - startTime;
      await logAuditEvent('api_request', `${method} ${endpoint} failed`, {
        severity: 'medium',
        success: false,
        resource: endpoint,
        duration,
        errorCode: error.code || 'UNKNOWN',
        metadata: {
          method,
          error: error.message,
          stack: enableDebugMode ? error.stack : undefined
        },
        request
      });

      throw error; // Re-throw to maintain error handling
    }
  };
}

/**
 * Audit user authentication events
 */
export async function auditAuth(
  action: 'login' | 'logout' | 'login_failed' | 'token_refresh',
  userId?: string,
  options: {
    sessionId?: string;
    method?: string;
    reason?: string;
    request?: any;
  } = {}
): Promise<void> {
  const success = !action.includes('failed');
  const severity = success ? 'low' : 'medium';

  await logAuditEvent(
    action.includes('login') ? 'user_login' : 'user_logout',
    action,
    {
      severity,
      success,
      userId,
      sessionId: options.sessionId,
      metadata: {
        method: options.method,
        reason: options.reason
      },
      request: options.request
    }
  );
}

/**
 * Audit business operations
 */
export async function auditBusiness(
  action: 'created' | 'updated' | 'deleted' | 'viewed',
  businessId: string,
  options: {
    userId?: string;
    changes?: Record<string, any>;
    request?: any;
  } = {}
): Promise<void> {
  await logAuditEvent('business_updated', `Business ${action}`, {
    severity: action === 'deleted' ? 'medium' : 'low',
    success: true,
    businessId,
    userId: options.userId,
    changes: options.changes,
    request: options.request
  });
}

/**
 * Audit subscription changes
 */
export async function auditSubscription(
  action: 'created' | 'updated' | 'cancelled' | 'renewed',
  businessId: string,
  options: {
    userId?: string;
    oldPlan?: string;
    newPlan?: string;
    amount?: number;
    request?: any;
  } = {}
): Promise<void> {
  await logAuditEvent('subscription_changed', `Subscription ${action}`, {
    severity: 'medium',
    success: true,
    businessId,
    userId: options.userId,
    changes: {
      oldPlan: options.oldPlan,
      newPlan: options.newPlan,
      amount: options.amount
    },
    request: options.request
  });
}

/**
 * Audit form submissions
 */
export async function auditFormSubmission(
  formType: string,
  success: boolean,
  options: {
    userId?: string;
    businessId?: string;
    validationErrors?: string[];
    honeypotTriggered?: boolean;
    rateLimited?: boolean;
    request?: any;
  } = {}
): Promise<void> {
  const severity = success ? 'low' : 'medium';
  
  await logAuditEvent('form_submission', `${formType} form submission`, {
    severity,
    success,
    userId: options.userId,
    businessId: options.businessId,
    metadata: {
      formType,
      validationErrors: options.validationErrors,
      honeypotTriggered: options.honeypotTriggered,
      rateLimited: options.rateLimited
    },
    request: options.request
  });
}

/**
 * Get audit summary for dashboard
 */
export async function getAuditSummary(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<{
  totalEvents: number;
  securityEvents: number;
  failedRequests: number;
  topEvents: Array<{ type: string; count: number }>;
}> {
  const now = new Date();
  const startTime = new Date();
  
  switch (timeframe) {
    case 'hour':
      startTime.setHours(now.getHours() - 1);
      break;
    case 'week':
      startTime.setDate(now.getDate() - 7);
      break;
    default: // day
      startTime.setDate(now.getDate() - 1);
  }

  const events = await queryAuditEvents({ startTime, limit: 10000 });
  
  const securityEvents = events.filter(e => 
    e.type.includes('attack') || 
    e.type.includes('suspicious') || 
    e.severity === 'high' || 
    e.severity === 'critical'
  ).length;

  const failedRequests = events.filter(e => !e.success).length;

  // Count events by type
  const eventCounts: Record<string, number> = {};
  events.forEach(e => {
    eventCounts[e.type] = (eventCounts[e.type] || 0) + 1;
  });

  const topEvents = Object.entries(eventCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([type, count]) => ({ type, count }));

  return {
    totalEvents: events.length,
    securityEvents,
    failedRequests,
    topEvents
  };
}

export default {
  logAuditEvent,
  queryAuditEvents,
  createAuditMiddleware,
  auditAuth,
  auditBusiness,
  auditSubscription,
  auditFormSubmission,
  getAuditSummary
};
