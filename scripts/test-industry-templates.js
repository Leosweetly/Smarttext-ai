#!/usr/bin/env node

/**
 * Test script for the pre-built industry response templates
 * 
 * This script tests the template system for different industries,
 * verifies that templates are correctly applied based on business type,
 * tests customization of templates, and tests fallback behavior.
 * 
 * Usage: node scripts/test-industry-templates.js
 */

const dotenv = require('dotenv');
const path = require('path');
const { OpenAI } = require('openai');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define industry types to test
const industryTypes = [
  'restaurant',
  'auto shop',
  'salon',
  'dental office',
  'law firm',
  'plumbing service',
  'electrician',
  'retail store',
  'gym',
  'non-existent-industry' // For testing fallback behavior
];

// Define test scenarios
const testScenarios = [
  {
    name: 'Missed Call Response',
    templateType: 'missed_call',
    customization: {
      includeHours: true,
      includeLinks: true,
      tone: 'friendly'
    }
  },
  {
    name: 'Appointment Confirmation',
    templateType: 'appointment_confirmation',
    customization: {
      includeAddress: true,
      includeCancellationPolicy: true,
      tone: 'professional'
    }
  },
  {
    name: 'Follow-up Message',
    templateType: 'follow_up',
    customization: {
      includeReviewRequest: true,
      includeDiscount: true,
      tone: 'appreciative'
    }
  }
];

/**
 * Get a template for a specific industry and template type
 * @param {string} industry - The industry type
 * @param {string} templateType - The type of template
 * @param {Object} customization - Customization options
 * @returns {Promise<Object>} - The template object
 */
async function getIndustryTemplate(industry, templateType, customization = {}) {
  try {
    console.log(`Getting ${templateType} template for ${industry}...`);
    
    // In a real implementation, this would fetch from a database or API
    // For this test, we'll simulate by generating templates with OpenAI
    
    // First, check if we have a pre-defined template for this industry and type
    const template = await simulateTemplateRetrieval(industry, templateType);
    
    if (template) {
      console.log(`Found template for ${industry} - ${templateType}`);
      
      // Apply customizations if provided
      if (Object.keys(customization).length > 0) {
        return await customizeTemplate(template, customization);
      }
      
      return template;
    }
    
    // If no template exists, generate a fallback template
    console.log(`No template found for ${industry} - ${templateType}, generating fallback...`);
    return await generateFallbackTemplate(industry, templateType);
  } catch (error) {
    console.error(`Error getting industry template: ${error.message}`);
    throw error;
  }
}

/**
 * Simulate retrieving a template from a database
 * @param {string} industry - The industry type
 * @param {string} templateType - The type of template
 * @returns {Promise<Object|null>} - The template object or null if not found
 */
