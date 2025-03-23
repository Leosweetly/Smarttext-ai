import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Predefined list of common business types
export const BUSINESS_TYPES = [
  { id: 'restaurant', name: 'Restaurant', description: 'Food service establishment including cafes, diners, and eateries' },
  { id: 'auto_shop', name: 'Auto Shop', description: 'Automotive repair and maintenance services' },
  { id: 'salon', name: 'Salon', description: 'Hair, beauty, and personal care services' },
  { id: 'home_services', name: 'Home Services', description: 'Home repair, maintenance, and improvement services' },
  { id: 'retail', name: 'Retail Store', description: 'Shops selling products directly to consumers' },
  { id: 'healthcare', name: 'Healthcare', description: 'Medical practices, clinics, and healthcare providers' },
  { id: 'fitness', name: 'Fitness', description: 'Gyms, fitness studios, and wellness centers' },
  { id: 'professional_services', name: 'Professional Services', description: 'Legal, accounting, consulting, and other professional services' },
  { id: 'real_estate', name: 'Real Estate', description: 'Property management, sales, and leasing services' },
  { id: 'education', name: 'Education', description: 'Schools, tutoring centers, and educational services' },
  { id: 'hospitality', name: 'Hospitality', description: 'Hotels, motels, and accommodation services' },
  { id: 'entertainment', name: 'Entertainment', description: 'Venues for events, performances, and recreational activities' },
  { id: 'other', name: 'Other', description: 'Other business types not listed above' }
];

/**
 * Detect the most likely business type based on business information
 * @param {Object} businessInfo - Information about the business
 * @param {string} businessInfo.name - The name of the business
 * @param {string} [businessInfo.description] - Description of the business
 * @param {string} [businessInfo.website] - Business website URL
 * @param {string} [businessInfo.address] - Business address
 * @param {Array<string>} [businessInfo.keywords] - Keywords related to the business
 * @returns {Promise<{detectedType: string, confidence: number, alternativeTypes: Array<{type: string, confidence: number}>}>}
 */
export async function detectBusinessType(businessInfo) {
  try {
    // Create a list of business type IDs for the model to choose from
    const businessTypeIds = BUSINESS_TYPES.map(type => type.id).join(', ');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that analyzes business information to determine the most likely business type.
          You will be provided with information about a business, and your task is to:
          1. Determine the most likely business type from this list: ${businessTypeIds}
          2. Assign a confidence score (0-100) to your determination
          3. Suggest alternative business types that might also apply, with their confidence scores
          
          Respond in JSON format with the detected type, confidence score, and alternative types.`
        },
        {
          role: "user",
          content: `Analyze this business information and determine the most likely business type:
          
          Business Name: ${businessInfo.name}
          ${businessInfo.description ? `Description: ${businessInfo.description}` : ''}
          ${businessInfo.website ? `Website: ${businessInfo.website}` : ''}
          ${businessInfo.address ? `Address: ${businessInfo.address}` : ''}
          ${businessInfo.keywords ? `Keywords: ${businessInfo.keywords.join(', ')}` : ''}
          
          Respond with the detected business type, confidence score, and alternative types in JSON format.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Ensure the result has the expected structure
    return {
      detectedType: result.detectedType || 'other',
      confidence: result.confidence || 70,
      alternativeTypes: result.alternativeTypes || []
    };
  } catch (error) {
    console.error("Error detecting business type:", error);
    // Return a default response if OpenAI fails
    return {
      detectedType: 'other',
      confidence: 50,
      alternativeTypes: []
    };
  }
}

/**
 * Generate industry-specific questions based on business type
 * @param {string} businessType - The type of business (e.g., restaurant, auto shop, salon)
 * @returns {Promise<Array<{question: string, defaultAnswer: string}>>} - Array of generated questions with default answers
 */
