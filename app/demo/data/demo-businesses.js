/**
 * Demo business profiles for the missed call simulation
 * These represent different business types and subscription tiers
 */

export const demoBusinesses = {
  restaurant: {
    basic: {
      id: "demo-restaurant-basic",
      name: "Delicious Eats",
      businessType: "restaurant",
      phoneNumber: "+15551234567",
      address: "123 Main St, Anytown, USA",
      hours: {
        Monday: "11 AM - 9 PM",
        Tuesday: "11 AM - 9 PM",
        Wednesday: "11 AM - 9 PM",
        Thursday: "11 AM - 9 PM",
        Friday: "11 AM - 10 PM",
        Saturday: "11 AM - 10 PM",
        Sunday: "12 PM - 8 PM"
      },
      orderingLink: "https://deliciouseats.com/order",
      subscriptionTier: "basic",
      customSettings: {
        additionalInfo: "We offer catering for events!"
      }
    },
    pro: {
      id: "demo-restaurant-pro",
      name: "Delicious Eats",
      businessType: "restaurant",
      phoneNumber: "+15551234567",
      address: "123 Main St, Anytown, USA",
      hours: {
        Monday: "11 AM - 9 PM",
        Tuesday: "11 AM - 9 PM",
        Wednesday: "11 AM - 9 PM",
        Thursday: "11 AM - 9 PM",
        Friday: "11 AM - 10 PM",
        Saturday: "11 AM - 10 PM",
        Sunday: "12 PM - 8 PM"
      },
      orderingLink: "https://deliciouseats.com/order",
      subscriptionTier: "pro",
      customSettings: {
        additionalInfo: "We offer catering for events!"
      }
    },
    enterprise: {
      id: "demo-restaurant-enterprise",
      name: "Delicious Eats",
      businessType: "restaurant",
      phoneNumber: "+15551234567",
      address: "123 Main St, Anytown, USA",
      hours: {
        Monday: "11 AM - 9 PM",
        Tuesday: "11 AM - 9 PM",
        Wednesday: "11 AM - 9 PM",
        Thursday: "11 AM - 9 PM",
        Friday: "11 AM - 10 PM",
        Saturday: "11 AM - 10 PM",
        Sunday: "12 PM - 8 PM"
      },
      orderingLink: "https://deliciouseats.com/order",
      subscriptionTier: "enterprise",
      customSettings: {
        additionalInfo: "We offer catering for events and private dining options!"
      }
    }
  },
  autoShop: {
    basic: {
      id: "demo-autoshop-basic",
      name: "Quick Fix Auto",
      businessType: "auto shop",
      phoneNumber: "+15559876543",
      address: "456 Mechanic Ave, Anytown, USA",
      hours: {
        Monday: "8 AM - 6 PM",
        Tuesday: "8 AM - 6 PM",
        Wednesday: "8 AM - 6 PM",
        Thursday: "8 AM - 6 PM",
        Friday: "8 AM - 6 PM",
        Saturday: "9 AM - 3 PM"
      },
      quoteLink: "https://quickfixauto.com/quote",
      subscriptionTier: "basic",
      customSettings: {
        additionalInfo: "We offer free towing within 5 miles!"
      }
    },
    pro: {
      id: "demo-autoshop-pro",
      name: "Quick Fix Auto",
      businessType: "auto shop",
      phoneNumber: "+15559876543",
      address: "456 Mechanic Ave, Anytown, USA",
      hours: {
        Monday: "8 AM - 6 PM",
        Tuesday: "8 AM - 6 PM",
        Wednesday: "8 AM - 6 PM",
        Thursday: "8 AM - 6 PM",
        Friday: "8 AM - 6 PM",
        Saturday: "9 AM - 3 PM"
      },
      quoteLink: "https://quickfixauto.com/quote",
      subscriptionTier: "pro",
      customSettings: {
        additionalInfo: "We offer free towing within 5 miles!"
      }
    },
    enterprise: {
      id: "demo-autoshop-enterprise",
      name: "Quick Fix Auto",
      businessType: "auto shop",
      phoneNumber: "+15559876543",
      address: "456 Mechanic Ave, Anytown, USA",
      hours: {
        Monday: "8 AM - 6 PM",
        Tuesday: "8 AM - 6 PM",
        Wednesday: "8 AM - 6 PM",
        Thursday: "8 AM - 6 PM",
        Friday: "8 AM - 6 PM",
        Saturday: "9 AM - 3 PM"
      },
      quoteLink: "https://quickfixauto.com/quote",
      subscriptionTier: "enterprise",
      customSettings: {
        additionalInfo: "We offer free towing within 5 miles and loaner cars for repairs taking over 24 hours!"
      }
    }
  },
  salon: {
    basic: {
      id: "demo-salon-basic",
      name: "Glamour Styles",
      businessType: "salon",
      phoneNumber: "+15552468013",
      address: "789 Beauty Blvd, Anytown, USA",
      hours: {
        Tuesday: "9 AM - 7 PM",
        Wednesday: "9 AM - 7 PM",
        Thursday: "9 AM - 7 PM",
        Friday: "9 AM - 7 PM",
        Saturday: "9 AM - 5 PM"
      },
      bookingLink: "https://glamourstyles.com/book",
      subscriptionTier: "basic",
      customSettings: {
        additionalInfo: "New clients receive 15% off their first visit!"
      }
    },
    pro: {
      id: "demo-salon-pro",
      name: "Glamour Styles",
      businessType: "salon",
      phoneNumber: "+15552468013",
      address: "789 Beauty Blvd, Anytown, USA",
      hours: {
        Tuesday: "9 AM - 7 PM",
        Wednesday: "9 AM - 7 PM",
        Thursday: "9 AM - 7 PM",
        Friday: "9 AM - 7 PM",
        Saturday: "9 AM - 5 PM"
      },
      bookingLink: "https://glamourstyles.com/book",
      subscriptionTier: "pro",
      customSettings: {
        additionalInfo: "New clients receive 15% off their first visit!"
      }
    },
    enterprise: {
      id: "demo-salon-enterprise",
      name: "Glamour Styles",
      businessType: "salon",
      phoneNumber: "+15552468013",
      address: "789 Beauty Blvd, Anytown, USA",
      hours: {
        Tuesday: "9 AM - 7 PM",
        Wednesday: "9 AM - 7 PM",
        Thursday: "9 AM - 7 PM",
        Friday: "9 AM - 7 PM",
        Saturday: "9 AM - 5 PM"
      },
      bookingLink: "https://glamourstyles.com/book",
      subscriptionTier: "enterprise",
      customSettings: {
        additionalInfo: "New clients receive 15% off their first visit and a complimentary consultation!"
      }
    }
  }
};