async function simulateTemplateRetrieval(industry, templateType) {
  // Simulate database lookup delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // For non-existent industry, return null to test fallback
  if (industry === 'non-existent-industry') {
    return null;
  }
  
  // Pre-defined templates for common industries and types
  const templates = {
    restaurant: {
      missed_call: {
        id: 'template_restaurant_missed_call',
        name: 'Restaurant Missed Call',
        content: 'Thanks for calling {business_name}. We\'re sorry we missed your call. Our hours are {business_hours}. Would you like to make a reservation or place an order for pickup/delivery? You can also order online at {ordering_link}.',
        variables: ['business_name', 'business_hours', 'ordering_link'],
        industry: 'restaurant',
        type: 'missed_call'
      },
      appointment_confirmation: {
        id: 'template_restaurant_appointment_confirmation',
        name: 'Restaurant Reservation Confirmation',
        content: 'Your reservation at {business_name} for {appointment_time} has been confirmed. We\'re located at {business_address}. Please call us at {business_phone} if you need to make any changes.',
        variables: ['business_name', 'appointment_time', 'business_address', 'business_phone'],
        industry: 'restaurant',
        type: 'appointment_confirmation'
      },
      follow_up: {
        id: 'template_restaurant_follow_up',
        name: 'Restaurant Follow-up',
        content: 'Thank you for dining with us at {business_name}! We hope you enjoyed your experience. We\'d love to hear your feedback. {review_request} Use code RETURN10 for 10% off your next visit.',
        variables: ['business_name', 'review_request'],
        industry: 'restaurant',
        type: 'follow_up'
      }
    },
    'auto shop': {
      missed_call: {
        id: 'template_auto_shop_missed_call',
        name: 'Auto Shop Missed Call',
        content: 'Thanks for calling {business_name}. We\'re sorry we missed your call. Our hours are {business_hours}. Need a quote? Visit {quote_link} or call us back during business hours.',
        variables: ['business_name', 'business_hours', 'quote_link'],
        industry: 'auto shop',
        type: 'missed_call'
      },
      appointment_confirmation: {
        id: 'template_auto_shop_appointment_confirmation',
        name: 'Auto Shop Appointment Confirmation',
        content: 'Your appointment at {business_name} for {appointment_time} has been confirmed. We\'re located at {business_address}. Please arrive 10 minutes early to complete paperwork. {cancellation_policy}',
        variables: ['business_name', 'appointment_time', 'business_address', 'cancellation_policy'],
        industry: 'auto shop',
        type: 'appointment_confirmation'
      },
      follow_up: {
        id: 'template_auto_shop_follow_up',
        name: 'Auto Shop Follow-up',
        content: 'Thank you for choosing {business_name} for your recent service. We hope your vehicle is running smoothly. {review_request} Remember, we recommend an oil change every 3 months or 3,000 miles.',
        variables: ['business_name', 'review_request'],
        industry: 'auto shop',
        type: 'follow_up'
      }
    },
    salon: {
      missed_call: {
        id: 'template_salon_missed_call',
        name: 'Salon Missed Call',
        content: 'Thanks for calling {business_name}. We\'re sorry we missed your call. Our hours are {business_hours}. Would you like to book an appointment? Visit {booking_link} or call us back during business hours.',
        variables: ['business_name', 'business_hours', 'booking_link'],
        industry: 'salon',
        type: 'missed_call'
      }
      // Other salon templates would be defined here
    }
    // Other industries would be defined here
  };
  
  // Check if we have a template for this industry and type
  if (templates[industry] && templates[industry][templateType]) {
    return templates[industry][templateType];
  }
  
  // If we have the industry but not the specific template type, try to generate one
  if (templates[industry]) {
    // In a real system, we might have a way to generate missing template types
    // For this test, we'll return null to test the fallback
    return null;
  }
  
  // No templates for this industry
  return null;
}

/**
 * Customize a template based on customization options
 * @param {Object} template - The template object
 * @param {Object} customization - Customization options
 * @returns {Promise<Object>} - The customized template
 */
async function customizeTemplate(template, customization) {
  console.log(`Customizing template with options: ${JSON.stringify(customization)}`);
  
  // Create a copy of the template to customize
  const customizedTemplate = { ...template };
  
  // Apply tone customization
  if (customization.tone) {
    // In a real implementation, this would modify the template content based on the tone
    // For this test, we'll simulate by adding a note about the tone
    customizedTemplate.content = await adjustTone(customizedTemplate.content, customization.tone);
  }
  
  // Apply includeHours customization
  if (customization.includeHours === false && customizedTemplate.content.includes('{business_hours}')) {
    customizedTemplate.content = customizedTemplate.content.replace(
      'Our hours are {business_hours}. ', 
      ''
    );
    customizedTemplate.variables = customizedTemplate.variables.filter(v => v !== 'business_hours');
  }
  
  // Apply includeLinks customization
  if (customization.includeLinks === false) {
    // Remove any link variables from the content
    ['ordering_link', 'quote_link', 'booking_link'].forEach(linkVar => {
      if (customizedTemplate.content.includes(`{${linkVar}}`)) {
        // Find the sentence containing the link and remove it
        const regex = new RegExp(`[^.]*\\{${linkVar}\\}[^.]*\\.\\s*`, 'g');
        customizedTemplate.content = customizedTemplate.content.replace(regex, '');
        customizedTemplate.variables = customizedTemplate.variables.filter(v => v !== linkVar);
      }
    });
  }
  
  // Apply includeAddress customization
  if (customization.includeAddress === false && customizedTemplate.content.includes('{business_address}')) {
    customizedTemplate.content = customizedTemplate.content.replace(
      'We\'re located at {business_address}. ', 
      ''
    );
    customizedTemplate.variables = customizedTemplate.variables.filter(v => v !== 'business_address');
  }
  
  // Apply includeCancellationPolicy customization
  if (customization.includeCancellationPolicy === true && !customizedTemplate.content.includes('{cancellation_policy}')) {
    customizedTemplate.content += ' {cancellation_policy}';
    customizedTemplate.variables.push('cancellation_policy');
  } else if (customization.includeCancellationPolicy === false && customizedTemplate.content.includes('{cancellation_policy}')) {
    customizedTemplate.content = customizedTemplate.content.replace(
      '{cancellation_policy}', 
      ''
    );
    customizedTemplate.variables = customizedTemplate.variables.filter(v => v !== 'cancellation_policy');
  }
  
  // Apply includeReviewRequest customization
  if (customization.includeReviewRequest === true && !customizedTemplate.content.includes('{review_request}')) {
    customizedTemplate.content = customizedTemplate.content.replace(
      'We hope you enjoyed your experience. ', 
      'We hope you enjoyed your experience. {review_request} '
    );
    customizedTemplate.variables.push('review_request');
  } else if (customization.includeReviewRequest === false && customizedTemplate.content.includes('{review_request}')) {
    customizedTemplate.content = customizedTemplate.content.replace(
      '{review_request} ', 
      ''
    );
    customizedTemplate.variables = customizedTemplate.variables.filter(v => v !== 'review_request');
  }
  
  // Apply includeDiscount customization
  if (customization.includeDiscount === true && !customizedTemplate.content.includes('discount')) {
    customizedTemplate.content += ' Use code THANKS10 for 10% off your next visit.';
  } else if (customization.includeDiscount === false && customizedTemplate.content.includes('discount')) {
    // Remove any sentence containing the word "discount"
    customizedTemplate.content = customizedTemplate.content.replace(/[^.]*discount[^.]*\./g, '');
  }
  
  return customizedTemplate;
}