export async function generateIndustryQuestions(businessType) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that generates relevant FAQ questions and default answers for businesses based on their industry. 
          The questions should be common inquiries that customers might have about businesses in this industry.
          Provide 5 questions and default answers that would be useful for a ${businessType}.`
        },
        {
          role: "user",
          content: `Generate 5 frequently asked questions and default answers for a ${businessType} business. 
          Format the response as a JSON array of objects with 'question' and 'defaultAnswer' properties.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.faqs || [];
  } catch (error) {
    console.error("Error generating industry questions:", error);
    // Return some default questions if OpenAI fails
    return [
      {
        question: "What are your hours?",
        defaultAnswer: "Our regular business hours are Monday to Friday from 9 AM to 5 PM, Saturday from 10 AM to 3 PM, and we're closed on Sunday."
      },
      {
        question: "How can I contact you?",
        defaultAnswer: "You can reach us by phone at our business number, or send us an email at info@yourbusiness.com."
      },
      {
        question: "Do you offer any discounts?",
        defaultAnswer: "We occasionally offer seasonal promotions and discounts. Please call us or check our website for current offers."
      }
    ];
  }
}

/**
 * Generate a custom response for a missed call based on business type and information
 * @param {Object} business - The business information
 * @param {string} business.type - The type of business
 * @param {string} business.name - The name of the business
 * @param {Object} business.hours - The business hours
 * @param {Object} [business.customSettings] - Any custom settings for AI responses
 * @param {Array} [business.locations] - Array of location objects (for multi-location businesses)
 * @param {string} [subscriptionTier='basic'] - The subscription tier (basic, pro, enterprise)
 * @param {boolean} [hasMultipleLocations=false] - Whether the business has multiple locations
 * @returns {Promise<string>} - The generated response message
 */
export async function generateMissedCallResponse(business, subscriptionTier = 'basic', hasMultipleLocations = false) {
  try {
    // Ensure business type is valid, or detect it if not provided
    let businessType = business.type || 'other';
    
    // If business type is not in our predefined list, try to detect it
    if (!BUSINESS_TYPES.some(type => type.id === businessType)) {
      try {
        const detectionResult = await detectBusinessType({
          name: business.name,
          description: business.description || '',
          keywords: business.keywords || []
        });
        
        // Use the detected type if confidence is high enough (>70%)
        if (detectionResult.confidence > 70) {
          businessType = detectionResult.detectedType;
          console.log(`Detected business type for ${business.name}: ${businessType} (${detectionResult.confidence}% confidence)`);
        }
      } catch (detectionError) {
        console.error("Error detecting business type:", detectionError);
        // Continue with the original type or 'other'
      }
    }
    
    // For basic tier, use a simple template-based approach with industry-specific elements
    if (subscriptionTier === 'basic') {
      if (hasMultipleLocations && business.locations && business.locations.length > 0) {
        return `Hey thanks for calling ${business.name}. We're currently unavailable. We have ${business.locations.length} locations to serve you. Please call back during our business hours or leave a message and we'll get back to you as soon as possible.`;
      } else {
        // Add industry-specific elements to basic template
        let additionalInfo = '';
        
        switch (businessType) {
          case 'restaurant':
            additionalInfo = business.orderingLink ? ` You can also order online at ${business.orderingLink}.` : '';
            break;
          case 'auto_shop':
            additionalInfo = business.quoteLink ? ` For a service quote, visit ${business.quoteLink}.` : '';
            break;
          case 'healthcare':
            additionalInfo = ' For medical emergencies, please call 911.';
            break;
          case 'salon':
            additionalInfo = business.bookingLink ? ` Book an appointment online at ${business.bookingLink}.` : '';
            break;
          // Add more industry-specific templates as needed
        }
        
        return `Hey thanks for calling ${business.name}. We're currently unavailable. Our hours are ${formatHours(business.hours)}.${additionalInfo} Please call back during our business hours or leave a message and we'll get back to you as soon as possible.`;
      }
    }
    
    // For pro and enterprise tiers, use more advanced AI generation with industry-specific guidance
    const systemPrompt = `You are an AI assistant for ${business.name}, a ${businessType} business. 
    You are responding to a missed call from a potential customer.
    Be friendly, professional, and helpful. Provide relevant information about the business.
    ${hasMultipleLocations ? `This business has multiple locations. Mention this fact and invite the customer to visit their nearest location.` : ''}
    ${subscriptionTier === 'enterprise' ? 'Personalize the message as much as possible and suggest specific services or offerings.' : ''}
    
    Based on the business type "${businessType}", include industry-specific information:
    ${businessType === 'restaurant' ? '- Mention food ordering options, popular dishes, or delivery services if available.' : ''}
    ${businessType === 'auto_shop' ? '- Mention service appointments, quotes, or common repair services.' : ''}
    ${businessType === 'salon' ? '- Mention booking appointments, popular services, or styling options.' : ''}
    ${businessType === 'healthcare' ? '- Mention appointment scheduling, patient portal, or emergency information.' : ''}
    ${businessType === 'home_services' ? '- Mention service areas, common services, or emergency availability.' : ''}
    ${businessType === 'retail' ? '- Mention product categories, online shopping options, or current promotions.' : ''}
    ${businessType === 'professional_services' ? '- Mention consultation options, service areas, or client portal information.' : ''}`;
    
    const userPrompt = `Generate a text message response for a missed call to ${business.name}, a ${businessType} business.
    Include the following information:
    - Business hours: ${formatHours(business.hours)}
    ${business.orderingLink ? `- Online ordering link: ${business.orderingLink}` : ''}
    ${business.quoteLink ? `- Quote request link: ${business.quoteLink}` : ''}
    ${business.bookingLink ? `- Booking link: ${business.bookingLink}` : ''}
    ${business.websiteUrl ? `- Website: ${business.websiteUrl}` : ''}
    ${business.customSettings?.additionalInfo ? `- Additional info: ${business.customSettings.additionalInfo}` : ''}
    ${hasMultipleLocations && business.locations ? `- Multiple locations: ${business.locations.length} locations available` : ''}
    
    Keep the message concise (under 160 characters if possible) and make it sound natural.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: subscriptionTier === 'enterprise' ? 0.7 : 0.5,
      max_tokens: 200,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating missed call response:", error);
    // Fallback to a simple template if OpenAI fails
    return `Thanks for calling ${business.name}. We're currently unavailable. Please call back during our business hours: ${formatHours(business.hours)}.`;
  }
}

