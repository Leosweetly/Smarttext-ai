#!/usr/bin/env node

/**
 * This script demonstrates how to generate industry-specific FAQs
 * using the OpenAI API. It can be used to pre-populate FAQ sections
 * for new businesses based on their business type.
 * 
 * Usage: node generate-industry-faqs.js <business-type>
 * Example: node generate-industry-faqs.js "auto shop"
 */

const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get business type from command line arguments
const businessType = process.argv[2] || 'restaurant';

async function generateIndustryFAQs(type) {
  try {
    console.log(`Generating FAQs for business type: ${type}...`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that generates relevant FAQ questions and default answers for businesses based on their industry. 
          The questions should be common inquiries that customers might have about businesses in this industry.
          Provide 5 questions and default answers that would be useful for a ${type}.`
        },
        {
          role: "user",
          content: `Generate 5 frequently asked questions and default answers for a ${type} business. 
          Format the response as a JSON object with a 'faqs' property that contains an array of objects, each with 'question' and 'defaultAnswer' properties.
          Example format:
          {
            "faqs": [
              {
                "question": "What are your hours?",
                "defaultAnswer": "We are open Monday through Friday from 9 AM to 6 PM."
              },
              {
                "question": "Do you accept walk-ins?",
                "defaultAnswer": "Yes, we accept walk-ins, but appointments are recommended."
              }
            ]
          }`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseContent = response.choices[0].message.content;
    console.log('\nRaw response:');
    console.log(responseContent);
    
    // Extract FAQs manually since the JSON might not be properly formatted
    try {
      // Use regex to extract questions and answers
      const questionPattern = /"question":\s*"([^"]+)"/g;
      const answerPattern = /"defaultAnswer":\s*"([^"]+)"/g;
      
      const questions = [];
      const answers = [];
      
      let qMatch;
      while ((qMatch = questionPattern.exec(responseContent)) !== null) {
        if (qMatch[1]) {
          questions.push(qMatch[1]);
        }
      }
      
      let aMatch;
      while ((aMatch = answerPattern.exec(responseContent)) !== null) {
        if (aMatch[1]) {
          answers.push(aMatch[1]);
        }
      }
      
      // Create FAQ objects
      const faqs = [];
      for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
        faqs.push({
          question: questions[i],
          defaultAnswer: answers[i]
        });
      }
      
      console.log('\nExtracted FAQs:');
      // Format the output with proper JSON syntax
      const formattedOutput = {
        faqs: faqs.map(faq => ({
          question: faq.question,
          defaultAnswer: faq.defaultAnswer
        }))
      };
      console.log(JSON.stringify(formattedOutput, null, 2));
      
      if (faqs.length > 0) {
        return faqs;
      }
      
      // If no FAQs were extracted, fall back to default FAQs
      return [
        {
          question: "What are your hours?",
          defaultAnswer: `Our regular business hours for our ${type} are Monday to Friday from 9 AM to 5 PM, Saturday from 10 AM to 3 PM, and we're closed on Sunday.`
        },
        {
          question: "How can I contact you?",
          defaultAnswer: `You can reach our ${type} by phone at our business number, or send us an email at info@yourbusiness.com.`
        },
        {
          question: "Do you offer any discounts?",
          defaultAnswer: "We occasionally offer seasonal promotions and discounts. Please call us or check our website for current offers."
        }
      ];
    } catch (error) {
      console.error("Error extracting FAQs:", error);
      
      // Last resort: create some default FAQs
      return [
        {
          question: "What are your hours?",
          defaultAnswer: `Our regular business hours for our ${type} are Monday to Friday from 9 AM to 5 PM, Saturday from 10 AM to 3 PM, and we're closed on Sunday.`
        },
        {
          question: "How can I contact you?",
          defaultAnswer: `You can reach our ${type} by phone at our business number, or send us an email at info@yourbusiness.com.`
        },
        {
          question: "Do you offer any discounts?",
          defaultAnswer: "We occasionally offer seasonal promotions and discounts. Please call us or check our website for current offers."
        }
      ];
    }
  } catch (error) {
    console.error("Error generating industry FAQs:", error);
    return [];
  }
}

// Main execution
(async () => {
  try {
    await generateIndustryFAQs(businessType);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
