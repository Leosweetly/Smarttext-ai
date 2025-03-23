import { cookies } from 'next/headers';

/**
 * Airtable OAuth client for making authenticated requests to the Airtable API
 * This client handles token management and provides methods for common operations
 */

// Constants
const AIRTABLE_API_BASE_URL = 'https://api.airtable.com/v0';
const AIRTABLE_META_API_URL = 'https://api.airtable.com/v0/meta';

/**
 * Get the current Airtable access token from cookies
 * If the access token is not available but a refresh token is, attempt to refresh
 * 
 * @returns {Promise<string|null>} The access token or null if not available
 */
export async function getAirtableAccessToken() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('airtable_access_token')?.value;
  const refreshToken = cookieStore.get('airtable_refresh_token')?.value;
  
  if (!accessToken && refreshToken) {
    // Token expired, try to refresh
    return refreshAirtableToken(refreshToken);
  }
  
  return accessToken;
}

/**
 * Refresh the Airtable access token using a refresh token
 * 
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<string|null>} The new access token or null if refresh failed
 */
async function refreshAirtableToken(refreshToken) {
  try {
    const response = await fetch('https://airtable.com/oauth2/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }
    
    const tokenData = await response.json();
    
    // Update cookies with new tokens
    const cookieStore = cookies();
    
    // Set access token cookie
    cookieStore.set({
      name: 'airtable_access_token',
      value: tokenData.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokenData.expires_in,
      path: '/'
    });
    
    // Set refresh token cookie if a new one was provided
    if (tokenData.refresh_token) {
      cookieStore.set({
        name: 'airtable_refresh_token',
        value: tokenData.refresh_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      });
    }
    
    return tokenData.access_token;
  } catch (error) {
    console.error('Error refreshing Airtable token:', error);
    return null;
  }
}

/**
 * Make an authenticated request to the Airtable API
 * 
 * @param {string} endpoint - The API endpoint (without the base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} The response data
 */
export async function fetchFromAirtable(endpoint, options = {}) {
  const accessToken = await getAirtableAccessToken();
  
  if (!accessToken) {
    throw new Error('No Airtable access token available. Please connect to Airtable first.');
  }
  
  const url = `${AIRTABLE_API_BASE_URL}/${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Airtable API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
  }
  
  return response.json();
}

/**
 * Get records from a table
 * 
 * @param {string} baseId - The Airtable base ID
 * @param {string} tableName - The table name
 * @param {Object} options - Query options
 * @returns {Promise<Array>} The records
 */
export async function getRecords(baseId, tableName, options = {}) {
  const queryParams = new URLSearchParams();
  
  if (options.maxRecords) {
    queryParams.append('maxRecords', options.maxRecords);
  }
  
  if (options.view) {
    queryParams.append('view', options.view);
  }
  
  if (options.filterByFormula) {
    queryParams.append('filterByFormula', options.filterByFormula);
  }
  
  const endpoint = `${baseId}/${encodeURIComponent(tableName)}?${queryParams}`;
  const data = await fetchFromAirtable(endpoint);
  
  return data.records;
}

/**
 * Get a record by ID
 * 
 * @param {string} baseId - The Airtable base ID
 * @param {string} tableName - The table name
 * @param {string} recordId - The record ID
 * @returns {Promise<Object>} The record
 */
export async function getRecord(baseId, tableName, recordId) {
  const endpoint = `${baseId}/${encodeURIComponent(tableName)}/${recordId}`;
  return fetchFromAirtable(endpoint);
}

/**
 * Create a record
 * 
 * @param {string} baseId - The Airtable base ID
 * @param {string} tableName - The table name
 * @param {Object} fields - The record fields
 * @returns {Promise<Object>} The created record
 */
export async function createRecord(baseId, tableName, fields) {
  const endpoint = `${baseId}/${encodeURIComponent(tableName)}`;
  
  return fetchFromAirtable(endpoint, {
    method: 'POST',
    body: JSON.stringify({ fields })
  });
}

/**
 * Update a record
 * 
 * @param {string} baseId - The Airtable base ID
 * @param {string} tableName - The table name
 * @param {string} recordId - The record ID
 * @param {Object} fields - The fields to update
 * @returns {Promise<Object>} The updated record
 */
export async function updateRecord(baseId, tableName, recordId, fields) {
  const endpoint = `${baseId}/${encodeURIComponent(tableName)}/${recordId}`;
  
  return fetchFromAirtable(endpoint, {
    method: 'PATCH',
    body: JSON.stringify({ fields })
  });
}

/**
 * Delete a record
 * 
 * @param {string} baseId - The Airtable base ID
 * @param {string} tableName - The table name
 * @param {string} recordId - The record ID
 * @returns {Promise<Object>} The deletion response
 */
export async function deleteRecord(baseId, tableName, recordId) {
  const endpoint = `${baseId}/${encodeURIComponent(tableName)}/${recordId}`;
  
  return fetchFromAirtable(endpoint, {
    method: 'DELETE'
  });
}

/**
 * Get base metadata
 * 
 * @param {string} baseId - The Airtable base ID
 * @returns {Promise<Object>} The base metadata
 */
export async function getBaseMetadata(baseId) {
  const accessToken = await getAirtableAccessToken();
  
  if (!accessToken) {
    throw new Error('No Airtable access token available. Please connect to Airtable first.');
  }
  
  const url = `${AIRTABLE_META_API_URL}/bases/${baseId}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Airtable API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
  }
  
  return response.json();
}

/**
 * Get tables in a base
 * 
 * @param {string} baseId - The Airtable base ID
 * @returns {Promise<Array>} The tables
 */
export async function getTables(baseId) {
  const accessToken = await getAirtableAccessToken();
  
  if (!accessToken) {
    throw new Error('No Airtable access token available. Please connect to Airtable first.');
  }
  
  const url = `${AIRTABLE_META_API_URL}/bases/${baseId}/tables`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Airtable API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
  }
  
  const data = await response.json();
  return data.tables;
}

/**
 * Check if the user is connected to Airtable
 * 
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
export async function isConnectedToAirtable() {
  const accessToken = await getAirtableAccessToken();
  return !!accessToken;
}
