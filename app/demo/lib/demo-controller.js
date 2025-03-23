/**
 * Demo controller for orchestrating the missed call simulation
 */

import { getDemoBusiness, getDemoScenario } from "../data/demo-businesses";
import { simulateMissedCall, simulateResponse } from "./mock-twilio";
// import { generateMissedCallResponse } from "@/lib/ai";

/**
 * Run a complete missed call demo scenario
 * @param {string} businessType - Type of business (restaurant, autoShop, salon)
 * @param {string} tier - Subscription tier (basic, pro, enterprise)
 * @param {string} scenarioId - ID of the scenario to run
 * @param {string} customMessage - Custom message for the "custom" scenario
 * @param {string} customPhoneNumber - Optional custom phone number to use for the caller
 * @returns {Promise<Object>} The complete demo results
 */
export async function runMissedCallDemo(businessType, tier, scenarioId, customMessage = "", customPhoneNumber = "") {
  try {
    // Get the business and scenario data
    const business = getDemoBusiness(businessType, tier);
    const scenario = getDemoScenario(scenarioId);
    
    // Use custom message if provided and scenario is "custom"
    if (scenarioId === "custom" && customMessage) {
      scenario.message = customMessage;
    }
    
    // Use custom phone number if provided
    if (customPhoneNumber) {
      scenario.callerPhone = customPhoneNumber;
    }
    
    // Initialize the demo results
    const demoResults = {
      business,
      scenario,
      steps: [],
      success: false,
      error: null
    };
    
    // Step 1: Simulate the missed call
    demoResults.steps.push({
      id: "missedCall",
      name: "Missed Call",
      status: "processing",
      data: null,
      timestamp: new Date().toISOString()
    });
    
    const missedCallResult = await simulateMissedCall(
      scenario.callerPhone,
      business.phoneNumber,
      scenario.message
    );
    
    demoResults.steps[0].status = missedCallResult.success ? "complete" : "error";
    demoResults.steps[0].data = missedCallResult;
    
    if (!missedCallResult.success) {
      demoResults.error = "Failed to simulate missed call";
      return demoResults;
    }
    
    // Step 2: Business lookup
    demoResults.steps.push({
      id: "businessLookup",
      name: "Business Lookup",
      status: "processing",
      data: null,
      timestamp: new Date().toISOString()
    });
    
    // Simulate a delay for the business lookup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    demoResults.steps[1].status = "complete";
    demoResults.steps[1].data = {
      businessFound: true,
      business
    };
    
    // Step 3: Generate AI response
    demoResults.steps.push({
      id: "generateResponse",
      name: "Generate AI Response",
      status: "processing",
      data: null,
      timestamp: new Date().toISOString()
    });
    
    // Generate a mock response based on the business type and tier
    let aiResponse;
    
    // For basic tier, use a simple template-based approach
    if (tier === 'basic') {
      aiResponse = `Hey thanks for calling ${business.name}. We're currently unavailable. Our hours are Monday-Friday: 9 AM - 5 PM, Saturday: 10 AM - 3 PM. Please call back during our business hours or leave a message and we'll get back to you as soon as possible.`;
    } else if (tier === 'pro') {
      // For pro tier, use a more personalized response
      if (business.businessType === "restaurant") {
        aiResponse = `Thanks for calling ${business.name}! Sorry we missed you. We're open Monday-Friday: 9 AM - 5 PM, Saturday: 10 AM - 3 PM. Want to make a reservation or order online? Visit: ${business.orderingLink || "our website"}. We'll call you back shortly!`;
      } else if (business.businessType === "auto shop") {
        aiResponse = `Thanks for calling ${business.name}! Sorry we missed you. We're open Monday-Friday: 9 AM - 5 PM, Saturday: 10 AM - 3 PM. Need a quote? Visit: ${business.quoteLink || "our website"}. We'll call you back shortly!`;
      } else {
        aiResponse = `Thanks for calling ${business.name}! Sorry we missed you. We're open Monday-Friday: 9 AM - 5 PM, Saturday: 10 AM - 3 PM. Book an appointment online at our website. We'll call you back shortly!`;
      }
    } else {
      // For enterprise tier, use a highly personalized response
      if (business.businessType === "restaurant") {
        aiResponse = `Hi there! Thanks for calling ${business.name}. We're currently helping other customers. We're open Monday-Friday: 9 AM - 5 PM, Saturday: 10 AM - 3 PM. Would you like to make a reservation or order from our seasonal menu? Visit: ${business.orderingLink || "our website"} or reply to this message. We'll call you back within 15 minutes!`;
      } else if (business.businessType === "auto shop") {
        aiResponse = `Hi there! Thanks for calling ${business.name}. We're currently helping other customers. We're open Monday-Friday: 9 AM - 5 PM, Saturday: 10 AM - 3 PM. Need a quote for repairs or maintenance? Visit: ${business.quoteLink || "our website"} or reply to this message. We'll call you back within 15 minutes!`;
      } else {
        aiResponse = `Hi there! Thanks for calling ${business.name}. We're currently helping other customers. We're open Monday-Friday: 9 AM - 5 PM, Saturday: 10 AM - 3 PM. Would you like to book an appointment for our premium services? Visit our website or reply to this message. We'll call you back within 15 minutes!`;
      }
    }
    
    demoResults.steps[2].status = "complete";
    demoResults.steps[2].data = {
      generatedResponse: aiResponse,
      tier: tier
    };
    
    // Step 4: Send SMS response
    demoResults.steps.push({
      id: "sendResponse",
      name: "Send SMS Response",
      status: "processing",
      data: null,
      timestamp: new Date().toISOString()
    });
    
    const responseResult = await simulateResponse(
      business.phoneNumber,
      scenario.callerPhone,
      aiResponse
    );
    
    demoResults.steps[3].status = responseResult.success ? "complete" : "error";
    demoResults.steps[3].data = responseResult;
    
    if (!responseResult.success) {
      demoResults.error = "Failed to send SMS response";
      return demoResults;
    }
    
    // Mark the demo as successful
    demoResults.success = true;
    
    return demoResults;
  } catch (error) {
    console.error("Error running missed call demo:", error);
    return {
      success: false,
      error: error.message,
      steps: []
    };
  }
}

