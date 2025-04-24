# Future Hardening Ideas for Supabase Integration

This document outlines future improvements to enhance the Supabase integration after the initial migration is complete.

## 1. Distributed Cache (Redis or Supabase KV)

### Why
The current LRU cache is per-instance; on serverless scale-out, you'll get cold misses. A distributed cache ensures consistent performance across all instances.

### Implementation Sketch
```javascript
// Using Redis with ioredis
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const CACHE_TTL = 300; // 5 minutes in seconds

async function getBusinessByPhoneNumberWithCache(phoneNumber) {
  const cacheKey = `business:${phoneNumber}`;
  
  // Try to get from cache first
  const cachedBusiness = await redis.get(cacheKey);
  if (cachedBusiness) {
    return JSON.parse(cachedBusiness);
  }
  
  // If not in cache, fetch from Supabase
  const { data: business, error } = await supabase
    .from('businesses')
    .select('*')
    .or(`public_phone.eq.${phoneNumber},twilio_phone.eq.${phoneNumber}`)
    .maybeSingle();
    
  if (error) throw error;
  
  // Store in cache if found
  if (business) {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(business));
  }
  
  return business;
}
```

## 2. Message Queue for SMS

### Why
Provides burst protection & retries; one Twilio call per job. This helps prevent rate limiting and ensures messages are delivered even during high load.

### Implementation Sketch
```javascript
// Using Supabase Realtime for the queue
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Producer: Add message to queue
async function queueSms(message) {
  const { data, error } = await supabase
    .from('sms_queue')
    .insert({
      to: message.to,
      from: message.from,
      body: message.body,
      status: 'pending',
      attempts: 0,
      max_attempts: 3
    });
    
  if (error) throw error;
  return data;
}

// Consumer: Process messages from queue
async function processSmsQueue() {
  // Get pending messages
  const { data: messages, error } = await supabase
    .from('sms_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10);
    
  if (error) throw error;
  
  for (const message of messages) {
    try {
      // Apply cooldown logic here if needed
      
      // Send the message via Twilio
      const twilioMessage = await twilioClient.messages.create({
        body: message.body,
        from: message.from,
        to: message.to
      });
      
      // Update status to sent
      await supabase
        .from('sms_queue')
        .update({ status: 'sent', twilio_sid: twilioMessage.sid })
        .eq('id', message.id);
        
    } catch (error) {
      // Increment attempts and update status
      const newAttempts = message.attempts + 1;
      const newStatus = newAttempts >= message.max_attempts ? 'failed' : 'pending';
      
      await supabase
        .from('sms_queue')
        .update({ 
          status: newStatus, 
          attempts: newAttempts,
          last_error: error.message
        })
        .eq('id', message.id);
    }
  }
}

// Run the consumer on a schedule
setInterval(processSmsQueue, 10000); // Every 10 seconds
```

## 3. Admin UI on Supabase

### Why
Replace Airtable's spreadsheet UX with a custom admin interface that leverages Supabase's authentication and row-level security.

### Implementation Sketch
```jsx
// Using Next.js with TanStack Table and Supabase Auth
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useTable, usePagination, useSortBy } from '@tanstack/react-table';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function BusinessesTable() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchBusinesses() {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) {
        console.error('Error fetching businesses:', error);
      } else {
        setBusinesses(data || []);
      }
      
      setLoading(false);
    }
    
    fetchBusinesses();
  }, []);
  
  const columns = [
    {
      Header: 'Name',
      accessor: 'name',
    },
    {
      Header: 'Public Phone',
      accessor: 'public_phone',
    },
    {
      Header: 'Twilio Phone',
      accessor: 'twilio_phone',
    },
    {
      Header: 'Business Type',
      accessor: 'business_type',
    },
    {
      Header: 'Actions',
      Cell: ({ row }) => (
        <div>
          <button onClick={() => handleEdit(row.original)}>Edit</button>
          <button onClick={() => handleDelete(row.original.id)}>Delete</button>
        </div>
      ),
    },
  ];
  
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data: businesses,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useSortBy,
    usePagination
  );
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? ' 🔽'
                        : ' 🔼'
                      : ''}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

## 4. Automatic 10DLC Registration

### Why
Keeps deliverability high as volume grows. 10DLC (10-digit long code) registration is required by carriers for high-volume SMS sending to ensure compliance and reduce spam.

### Implementation Sketch
```javascript
// Supabase table for tracking brand & campaign status
// nightly cron job to sync with Twilio

import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncTwilio10DLCStatus() {
  try {
    // Get all businesses with Twilio numbers
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, twilio_phone')
      .not('twilio_phone', 'is', null);
      
    if (error) throw error;
    
    for (const business of businesses) {
      // Check if the number is registered for 10DLC
      const phoneNumber = await twilioClient.incomingPhoneNumbers
        .list({ phoneNumber: business.twilio_phone })
        .then(numbers => numbers[0]);
        
      if (!phoneNumber) continue;
      
      // Check if the number is part of a messaging service with 10DLC
      const messagingServices = await twilioClient.messaging.services
        .list({ phoneNumber: business.twilio_phone });
        
      const has10DLC = messagingServices.some(service => 
        service.usecase === '10DLC' || service.usecase === 'MIXED' || service.usecase === 'STANDARD'
      );
      
      // Update the business record with 10DLC status
      await supabase
        .from('businesses')
        .update({
          custom_settings: {
            ...business.custom_settings,
            has10DLC,
            lastTwilioSync: new Date().toISOString()
          }
        })
        .eq('id', business.id);
        
      // If not registered, create a task to register
      if (!has10DLC) {
        await supabase
          .from('tasks')
          .insert({
            type: '10DLC_REGISTRATION',
            status: 'pending',
            business_id: business.id,
            data: {
              twilio_phone: business.twilio_phone,
              business_name: business.name
            }
          });
      }
    }
    
    console.log('Successfully synced 10DLC status with Twilio');
  } catch (error) {
    console.error('Error syncing 10DLC status:', error);
  }
}

// Run this function on a nightly cron job
```

## Implementation Priority

1. **Distributed Cache**: Highest priority as it directly impacts performance and user experience.
2. **Message Queue for SMS**: Important for reliability and handling high volumes.
3. **Admin UI**: Valuable for operations team but can be implemented gradually.
4. **10DLC Registration**: Important as volume grows, but can be implemented later.

## Next Steps

1. Evaluate Redis vs. Supabase KV for the distributed cache implementation
2. Design the schema for the SMS queue table
3. Create wireframes for the admin UI
4. Research Twilio's 10DLC registration requirements and API
