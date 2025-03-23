/**
 * Mock Twilio integration for the demo environment
 * This simulates the Twilio webhook process without actually sending SMS messages
 */

/**
 * Simulate a missed call from a customer to a business
 * @param {string} from - The customer's phone number
 * @param {string} to - The business's phone number
 * @param {string} customerMessage - Optional message from the customer
 * @returns {Object} Visualization data for the UI
 */
export async function simulateMissedCall(from, to, customerMessage = "") {
  // Create a log of the simulation steps
  const simulationLog = [
    {
      step: "incomingCall",
      timestamp: new Date().toISOString(),
      data: {
        from,
        to,
        status: "missed"
      },
      description: `Incoming call from ${from} to ${to} was missed`
    }
  ];

  // If there's a customer message, add it to the log
  if (customerMessage) {
    simulationLog.push({
      step: "customerMessage",
      timestamp: new Date().toISOString(),
      data: {
        from,
        message: customerMessage
      },
      description: `Customer would have asked: "${customerMessage}"`
    });
  }

  // Return the simulation data
  return {
    success: true,
    log: simulationLog,
    webhookData: {
      From: from,
      To: to,
      CallStatus: "no-answer",
      Timestamp: new Date().toISOString()
    }
  };
}

/**
 * Simulate sending an SMS response to a customer
 * @param {string} from - The business's phone number
 * @param {string} to - The customer's phone number
 * @param {string} message - The message to send
 * @returns {Object} Visualization data for the UI
 */
export async function simulateResponse(from, to, message) {
  // Use the SmartText AI number if available, otherwise use the business number
  const fromNumber = process.env.TWILIO_SMARTTEXT_NUMBER || from;
  
  // Create a log of the simulation steps
  const simulationLog = [
    {
      step: "sendingSms",
      timestamp: new Date().toISOString(),
      data: {
        from: fromNumber,
        to,
        message
      },
      description: `Sending SMS from ${fromNumber} to ${to}`
    },
    {
      step: "smsSent",
      timestamp: new Date().toISOString(),
      data: {
        status: "delivered",
        messageId: `demo-${Date.now()}`
      },
      description: "SMS delivered successfully"
    }
  ];

  // Return the simulation data
  return {
    success: true,
    log: simulationLog,
    messageData: {
      from: fromNumber,
      to,
      body: message,
      status: "delivered",
      sid: `demo-${Date.now()}`,
      dateCreated: new Date().toISOString()
    }
  };
}

/**
 * Get a formatted phone number for display
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} The formatted phone number
 */
export function formatPhoneNumber(phoneNumber) {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");
  
  // Check if the number is a valid US phone number
  const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    // Format as (XXX) XXX-XXXX
    return `(${match[2]}) ${match[3]}-${match[4]}`;
  }
  
  // Return the original if it doesn't match the pattern
  return phoneNumber;
}

/**
 * Generate a simulated conversation history
 * @param {Object} business - The business object
 * @param {Object} customer - The customer object
 * @param {number} messageCount - Number of messages to generate
 * @returns {Array} Array of message objects
 */
export function generateConversationHistory(business, customer, messageCount = 3) {
  const now = new Date();
  const messages = [];
  
  // Generate a series of messages going back in time
  for (let i = 0; i < messageCount; i++) {
    const timestamp = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
    
    // Customer message
    messages.push({
      id: `cust-${i}-${Date.now()}`,
      from: customer.phone,
      to: business.phoneNumber,
      body: getRandomCustomerMessage(business.businessType),
      timestamp: timestamp.toISOString(),
      direction: "inbound"
    });
    
    // Business response
    messages.push({
      id: `biz-${i}-${Date.now()}`,
      from: business.phoneNumber,
      to: customer.phone,
      body: getRandomBusinessResponse(business.businessType),
      timestamp: new Date(timestamp.getTime() + 5 * 60 * 1000).toISOString(),
      direction: "outbound"
    });
  }
  
  // Sort by timestamp (newest first)
  return messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Get a random customer message based on business type
 * @param {string} businessType - The type of business
 * @returns {string} A random customer message
 */
function getRandomCustomerMessage(businessType) {
  const messages = {
    restaurant: [
      "Do you have a table for 4 available tonight at 7pm?",
      "Are you open on Sundays?",
      "Do you offer vegetarian options?",
      "Can I make a reservation for next Friday?",
      "Do you deliver?"
    ],
    "auto shop": [
      "How much would it cost to replace brake pads on a Honda Civic?",
      "Do you do oil changes without appointments?",
      "My check engine light is on, can you diagnose it?",
      "Do you work on hybrid vehicles?",
      "How long does a typical tune-up take?"
    ],
    salon: [
      "Do you have any openings for a haircut tomorrow?",
      "How much do you charge for highlights?",
      "Do you do makeup for special events?",
      "Can I book an appointment for a manicure and pedicure?",
      "Do you offer any spa packages?"
    ]
  };
  
  // Default to restaurant if business type not found
  const typeMessages = messages[businessType] || messages.restaurant;
  
  // Return a random message
  return typeMessages[Math.floor(Math.random() * typeMessages.length)];
}

/**
 * Get a random business response based on business type
 * @param {string} businessType - The type of business
 * @returns {string} A random business response
 */
function getRandomBusinessResponse(businessType) {
  const responses = {
    restaurant: [
      "Yes, we have a table for 4 at 7pm tonight. Would you like to reserve it?",
      "We're open on Sundays from 11am to 8pm.",
      "We have several vegetarian options on our menu. You can view them on our website.",
      "We'd be happy to reserve a table for you next Friday. What time works for you?",
      "Yes, we offer delivery through our website or app."
    ],
    "auto shop": [
      "Brake pad replacement for a Honda Civic typically costs $150-200. Would you like to schedule an appointment?",
      "We do oil changes without appointments, but there may be a wait during busy times.",
      "We can diagnose your check engine light. Our diagnostic fee is $75, which is applied to repairs if you choose to have them done with us.",
      "Yes, we work on all hybrid vehicles. Our technicians are certified for hybrid repairs.",
      "A typical tune-up takes about 1-2 hours depending on your vehicle."
    ],
    salon: [
      "We have an opening for a haircut tomorrow at 2pm or 4pm. Would either of those work for you?",
      "Highlights start at $120, depending on hair length and the technique used.",
      "Yes, we offer makeup services for special events. It's best to book at least a week in advance.",
      "We can book you for a mani-pedi. Our next available appointment is Tuesday at 11am.",
      "We offer several spa packages ranging from $150-300. Would you like me to email you our options?"
    ]
  };
  
  // Default to restaurant if business type not found
  const typeResponses = responses[businessType] || responses.restaurant;
  
  // Return a random response
  return typeResponses[Math.floor(Math.random() * typeResponses.length)];
}
