/**
 * Notifications Module
 * 
 * This module provides functions for sending various types of notifications
 * to business owners and customers.
 */

import { sendSms } from './twilio';
import { trackOwnerAlert } from './monitoring';

/**
 * Send an urgent alert to a business owner when critical customer messages are received
 * @param {string} ownerPhone - The owner's phone number
 * @param {string} businessName - Name of the business
 * @param {string} businessId - ID of the business
 * @param {string} customerMessage - The customer's message content
 * @param {string} customerPhone - The customer's phone number
 * @param {string} fromNumber - Business Twilio number to send from
 * @param {string} detectionSource - How the urgency was detected
 * @returns {Promise<boolean>} - Whether the alert was successfully sent
 */
export async function sendUrgentOwnerAlert(
  ownerPhone: string,
  businessName: string,
  businessId: string,
  customerMessage: string,
  customerPhone: string,
  fromNumber: string,
  detectionSource: string
): Promise<boolean> {
  try {
    // Format the alert message
    const alertMessage = `🚨 Urgent Customer Message for ${businessName}: ${customerMessage}`;
    
    // Generate a request ID for tracking
    const requestId = Math.random().toString(36).substring(2, 10);
    
    // Send the message with priority (bypass rate limit)
    const message = await sendSms({
      body: alertMessage,
      from: fromNumber,
      to: ownerPhone,
      requestId,
      bypassRateLimit: true // Ensure this alert is prioritized
    });
    
    // Log the owner alert
    console.log(`[owner alert] Sent urgent message alert to owner: ${ownerPhone}`);
    
    // Track the owner alert
    await trackOwnerAlert({
      businessId,
      ownerPhone,
      customerPhone,
      alertType: 'urgent_message',
      messageContent: customerMessage,
      detectionSource,
      messageSid: message.sid,
      delivered: true,
      errorMessage: null
    }).catch(err => {
      console.error('Error tracking owner alert:', err);
    });
    
    return true;
  } catch (error) {
    console.error('Error sending owner alert:', error);
    
    // Track the failed owner alert
    await trackOwnerAlert({
      businessId,
      ownerPhone,
      customerPhone,
      alertType: 'urgent_message',
      messageContent: customerMessage,
      detectionSource,
      messageSid: '',
      delivered: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    }).catch(err => {
      console.error('Error tracking failed owner alert:', err);
    });
    
    return false;
  }
}