/**
 * Generate responses for all subscription tiers for comparison
 * @param {string} businessType - Type of business (restaurant, autoShop, salon)
 * @param {string} scenarioId - ID of the scenario to run
 * @param {string} customMessage - Custom message for the "custom" scenario
 * @returns {Promise<Object>} Comparison of responses across tiers
 */
export async function generateTierComparison(businessType, scenarioId, customMessage = "") {
  try {
    const tiers = ["basic", "pro", "enterprise"];
    const scenario = getDemoScenario(scenarioId);
    
    // Use custom message if provided and scenario is "custom"
    if (scenarioId === "custom" && customMessage) {
      scenario.message = customMessage;
    }
    
    const results = {
      businessType,
      scenario,
      responses: {},
      success: true
    };
    
    // Generate mock responses for each tier
    const business = getDemoBusiness(businessType, "basic");
    
    results.responses.basic = {
      text: `Hey thanks for calling ${business.name}. We're currently unavailable. Our hours are Monday-Friday: 9 AM - 5 PM, Saturday: 10 AM - 3 PM. Please call back during our business hours or leave a message and we'll get back to you as soon as possible.`,
      error: null
    };
    
    results.responses.pro = {
      text: businessType === "restaurant" 
        ? `Thanks for calling ${business.name}! Sorry we missed you. We're open Monday-Friday: 9 AM - 5 PM, Saturday: 10 AM - 3 PM. Want to make a reservation or order online? Visit: ${business.orderingLink || "our website"}. We'll call you back shortly!`
        : businessType === "auto shop"
        ? `Thanks for calling ${business.name}! Sorry we missed you. We're open Monday-Friday: 9 AM - 5 PM, Saturday: 10 AM - 3 PM. Need a quote? Visit: ${business.quoteLink || "our website"}. We'll call you back shortly!`
        : `Thanks for calling ${business.name}! Sorry we missed you. We're open Monday-Friday: 9 AM - 5 PM, Saturday: 10 AM - 3 PM. Book an appointment online at our website. We'll call you back shortly!`,
      error: null
    };
    
    results.responses.enterprise = {
      text: businessType === "restaurant"
        ? `Hi there! Thanks for calling ${business.name}. We're currently helping other customers. We're open Monday-Friday: 9 AM - 5 PM, Saturday: 10 AM - 3 PM. Would you like to make a reservation or order from our seasonal menu? Visit: ${business.orderingLink || "our website"} or reply to this message. We'll call you back within 15 minutes!`
        : businessType === "auto shop"
        ? `Hi there! Thanks for calling ${business.name}. We're currently helping other customers. We're open Monday-Friday: 9 AM - 5 PM, Saturday: 10 AM - 3 PM. Need a quote for repairs or maintenance? Visit: ${business.quoteLink || "our website"} or reply to this message. We'll call you back within 15 minutes!`
        : `Hi there! Thanks for calling ${business.name}. We're currently helping other customers. We're open Monday-Friday: 9 AM - 5 PM, Saturday: 10 AM - 3 PM. Would you like to book an appointment for our premium services? Visit our website or reply to this message. We'll call you back within 15 minutes!`,
      error: null
    };
    
    return results;
  } catch (error) {
    console.error("Error generating tier comparison:", error);
    return {
      success: false,
      error: error.message,
      responses: {}
    };
  }
}

/**
 * Get demo statistics for display
 * @returns {Object} Statistics about the demo
 */
export function getDemoStats() {
  return {
    missedCallsHandled: Math.floor(Math.random() * 500) + 1000,
    averageResponseTime: (Math.random() * 2 + 1).toFixed(1),
    conversionRate: (Math.random() * 15 + 25).toFixed(1) + "%",
    customerSatisfaction: (Math.random() * 1 + 4).toFixed(1) + "/5",
    topBusinessTypes: [
      { type: "Restaurant", percentage: "42%" },
      { type: "Auto Shop", percentage: "28%" },
      { type: "Salon", percentage: "18%" },
      { type: "Other", percentage: "12%" }
    ]
  };
}