/**
 * Format business hours into a readable string
 * @param {Object} hours - The business hours object
 * @returns {string} - Formatted hours string
 */
function formatHours(hours) {
  if (!hours || Object.keys(hours).length === 0) {
    return "Please contact us for our business hours";
  }
  
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const formattedHours = [];
  
  // Group consecutive days with the same hours
  let currentGroup = { days: [], hours: "" };
  
  daysOfWeek.forEach(day => {
    const dayHours = hours[day];
    
    if (!dayHours) return;
    
    if (currentGroup.hours === "" || currentGroup.hours === dayHours) {
      currentGroup.days.push(day);
      currentGroup.hours = dayHours;
    } else {
      // Save the current group and start a new one
      if (currentGroup.days.length > 0) {
        formattedHours.push(formatDayGroup(currentGroup));
      }
      currentGroup = { days: [day], hours: dayHours };
    }
  });
  
  // Add the last group
  if (currentGroup.days.length > 0) {
    formattedHours.push(formatDayGroup(currentGroup));
  }
  
  return formattedHours.join(", ");
}

/**
 * Format a group of days with the same hours
 * @param {Object} group - The group object with days and hours
 * @returns {string} - Formatted string for the group
 */
function formatDayGroup(group) {
  if (group.days.length === 1) {
    return `${group.days[0]}: ${group.hours}`;
  } else if (group.days.length === 2) {
    return `${group.days[0]} and ${group.days[1]}: ${group.hours}`;
  } else {
    return `${group.days[0]}-${group.days[group.days.length - 1]}: ${group.hours}`;
  }
}

/**
 * Generate a location-specific response for a missed call
 * @param {Object} location - The location information
 * @param {Object} [business] - The parent business information (optional)
 * @param {string} [subscriptionTier='basic'] - The subscription tier (basic, pro, enterprise)
 * @returns {Promise<string>} - The generated response message
 */
