import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Input sanitization helper
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/script/gi, '') // Remove script references
    .substring(0, 500); // Limit length
}

// Enhanced email validation
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const sanitized = sanitizeInput(email);
  
  return emailRegex.test(sanitized) && sanitized.length <= 254;
}

// Request validation helper
function validateRequest(body: any): { isValid: boolean; error?: string } {
  // Check if body exists and is an object
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      isValid: false,
      error: 'Request body must be a valid JSON object'
    };
  }

  // Check if body is empty
  if (Object.keys(body).length === 0) {
    return {
      isValid: false,
      error: 'Request body cannot be empty'
    };
  }

  // Validate customerEmail if provided
  if (body.customerEmail !== undefined) {
    if (typeof body.customerEmail !== 'string') {
      return {
        isValid: false,
        error: 'Customer email must be a string'
      };
    }

    if (body.customerEmail.trim() && !isValidEmail(body.customerEmail)) {
      return {
        isValid: false,
        error: 'Invalid email format'
      };
    }
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /\.\.\//, // Path traversal
    /\0/, // Null bytes
  ];

  const bodyString = JSON.stringify(body);
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(bodyString)) {
      return {
        isValid: false,
        error: 'Invalid characters detected in request'
      };
    }
  }

  return { isValid: true };
}

// Security headers helper
function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body with error handling
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          message: 'Request body must be valid JSON'
        }, 
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      );
    }

    // Validate request
    const validation = validateRequest(body);
    if (!validation.isValid) {
      console.warn('Request validation failed:', validation.error);
      return NextResponse.json(
        { 
          error: 'Validation error',
          message: validation.error
        }, 
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      );
    }

    // Sanitize and extract customerEmail
    const rawCustomerEmail = body.customerEmail;
    const customerEmail = rawCustomerEmail ? sanitizeInput(rawCustomerEmail) : undefined;

    console.log('Creating Stripe checkout session with:', { 
      customerEmail: customerEmail ? 'provided' : 'not provided',
      hasValidEmail: customerEmail ? isValidEmail(customerEmail) : false
    });

    // Validate required environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured');
      return NextResponse.json(
        { 
          error: "Configuration error",
          message: "Payment system is not properly configured"
        }, 
        { 
          status: 500,
          headers: getSecurityHeaders()
        }
      );
    }

    if (!process.env.STRIPE_PRICE_PRO) {
      console.error('STRIPE_PRICE_PRO is not configured');
      return NextResponse.json(
        { 
          error: "Configuration error",
          message: "Product pricing is not properly configured"
        }, 
        { 
          status: 500,
          headers: getSecurityHeaders()
        }
      );
    }

    if (!process.env.STRIPE_SUCCESS_URL || !process.env.STRIPE_CANCEL_URL) {
      console.error('STRIPE_SUCCESS_URL or STRIPE_CANCEL_URL is not configured');
      return NextResponse.json(
        { 
          error: "Configuration error",
          message: "Redirect URLs are not properly configured"
        }, 
        { 
          status: 500,
          headers: getSecurityHeaders()
        }
      );
    }

    // Prepare checkout session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_PRO,
          quantity: 1,
        },
      ],
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      payment_method_types: ['card'],
      subscription_data: {
        trial_period_days: 14, // 14-day trial for Pro plan
      },
    };

    // Add customer email if provided and valid
    if (customerEmail && isValidEmail(customerEmail)) {
      sessionParams.customer_email = customerEmail;
      console.log('Added customer email to session');
    } else if (customerEmail) {
      console.warn('Invalid email format provided, continuing without email');
    }

    // Create the checkout session
    console.log('Creating Stripe checkout session with params:', {
      mode: sessionParams.mode,
      price: process.env.STRIPE_PRICE_PRO,
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      customer_email: sessionParams.customer_email || 'not provided',
      trial_period_days: sessionParams.subscription_data?.trial_period_days
    });

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('Stripe checkout session created successfully:', {
      sessionId: session.id,
      url: session.url ? 'generated' : 'not generated'
    });

    // Return the session URL
    return NextResponse.json(
      { 
        url: session.url,
        sessionId: session.id
      }, 
      { 
        status: 200,
        headers: getSecurityHeaders()
      }
    );

  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', {
      type: error.type || 'unknown',
      message: error.message || 'unknown error'
    });

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { 
          error: "Payment error",
          message: "There was an issue with the payment method"
        }, 
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      );
    }

    if (error.type === 'StripeRateLimitError') {
      return NextResponse.json(
        { 
          error: "Rate limit error",
          message: "Too many requests. Please try again later"
        }, 
        { 
          status: 429,
          headers: getSecurityHeaders()
        }
      );
    }

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { 
          error: "Invalid request",
          message: "The request was invalid. Please check your information and try again"
        }, 
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      );
    }

    if (error.type === 'StripeAPIError') {
      return NextResponse.json(
        { 
          error: "Payment service error",
          message: "Payment service is temporarily unavailable. Please try again later"
        }, 
        { 
          status: 503,
          headers: getSecurityHeaders()
        }
      );
    }

    if (error.type === 'StripeConnectionError') {
      return NextResponse.json(
        { 
          error: "Connection error",
          message: "Unable to connect to payment service. Please try again"
        }, 
        { 
          status: 503,
          headers: getSecurityHeaders()
        }
      );
    }

    if (error.type === 'StripeAuthenticationError') {
      console.error('Stripe authentication error - check API keys');
      return NextResponse.json(
        { 
          error: "Authentication error",
          message: "Payment system authentication failed"
        }, 
        { 
          status: 500,
          headers: getSecurityHeaders()
        }
      );
    }

    // Handle JSON parsing errors
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      return NextResponse.json(
        { 
          error: "Invalid request format",
          message: "Request body must be valid JSON"
        }, 
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      );
    }

    // Generic error fallback - sanitize error message
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later"
      }, 
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    );
  }
}

// Handle GET requests
export async function GET() {
  return NextResponse.json(
    { 
      error: "Method not allowed",
      message: "This endpoint only accepts POST requests"
    }, 
    { 
      status: 405,
      headers: {
        ...getSecurityHeaders(),
        "Allow": "POST"
      }
    }
  );
}

// Handle PUT requests
export async function PUT() {
  return NextResponse.json(
    { 
      error: "Method not allowed",
      message: "This endpoint only accepts POST requests"
    }, 
    { 
      status: 405,
      headers: {
        ...getSecurityHeaders(),
        "Allow": "POST"
      }
    }
  );
}

// Handle DELETE requests
export async function DELETE() {
  return NextResponse.json(
    { 
      error: "Method not allowed",
      message: "This endpoint only accepts POST requests"
    }, 
    { 
      status: 405,
      headers: {
        ...getSecurityHeaders(),
        "Allow": "POST"
      }
    }
  );
}

// Handle PATCH requests
export async function PATCH() {
  return NextResponse.json(
    { 
      error: "Method not allowed",
      message: "This endpoint only accepts POST requests"
    }, 
    { 
      status: 405,
      headers: {
        ...getSecurityHeaders(),
        "Allow": "POST"
      }
    }
  );
}