/**
 * Pre-defined customer scenarios for the demo
 */
export const demoScenarios = [
  {
    id: "availability",
    name: "Availability Inquiry",
    callerPhone: "+15551112222",
    callerName: "John Smith",
    message: "Do you have availability Tuesday at 4pm?",
    description: "Customer asking about availability for a specific time"
  },
  {
    id: "services",
    name: "Services Question",
    callerPhone: "+15553334444",
    callerName: "Jane Doe",
    message: "How much would it cost for [service]?",
    description: "Customer asking about pricing for a specific service"
  },
  {
    id: "hours",
    name: "Hours Question",
    callerPhone: "+15555556666",
    callerName: "Bob Johnson",
    message: "What are your hours today?",
    description: "Customer asking about business hours"
  },
  {
    id: "custom",
    name: "Custom Inquiry",
    callerPhone: "+15557778888",
    callerName: "Custom Caller",
    message: "",
    description: "Create your own custom inquiry"
  }
];

/**
 * Get a demo business by type and tier
 * @param {string} type - Business type (restaurant, autoShop, salon)
 * @param {string} tier - Subscription tier (basic, pro, enterprise)
 * @returns {Object} The demo business object
 */
export function getDemoBusiness(type, tier) {
  if (!demoBusinesses[type] || !demoBusinesses[type][tier]) {
    throw new Error(`Demo business not found for type: ${type}, tier: ${tier}`);
  }
  return demoBusinesses[type][tier];
}

/**
 * Get a demo scenario by ID
 * @param {string} id - Scenario ID
 * @returns {Object} The demo scenario object
 */
export function getDemoScenario(id) {
  const scenario = demoScenarios.find(s => s.id === id);
  if (!scenario) {
    throw new Error(`Demo scenario not found for id: ${id}`);
  }
  return scenario;
}