export async function generateLocationMissedCallResponse(location, business, subscriptionTier = 'basic') {
  try {
    // Determine business type
    let businessType = (business && business.type) || location.type || 'other';
    
    // If business type is not in our predefined list, try to detect it
    if (!BUSINESS_TYPES.some(type => type.id === businessType)) {
      try {
        // Combine business and location information for better detection
        const detectionResult = await detectBusinessType({
          name: location.name + (business ? ` (${business.name})` : ''),
          description: location.description || (business ? business.description : '') || '',
          keywords: location.keywords || (business ? business.keywords : []) || []
        });
        
        // Use the detected type if confidence is high enough (>70%)
        if (detectionResult.confidence > 70) {
          businessType = detectionResult.detectedType;
          console.log(`Detected business type for ${location.name}: ${businessType} (${detectionResult.confidence}% confidence)`);
        }
      } catch (detectionError) {
        console.error("Error detecting business type for location:", detectionError);
        // Continue with the original type or 'other'
      }
    }
    
    // For basic tier, use a simple template-based approach with industry-specific elements
    if (subscriptionTier === 'basic') {
      // Add industry-specific elements to basic template
      let additionalInfo = '';
      
      switch (businessType) {
        case 'restaurant':
          additionalInfo = location.orderingLink ? ` You can also order online at ${location.orderingLink}.` : '';
          break;
        case 'auto_shop':
          additionalInfo = location.quoteLink ? ` For a service quote, visit ${location.quoteLink}.` : '';
          break;
        case 'healthcare':
          additionalInfo = ' For medical emergencies, please call 911.';
          break;
        case 'salon':
          additionalInfo = location.bookingLink ? ` Book an appointment online at ${location.bookingLink}.` : '';
          break;
        // Add more industry-specific templates as needed
      }
      
      return `Hey thanks for calling ${location.name}${business ? ` at ${business.name}` : ''}. We're currently unavailable. Our hours are ${formatHours(location.hours)}.${additionalInfo} Please call back during our business hours or leave a message and we'll get back to you as soon as possible.`;
    }
    
    // For pro and enterprise tiers, use more advanced AI generation with industry-specific guidance
    const systemPrompt = `You are an AI assistant for ${location.name}${business ? `, a location of ${business.name}` : ''}.
    You are responding to a missed call from a potential customer who called this specific location.
    Be friendly, professional, and helpful. Provide relevant information about this location.
    ${subscriptionTier === 'enterprise' ? 'Personalize the message as much as possible and suggest specific services or offerings available at this location.' : ''}
    
    Based on the business type "${businessType}", include industry-specific information:
    ${businessType === 'restaurant' ? '- Mention food ordering options, popular dishes, or delivery services if available.' : ''}
    ${businessType === 'auto_shop' ? '- Mention service appointments, quotes, or common repair services.' : ''}
    ${businessType === 'salon' ? '- Mention booking appointments, popular services, or styling options.' : ''}
    ${businessType === 'healthcare' ? '- Mention appointment scheduling, patient portal, or emergency information.' : ''}
    ${businessType === 'home_services' ? '- Mention service areas, common services, or emergency availability.' : ''}
    ${businessType === 'retail' ? '- Mention product categories, online shopping options, or current promotions.' : ''}
    ${businessType === 'professional_services' ? '- Mention consultation options, service areas, or client portal information.' : ''}`;
    
    const userPrompt = `Generate a text message response for a missed call to ${location.name}${business ? ` (part of ${business.name})` : ''}, a ${businessType} business.
    Include the following information:
    - Location name: ${location.name}
    - Location address: ${location.address || 'Address not available'}
    - Location hours: ${formatHours(location.hours)}
    - Manager: ${location.managerName || 'Not specified'}
    ${location.orderingLink ? `- Online ordering link: ${location.orderingLink}` : ''}
    ${location.quoteLink ? `- Quote request link: ${location.quoteLink}` : ''}
    ${location.bookingLink ? `- Booking link: ${location.bookingLink}` : ''}
    ${location.websiteUrl ? `- Website: ${location.websiteUrl}` : ''}
    ${location.autoReplyTemplates?.greeting ? `- Custom greeting: ${location.autoReplyTemplates.greeting}` : ''}
    ${location.customSettings?.additionalInfo ? `- Additional info: ${location.customSettings.additionalInfo}` : ''}
    
    Keep the message concise (under 160 characters if possible) and make it sound natural.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: subscriptionTier === 'enterprise' ? 0.7 : 0.5,
      max_tokens: 200,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating location-specific missed call response:", error);
    // Fallback to a simple template if OpenAI fails
    return `Thanks for calling ${location.name}${business ? ` at ${business.name}` : ''}. We're currently unavailable. Please call back during our business hours: ${formatHours(location.hours)}.`;
  }
}