/**
 * Adjust the tone of a template
 * @param {string} content - The template content
 * @param {string} tone - The desired tone
 * @returns {Promise<string>} - The adjusted content
 */
async function adjustTone(content, tone) {
  // In a real implementation, this would use NLP or AI to adjust the tone
  // For this test, we'll use OpenAI to simulate this
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that adjusts the tone of business text messages. 
          Rewrite the given message with a ${tone} tone, while preserving all the information and variables.
          Variables are enclosed in curly braces like {business_name} and should remain exactly as they are.`
        },
        {
          role: "user",
          content: `Adjust this message to have a ${tone} tone: ${content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error adjusting tone: ${error.message}`);
    // If there's an error, return the original content
    return content;
  }
}

/**
 * Generate a fallback template when no pre-defined template exists
 * @param {string} industry - The industry type
 * @param {string} templateType - The type of template
 * @returns {Promise<Object>} - The generated template
 */
async function generateFallbackTemplate(industry, templateType) {
  console.log(`Generating fallback template for ${industry} - ${templateType}`);
  
  try {
    // Use OpenAI to generate a fallback template
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that generates text message templates for businesses.
          Create a template for a ${industry} business for a ${templateType.replace('_', ' ')} message.
          Include appropriate variables in curly braces like {business_name}, {business_hours}, etc.
          The template should be concise and professional.`
        },
        {
          role: "user",
          content: `Generate a ${templateType.replace('_', ' ')} template for a ${industry} business.`
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });
    
    const generatedContent = response.choices[0].message.content.trim();
    
    // Extract variables from the generated content
    const variableRegex = /\{([^}]+)\}/g;
    const variables = [];
    let match;
    while ((match = variableRegex.exec(generatedContent)) !== null) {
      variables.push(match[1]);
    }
    
    // Create a template object
    return {
      id: `generated_${industry}_${templateType}`,
      name: `Generated ${industry} ${templateType.replace('_', ' ')}`,
      content: generatedContent,
      variables: variables,
      industry: industry,
      type: templateType,
      isGenerated: true
    };
  } catch (error) {
    console.error(`Error generating fallback template: ${error.message}`);
    
    // If OpenAI fails, use a very basic fallback
    return {
      id: `basic_fallback_${industry}_${templateType}`,
      name: `Basic Fallback for ${industry} ${templateType.replace('_', ' ')}`,
      content: `Thank you for contacting {business_name}. We'll get back to you as soon as possible.`,
      variables: ['business_name'],
      industry: industry,
      type: templateType,
      isGenerated: true,
      isFallback: true
    };
  }
}

/**
 * Apply a template with business data
 * @param {Object} template - The template object
 * @param {Object} businessData - The business data
 * @returns {string} - The applied template
 */
