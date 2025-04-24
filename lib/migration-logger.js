/**
 * Migration Logger
 * 
 * This module provides utilities for logging migration operations from Airtable to Supabase.
 * It logs operations to the supabase_migration_logs table to track the progress and success
 * of the migration.
 */

import { supabase } from './supabase';

/**
 * Log a migration operation
 * @param {Object} logData - The log data
 * @param {string} logData.operation - The operation being performed (e.g., 'read', 'write', 'update', 'delete')
 * @param {string} logData.entityType - The type of entity (e.g., 'business', 'call_event', 'sms_event')
 * @param {string} logData.entityId - The ID of the entity
 * @param {boolean} logData.airtableSuccess - Whether the operation was successful in Airtable
 * @param {boolean} logData.supabaseSuccess - Whether the operation was successful in Supabase
 * @param {string} [logData.errorMessage] - Optional error message if the operation failed
 * @returns {Promise<Object|null>} The created log entry or null if there was an error
 */
export async function logMigrationOperation({
  operation,
  entityType,
  entityId,
  airtableSuccess,
  supabaseSuccess,
  errorMessage = null
}) {
  try {
    const { data, error } = await supabase
      .from('supabase_migration_logs')
      .insert({
        operation,
        entity_type: entityType,
        entity_id: entityId,
        airtable_success: airtableSuccess,
        supabase_success: supabaseSuccess,
        error_message: errorMessage
      })
      .select();

    if (error) {
      console.error('Error logging migration operation:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in logMigrationOperation:', error);
    return null;
  }
}

/**
 * Get migration statistics for a specific entity type
 * @param {string} entityType - The type of entity to get statistics for
 * @returns {Promise<Object>} Statistics about the migration
 */
export async function getMigrationStats(entityType) {
  try {
    // Get total operations
    const { data: totalData, error: totalError } = await supabase
      .from('supabase_migration_logs')
      .select('count', { count: 'exact' })
      .eq('entity_type', entityType);

    if (totalError) {
      console.error('Error getting total migration operations:', totalError);
      return { total: 0, airtableSuccess: 0, supabaseSuccess: 0, bothSuccess: 0, error: totalError.message };
    }

    // Get successful Airtable operations
    const { data: airtableData, error: airtableError } = await supabase
      .from('supabase_migration_logs')
      .select('count', { count: 'exact' })
      .eq('entity_type', entityType)
      .eq('airtable_success', true);

    if (airtableError) {
      console.error('Error getting successful Airtable operations:', airtableError);
      return { total: totalData.count, airtableSuccess: 0, supabaseSuccess: 0, bothSuccess: 0, error: airtableError.message };
    }

    // Get successful Supabase operations
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('supabase_migration_logs')
      .select('count', { count: 'exact' })
      .eq('entity_type', entityType)
      .eq('supabase_success', true);

    if (supabaseError) {
      console.error('Error getting successful Supabase operations:', supabaseError);
      return { total: totalData.count, airtableSuccess: airtableData.count, supabaseSuccess: 0, bothSuccess: 0, error: supabaseError.message };
    }

    // Get operations that succeeded in both Airtable and Supabase
    const { data: bothData, error: bothError } = await supabase
      .from('supabase_migration_logs')
      .select('count', { count: 'exact' })
      .eq('entity_type', entityType)
      .eq('airtable_success', true)
      .eq('supabase_success', true);

    if (bothError) {
      console.error('Error getting operations that succeeded in both:', bothError);
      return { 
        total: totalData.count, 
        airtableSuccess: airtableData.count, 
        supabaseSuccess: supabaseData.count, 
        bothSuccess: 0, 
        error: bothError.message 
      };
    }

    return {
      total: totalData.count,
      airtableSuccess: airtableData.count,
      supabaseSuccess: supabaseData.count,
      bothSuccess: bothData.count,
      error: null
    };
  } catch (error) {
    console.error('Error in getMigrationStats:', error);
    return { total: 0, airtableSuccess: 0, supabaseSuccess: 0, bothSuccess: 0, error: error.message };
  }
}

/**
 * Get recent migration errors
 * @param {number} limit - The maximum number of errors to return
 * @returns {Promise<Array>} Recent migration errors
 */
export async function getRecentMigrationErrors(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('supabase_migration_logs')
      .select('*')
      .or('airtable_success.eq.false,supabase_success.eq.false')
      .not('error_message', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting recent migration errors:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRecentMigrationErrors:', error);
    return [];
  }
}
