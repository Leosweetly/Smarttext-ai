import { NextResponse } from "next/server";
import { runMissedCallDemo, generateTierComparison } from "../../lib/demo-controller";

/**
 * API route for simulating a missed call in the demo environment
 * This is a modified version of the production missed call handler
 */
export async function POST(req) {
  try {
    // Parse the request body
    const body = await req.json();
    
    // Extract parameters
    const { businessType, tier, scenarioId, customMessage, customPhoneNumber } = body;
    
    // Validate required parameters
    if (!businessType || !tier || !scenarioId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required parameters: businessType, tier, and scenarioId are required" 
        },
        { status: 400 }
      );
    }
    
    // Run the missed call demo
    const demoResults = await runMissedCallDemo(businessType, tier, scenarioId, customMessage, customPhoneNumber);
    
    return NextResponse.json(demoResults);
  } catch (error) {
    console.error("Error in demo missed call API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * API route for comparing responses across different subscription tiers
 */
export async function GET(req) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const businessType = searchParams.get("businessType");
    const scenarioId = searchParams.get("scenarioId");
    const customMessage = searchParams.get("customMessage") || "";
    
    // Validate required parameters
    if (!businessType || !scenarioId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required parameters: businessType and scenarioId are required" 
        },
        { status: 400 }
      );
    }
    
    // Generate tier comparison
    const comparisonResults = await generateTierComparison(businessType, scenarioId, customMessage);
    
    return NextResponse.json(comparisonResults);
  } catch (error) {
    console.error("Error in demo tier comparison API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
