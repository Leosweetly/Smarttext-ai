import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('App Router create-checkout-session called with:', body);
    
    // Placeholder response that indicates Stripe checkout is not yet implemented
    // but suggests using the trial flow instead
    return NextResponse.json(
      { 
        message: "Stripe checkout not yet implemented in App Router - using trial flow instead",
        redirectToTrial: true,
        suggestion: "Please use the business trial signup flow for now"
      }, 
      { 
        status: 200,
        headers: { 
          "Content-Type": "application/json" 
        }
      }
    );
  } catch (error: any) {
    console.error('Error in create-checkout-session App Router:', error);
    
    return NextResponse.json(
      { 
        error: "Failed to process checkout session request",
        message: error.message || "Unknown error occurred"
      }, 
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json" 
        }
      }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." }, 
    { status: 405 }
  );
}
