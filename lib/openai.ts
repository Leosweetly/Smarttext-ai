/**
 * Handle an incoming SMS based on business FAQs
 * @param {Object} business - The business object from Supabase
 * @returns {Promise<string>} - The response message
 */
export async function handleIncomingSms(args: any): Promise<string> {
  console.log('handleIncomingSms called with:', args);
  return 'Thanks for texting!';
}

/**
 * Generate a custom response for a missed call based on business type and information
 * @param {Object} business - The business information
 * @returns {Promise<string>} - The generated response message
 */
export async function generateMissedCallResponse(business: any): Promise<string> {
  console.log('generateMissedCallResponse called with:', business);
  
  // Base response templates that sound natural and conversational
  const baseResponses = [
    `Thanks for calling ${business.name}! Sorry we missed you. We'll get back to you as soon as possible.`,
    `Hi there! We're sorry we couldn't answer your call to ${business.name}. We'll return your call shortly.`,
    `Sorry we missed your call to ${business.name}. We'll get back to you as soon as we can.`,
    `Thanks for reaching out to ${business.name}. We're sorry we missed your call. We'll contact you soon.`,
    `We apologize for missing your call to ${business.name}. We'll get back to you shortly.`
  ];
  
  // Randomly select a base response
  const baseResponse = baseResponses[Math.floor(Math.random() * baseResponses.length)];
  
  // Check if the business has an online ordering URL
  if (business.online_ordering_url) {
    // Templates for naturally incorporating the online ordering URL
    const orderingPhrases = [
      `Feel free to place an order online here: ${business.online_ordering_url}`,
      `You can also order online anytime: ${business.online_ordering_url}`,
      `Need something fast? You can order online: ${business.online_ordering_url}`,
      `For your convenience, you can order from us online: ${business.online_ordering_url}`,
      `Can't call back? Order directly online: ${business.online_ordering_url}`
    ];
    
    // Randomly select an ordering phrase
    const orderingPhrase = orderingPhrases[Math.floor(Math.random() * orderingPhrases.length)];
    
    // Log that we're incorporating an online ordering URL
    console.log(`[generateMissedCallResponse] Incorporating online ordering URL for business: ${business.name}`);
    
    // Combine the base response with the ordering phrase
    return `${baseResponse} ${orderingPhrase}`;
  }
  
  // If no online ordering URL, just return the base response
  return baseResponse;
}

/**
 * Generate an SMS response based on customer message and business FAQs
 * @param {string} message - The customer's SMS message
 * @param {Array} faqs - Business FAQs
 * @param {string} businessName - Name of the business
 * @param {string} businessType - Type/industry of the business
 * @param {Object} additionalInfo - Additional business information
 * @param {string} systemPrompt - Custom system prompt to use for OpenAI
 * @returns {Promise<string>} - The generated response
 */
export async function generateSmsResponse(
  message: string, 
  faqs: any[] = [], 
  businessName: string = '', 
  businessType: string = 'local', 
  additionalInfo: any = null,
  systemPrompt: string = ''
): Promise<string> {
  console.log('generateSmsResponse called with:', { message, businessName, businessType });
  console.log('Using system prompt:', systemPrompt);
  return 'Thanks for your message! We will get back to you soon.';
}

/**
 * Classify if a message is urgent based on business type context
 * @param {string} text - The customer's message to classify
 * @param {string} businessType - Type of business for context
 * @returns {Promise<boolean>} - True if the message is urgent, false otherwise
 */
export async function classifyMessageIntent(text: string, businessType: string = 'local'): Promise<boolean> {
  console.log('classifyMessageIntent called with:', { text, businessType });
  
  // This would typically use OpenAI to analyze the message content
  // For now, we'll implement a simple heuristic based on business type
  
  const normalizedText = text.toLowerCase();
  
  // Business-specific urgency indicators
  const urgencyIndicators: Record<string, string[]> = {
    'restaurant': ['catering emergency', 'food poisoning', 'allergic reaction', 'urgent order'],
    'autoshop': ['car broke down', 'stranded', 'won\'t start', 'accident', 'tow', 'smoking'],
    'plumber': ['flooding', 'burst pipe', 'sewage', 'no water', 'water damage', 'leak'],
    'electrician': ['sparks', 'power outage', 'electrical fire', 'shock', 'burning smell'],
    'contractor': ['structural damage', 'roof leak', 'unsafe', 'collapse']
  };
  
  // Get business-specific indicators or use general ones
  const businessIndicators = urgencyIndicators[businessType.toLowerCase()] || [];
  
  // General urgency indicators that apply to all business types
  const generalIndicators = [
    'asap', 'right away', 'immediately', 'urgent', 'emergency', 
    'critical', 'serious', 'important', 'priority', 'hurry',
    'can\'t wait', 'desperate', 'help', 'problem', 'issue'
  ];
  
  // Check for business-specific urgency indicators
  const hasBusinessUrgency = businessIndicators.some(indicator => 
    normalizedText.includes(indicator)
  );
  
  // Check for general urgency indicators
  const hasGeneralUrgency = generalIndicators.some(indicator => 
    normalizedText.includes(indicator)
  );
  
  // Determine if the message is urgent
  const isUrgent = hasBusinessUrgency || hasGeneralUrgency;
  
  console.log('classifyMessageIntent result:', { 
    isUrgent, 
    hasBusinessUrgency, 
    hasGeneralUrgency,
    businessType 
  });
  
  return isUrgent;
}
