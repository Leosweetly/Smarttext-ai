import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
 * @param {string} [subscriptionTier='basic'] - The subscription tier (basic, pro, enterprise)
 * @returns {Promise<string>} - The generated response message
 */
export async function generateMissedCallResponse(business, subscriptionTier = 'basic') {
  try {
    // For basic tier, use a simple template-based approach
    if (subscriptionTier === 'basic') {
      return `Hey thanks for calling ${business.name}. We're currently unavailable. Our hours are ${formatHours(business.hours)}. Please call back during our business hours or leave a message and we'll get back to you as soon as possible.`;
    }
    
    // For pro and enterprise tiers, use more advanced AI generation
    const systemPrompt = `You are an AI assistant for ${business.name}, a ${business.type} business. 
    You are responding to a missed call from a potential customer.
    Be friendly, professional, and helpful. Provide relevant information about the business.
    ${subscriptionTier === 'enterprise' ? 'Personalize the message as much as possible and suggest specific services or offerings.' : ''}`;
    
    const userPrompt = `Generate a text message response for a missed call to ${business.name}, a ${business.type}.
    Include the following information:
    - Business hours: ${formatHours(business.hours)}
    ${business.orderingLink ? `- Online ordering link: ${business.orderingLink}` : ''}
    ${business.quoteLink ? `- Quote request link: ${business.quoteLink}` : ''}
    ${business.customSettings?.additionalInfo ? `- Additional info: ${business.customSettings.additionalInfo}` : ''}
    
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
