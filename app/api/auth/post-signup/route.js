import { NextResponse } from "next/server";
import { createBusiness } from "../../../../lib/data/business";
import { configureTwilioNumber } from "../../../../lib/twilio/phone-manager";
import { saveOnboardingToAirtable } from "../../../../lib/onboarding/airtable";

export async function POST(req) {
  try {
    const { user, phoneNumber, plan } = await req.json();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User data is required" },
        { status: 400 }
      );
    }
    
    // Create the business
    const business = await createBusiness({
      name: user.name || "My Business",
      phoneNumber: phoneNumber || "",
      subscriptionTier: plan || "basic",
      // Add other default fields
      address: "",
      businessType: "other",
      hours: {},
      // Add onboarding data to customSettings
      customSettings: {
        onboarding: {
          completed: false,
          currentStep: "businessInfo",
          lastUpdated: new Date().toISOString(),
          steps: {
            businessInfo: {
              completed: false
            },
            phoneSetup: {
              completed: false
            },
            preferences: {
              completed: false
            }
          }
        }
      }
    });
    
    // Configure Twilio if phone number is provided
    let twilioConfig = null;
    if (phoneNumber) {
      try {
        twilioConfig = await configureTwilioNumber(phoneNumber);
      } catch (twilioError) {
        console.error("Error configuring Twilio:", twilioError);
        // Continue even if Twilio configuration fails
      }
    }
    
    // Initialize onboarding data in Airtable
    const onboardingData = {
      userId: user.sub,
      steps: {
        businessInfo: {
          completed: false,
          data: {
            name: user.name || "",
            businessType: "other",
            address: "",
          }
        },
        phoneSetup: {
          completed: false,
          data: {
            phoneNumber: phoneNumber || "",
            configured: !!twilioConfig
          }
        },
        preferences: {
          completed: false,
          data: {
            notifications: true,
            autoRespond: true,
            theme: "light"
          }
        }
      },
      currentStep: "businessInfo",
      completed: false,
      lastUpdated: new Date().toISOString()
    };
    
    // Save onboarding data to Airtable
    await saveOnboardingToAirtable(business.id, onboardingData);
    
    return NextResponse.json({
      success: true,
      business,
      twilioConfig,
      onboarding: {
        initialized: true
      }
    });
  } catch (error) {
    console.error("Error in post-signup processing:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}