function applyTemplate(template, businessData) {
  let appliedContent = template.content;
  
  // Replace each variable with its value from businessData
  template.variables.forEach(variable => {
    if (businessData[variable]) {
      appliedContent = appliedContent.replace(
        new RegExp(`\\{${variable}\\}`, 'g'),
        businessData[variable]
      );
    } else {
      console.warn(`Warning: Variable ${variable} not found in business data`);
      // Replace with a placeholder
      appliedContent = appliedContent.replace(
        new RegExp(`\\{${variable}\\}`, 'g'),
        `[${variable}]`
      );
    }
  });
  
  return appliedContent;
}

/**
 * Run the tests
 */
async function runTests() {
  console.log('🧪 Testing Pre-built Industry Response Templates');
  console.log('----------------------------------------------');
  
  // Sample business data for testing
  const businessData = {
    business_name: 'Test Business',
    business_hours: 'Monday-Friday 9 AM - 5 PM, Saturday 10 AM - 2 PM',
    business_address: '123 Main St, Anytown, USA',
    business_phone: '(555) 123-4567',
    ordering_link: 'https://testbusiness.com/order',
    quote_link: 'https://testbusiness.com/quote',
    booking_link: 'https://testbusiness.com/book',
    appointment_time: 'Tuesday, March 22, 2025 at 10:00 AM',
    cancellation_policy: 'Please provide at least 24 hours notice for cancellations.',
    review_request: 'Please leave us a review on Google or Yelp!'
  };
  
  // Test each industry type
  for (const industry of industryTypes) {
    console.log(`\n📋 Testing templates for industry: ${industry}`);
    
    // Test each scenario
    for (const scenario of testScenarios) {
      console.log(`\n🔍 Scenario: ${scenario.name}`);
      
      try {
        // Get the template
        const template = await getIndustryTemplate(industry, scenario.templateType, scenario.customization);
        
        console.log(`Template ID: ${template.id}`);
        console.log(`Template Name: ${template.name}`);
        console.log(`Template Content: ${template.content}`);
        console.log(`Template Variables: ${template.variables.join(', ')}`);
        
        if (template.isGenerated) {
          console.log('⚠️ Note: This is a generated template (no pre-defined template found)');
        }
        
        if (template.isFallback) {
          console.log('⚠️ Note: This is a basic fallback template (generation failed)');
        }
        
        // Apply the template with business data
        const appliedTemplate = applyTemplate(template, businessData);
        console.log(`Applied Template: ${appliedTemplate}`);
        
        // Verify the template was applied correctly
        let testPassed = true;
        
        // Check that all variables were replaced
        const remainingVariables = appliedTemplate.match(/\{([^}]+)\}/g);
        if (remainingVariables) {
          console.log(`❌ Test failed: Not all variables were replaced: ${remainingVariables.join(', ')}`);
          testPassed = false;
        }
        
        // Check that customizations were applied
        if (scenario.customization.tone) {
          // We can't easily verify tone changes automatically
          console.log(`ℹ️ Tone customization to "${scenario.customization.tone}" was requested (manual verification needed)`);
        }
        
        if (scenario.customization.includeHours === false && appliedTemplate.includes(businessData.business_hours)) {
          console.log('❌ Test failed: Business hours were included despite customization');
          testPassed = false;
        }
        
        if (scenario.customization.includeLinks === false && 
            (appliedTemplate.includes(businessData.ordering_link) || 
             appliedTemplate.includes(businessData.quote_link) || 
             appliedTemplate.includes(businessData.booking_link))) {
          console.log('❌ Test failed: Links were included despite customization');
          testPassed = false;
        }
        
        if (scenario.customization.includeAddress === false && appliedTemplate.includes(businessData.business_address)) {
          console.log('❌ Test failed: Business address was included despite customization');
          testPassed = false;
        }
        
        if (scenario.customization.includeCancellationPolicy === false && appliedTemplate.includes(businessData.cancellation_policy)) {
          console.log('❌ Test failed: Cancellation policy was included despite customization');
          testPassed = false;
        }
        
        if (scenario.customization.includeReviewRequest === false && appliedTemplate.includes(businessData.review_request)) {
          console.log('❌ Test failed: Review request was included despite customization');
          testPassed = false;
        }
        
        if (testPassed) {
          console.log('✅ Test passed!');
        }
      } catch (error) {
        console.error(`❌ Test error: ${error.message}`);
      }
    }
  }
  
  console.log('\n✅ All tests completed!');
}

// Run the tests
runTests()
  .then(() => {
    console.log('Test script finished successfully');
  })
  .catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
