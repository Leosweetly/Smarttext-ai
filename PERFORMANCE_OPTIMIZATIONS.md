# Performance Optimizations

This document outlines the performance optimizations implemented in the SmartText AI system to reduce API call volume and improve efficiency.

## Implemented Optimizations

### 1. In-Memory LRU Cache for Business Lookups

**Problem:** Every inbound call and missed-call webhook was making an Airtable API call to look up business information.

**Solution:** Implemented an in-memory LRU (Least Recently Used) cache in `lib/airtable.js` to store business information with a 5-minute TTL.

```javascript
// Create an LRU cache for business lookups with a 5-minute TTL
const businessCache = new LRU({
  maxSize: 100,
  maxAge: 5 * 60 * 1000 // 5 minutes in milliseconds
});
```

**Benefits:**
- Significantly reduces Airtable API calls for frequently accessed businesses
- Improves response time for call handling
- Maintains data freshness with a reasonable TTL

### 2. SMS Rate-Limiting

**Problem:** The system was sending SMS messages for every call, even for repeat spam or rapid redials from the same number.

**Solution:** Implemented a per-caller cooldown mechanism in `lib/twilio.ts` to prevent sending multiple SMS messages to the same caller within a short time period.

```javascript
// In-memory store for SMS rate limiting
const smsTimestamps = new Map<string, number>();

// Rate-limiting configuration
const SMS_COOLDOWN_PERIOD = 10 * 60 * 1000; // 10 minutes in milliseconds
```

**Benefits:**
- Prevents spamming callers with multiple texts
- Reduces Twilio API calls and associated costs
- Improves user experience by avoiding message fatigue

## Future Optimizations

### 1. Distributed Caching

**Current:** In-memory caches are isolated to each serverless function instance.

**Future Enhancement:** Implement Redis or another distributed cache to share data across all instances.

```javascript
// Example Redis implementation
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL
});

async function getBusinessFromCache(key) {
  const cached = await redisClient.get(key);
  return cached ? JSON.parse(cached) : null;
}

async function setBusinessInCache(key, data, ttl = 300) {
  await redisClient.set(key, JSON.stringify(data), { EX: ttl });
}
```

### 2. Bulk Airtable Operations

**Current:** Each Airtable write is a separate HTTP request.

**Future Enhancement:** Use Airtable's bulk API to update multiple records in a single request.

```javascript
// Example bulk create implementation
export async function bulkCreateRecords(tableName, records) {
  const table = getTable(tableName);
  
  // Airtable allows up to 10 records per create operation
  const chunks = [];
  for (let i = 0; i < records.length; i += 10) {
    chunks.push(records.slice(i, i + 10));
  }
  
  const results = [];
  for (const chunk of chunks) {
    const chunkResults = await table.create(chunk);
    results.push(...chunkResults);
  }
  
  return results;
}
```

### 3. Message Queue for SMS

**Current:** SMS messages are sent synchronously during request handling.

**Future Enhancement:** Implement a queue system to batch-send messages and handle retries more efficiently.

```javascript
// Example queue-based SMS sending
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({ region: 'us-west-2' });

export async function queueSms({ body, from, to, requestId = '' }) {
  const command = new SendMessageCommand({
    QueueUrl: process.env.SMS_QUEUE_URL,
    MessageBody: JSON.stringify({ body, from, to, requestId }),
    MessageGroupId: to // Group by recipient for FIFO queues
  });
  
  return sqsClient.send(command);
}
```

## Monitoring and Metrics

To track the effectiveness of these optimizations, we should monitor:

1. **Cache Hit Rate:** Percentage of business lookups served from cache
2. **Rate-Limited SMS:** Count of SMS messages prevented by rate-limiting
3. **API Call Volume:** Total number of Airtable and Twilio API calls
4. **Response Time:** Average time to handle incoming calls and webhooks

## Configuration

The current implementation uses hardcoded values for cache size and TTL. In the future, these could be moved to environment variables for easier configuration:

```
# Cache configuration
BUSINESS_CACHE_SIZE=100
BUSINESS_CACHE_TTL_SECONDS=300

# Rate-limiting configuration
SMS_COOLDOWN_PERIOD_MINUTES=10
```

## Testing

To test these optimizations:

1. **Business Cache:** Make multiple requests for the same business and verify only the first one hits Airtable
2. **SMS Rate-Limiting:** Simulate multiple calls from the same number within the cooldown period and verify only one SMS is sent
