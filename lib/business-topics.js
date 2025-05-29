/**
 * Business Topics Utility
 * 
 * This module provides functions to generate relevant topics based on business type
 * for use in auto-text messages and other communications.
 */

/**
 * Map of business types to relevant topics
 * Each business type has an array of topics that might be relevant to customers
 */
const BUSINESS_TYPE_TOPICS = {
  restaurant: [
    'placing an order',
    'making a reservation',
    'checking menu options',
    'inquiring about catering',
    'asking about dietary accommodations'
  ],
  auto_shop: [
    'scheduling a repair',
    'getting a quote',
    'checking on vehicle status',
    'inquiring about parts availability',
    'booking a maintenance service'
  ],
  salon: [
    'booking an appointment',
    'checking service availability',
    'inquiring about pricing',
    'asking about specific treatments',
    'checking stylist availability'
  ],
  home_services: [
    'scheduling a service call',
    'getting a quote',
    'inquiring about emergency services',
    'checking service areas',
    'asking about specific repairs'
  ],
  retail: [
    'checking product availability',
    'inquiring about store hours',
    'asking about current promotions',
    'checking order status',
    'inquiring about returns'
  ],
  healthcare: [
    'scheduling an appointment',
    'inquiring about services',
    'checking insurance coverage',
    'requesting medical records',
    'asking about specific treatments'
  ],
  fitness: [
    'inquiring about membership',
    'checking class schedules',
    'booking a personal training session',
    'asking about facilities',
    'inquiring about specific programs'
  ],
  professional_services: [
    'scheduling a consultation',
    'inquiring about services',
    'asking about rates',
    'checking availability',
    'requesting information'
  ],
  real_estate: [
    'scheduling a viewing',
    'inquiring about listings',
    'asking about property management',
    'checking availability',
    'requesting market information'
  ],
  education: [
    'inquiring about programs',
    'checking enrollment availability',
    'asking about tuition',
    'scheduling a tour',
    'requesting information'
  ],
  hospitality: [
    'checking room availability',
    'making a reservation',
    'inquiring about amenities',
    'asking about special rates',
    'checking check-in/check-out times'
  ],
  entertainment: [
    'checking event schedules',
    'purchasing tickets',
    'inquiring about venue details',
    'asking about private bookings',
    'checking age restrictions'
  ],
  other: [
    'scheduling an appointment',
    'requesting information',
    'inquiring about services',
    'checking availability',
    'asking about pricing'
  ]
};

/**
 * Get relevant topics for a business type
 * @param {string} businessType - The type of business
 * @param {number} [count=2] - Number of topics to return (default: 2)
 * @returns {string[]} - Array of relevant topics
 */
function getTopicsForBusinessType(businessType, count = 2) {
  // Normalize business type to match our keys
  const normalizedType = businessType?.toLowerCase().replace(/\s+/g, '_') || 'other';
  
  // Get topics for the business type, or fall back to 'other'
  const topics = BUSINESS_TYPE_TOPICS[normalizedType] || BUSINESS_TYPE_TOPICS.other;
  
  // Return the requested number of topics (or all if count > available topics)
  return topics.slice(0, count);
}

/**
 * Format topics into a readable string
 * @param {string[]} topics - Array of topics
 * @returns {string} - Formatted string (e.g., "placing an order or making a reservation")
 */
function formatTopics(topics) {
  if (!topics || topics.length === 0) {
    return '';
  }
  
  if (topics.length === 1) {
    return topics[0];
  }
  
  if (topics.length === 2) {
    return `${topics[0]} or ${topics[1]}`;
  }
  
  // For more than 2 topics (though we typically limit to 2)
  const lastTopic = topics[topics.length - 1];
  const otherTopics = topics.slice(0, -1).join(', ');
  return `${otherTopics}, or ${lastTopic}`;
}

/**
 * Generate a formatted topics string for a business type
 * @param {string} businessType - The type of business
 * @param {number} [count=2] - Number of topics to include
 * @returns {string} - Formatted topics string
 */
function getFormattedTopicsForBusinessType(businessType, count = 2) {
  const topics = getTopicsForBusinessType(businessType, count);
  return formatTopics(topics);
}

module.exports = {
  getTopicsForBusinessType,
  formatTopics,
  getFormattedTopicsForBusinessType,
  BUSINESS_TYPE_TOPICS
};
