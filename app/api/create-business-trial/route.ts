import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { withSecurity, SecurityPresets } from '../../../middleware/security';
import { sanitizeInput, validateEmail, validatePhoneNumber, checkHoneypot, getSecurityHeaders } from '../../../lib/security';
import { auditFormSubmission, auditBusiness } from '../../../lib/audit';

// Extract user ID from Supabase Auth (simplified for now - can be enhanced with JWT parsing)
async function getUserIdFromAuth(request: NextRequest): Promise<string | null> {
  try {
    // Check for Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid authorization header found');
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Auth verification failed:', error?.message);
      return null;
    }

    console.log('User authenticated successfully:', user.id);
    return user.id;
  } catch (error) {
    console.error('Error extracting user ID from auth:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Trial Business Creation Request Started ===');
    
    // Parse the request body
    let body: any;
    try {
      body = await request.json();
      console.log('Request body parsed successfully');
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

    // Extract and validate required fields
    const {
      name,
      phoneNumber,
      twilioNumber,
      industry,
      trialPlan = 'pro', // Default to pro trial
      hoursJson,
      website,
      teamSize,
      address,
      email,
      onlineOrderingLink,
      reservationLink,
      faqs,
      customAutoTextMessage,
    } = body;

    console.log('Extracted fields:', {
      name: name ? 'provided' : 'missing',
      phoneNumber: phoneNumber ? 'provided' : 'missing',
      twilioNumber: twilioNumber ? 'provided' : 'missing',
      industry: industry ? 'provided' : 'missing',
      trialPlan,
      email: email ? 'provided' : 'missing'
    });

    // Validate required fields
    if (!name || !phoneNumber || !industry) {
      const missingFields: string[] = [];
      if (!name) missingFields.push('name');
      if (!phoneNumber) missingFields.push('phoneNumber');
      if (!industry) missingFields.push('industry');

      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          missingFields,
          message: `The following required fields are missing: ${missingFields.join(', ')}`
        },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      );
    }

    // Get user ID from authentication (optional for now, can be made required later)
    const userId = await getUserIdFromAuth(request);
    console.log('User ID from auth:', userId || 'not authenticated');

    // Clean and validate phone number
    let cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
    let finalPhoneNumber = phoneNumber; // fallback

    const parsedPhone = parsePhoneNumberFromString(phoneNumber, 'US');
    if (parsedPhone && parsedPhone.isValid()) {
      finalPhoneNumber = parsedPhone.number; // E.164 format
      console.log('Phone number validated and formatted:', finalPhoneNumber);
    } else if (cleanedPhoneNumber.length === 10) {
      finalPhoneNumber = `+1${cleanedPhoneNumber}`;
      console.log('Phone number formatted with US country code:', finalPhoneNumber);
    } else {
      console.warn('Invalid phone number format, using as provided:', phoneNumber);
    }

    // Validate email if provided
    if (email) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        console.error('Invalid email format:', email, emailValidation.reason);
        
        // Audit failed form submission
        await auditFormSubmission('trial-business', false, {
          validationErrors: [emailValidation.reason || 'Invalid email format'],
          request
        });
        
        return NextResponse.json(
          { 
            error: 'Invalid email format',
            message: emailValidation.reason || 'Please provide a valid email address'
          },
          { 
            status: 400,
            headers: getSecurityHeaders()
          }
        );
      }
    }

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    const trialEndsAtISO = trialEndsAt.toISOString();
    
    console.log('Trial end date calculated:', trialEndsAtISO);

    // Parse team size safely
    const parsedTeamSize = teamSize ? parseInt(teamSize, 10) : 1;

    // Prepare Supabase insert payload
    const supabaseFields: any = {
      name: sanitizeInput(name),
      public_phone: finalPhoneNumber,
      business_type: sanitizeInput(industry),
      subscription_tier: 'trial',
      trial_ends_at: trialEndsAtISO,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add user ID if authenticated
    if (userId) {
      supabaseFields.user_id = userId;
    }

    // Add optional fields
    if (twilioNumber) {
      supabaseFields.twilio_phone = sanitizeInput(twilioNumber);
    }
    
    if (hoursJson) {
      try {
        // Validate JSON format
        const parsedHours = typeof hoursJson === 'string' ? JSON.parse(hoursJson) : hoursJson;
        supabaseFields.hours_json = parsedHours;
      } catch (e) {
        console.warn('Invalid hours JSON format, storing as string:', hoursJson);
        supabaseFields.hours_json = hoursJson;
      }
    }

    if (website) {
      supabaseFields.website = sanitizeInput(website);
    }

    if (parsedTeamSize) {
      supabaseFields.team_size = parsedTeamSize;
    }

    if (address) {
      supabaseFields.address = sanitizeInput(address);
    }

    if (email) {
      supabaseFields.email = sanitizeInput(email);
    }

    if (onlineOrderingLink) {
      supabaseFields.online_ordering_link = sanitizeInput(onlineOrderingLink);
    }

    if (reservationLink) {
      supabaseFields.reservation_link = sanitizeInput(reservationLink);
    }

    if (faqs) {
      try {
        const parsedFaqs = typeof faqs === 'string' ? JSON.parse(faqs) : faqs;
        supabaseFields.faqs_json = parsedFaqs;
      } catch (e) {
        console.warn('Invalid FAQs JSON format, storing as array:', faqs);
        supabaseFields.faqs_json = Array.isArray(faqs) ? faqs : [faqs];
      }
    }

    // Handle custom settings
    let customSettings: any = {};
    
    if (customAutoTextMessage) {
      customSettings.autoReplyMessage = sanitizeInput(customAutoTextMessage);
    }
    
    // Add trial plan to custom settings
    customSettings.trialPlan = trialPlan;
    customSettings.trialStartDate = new Date().toISOString();
    
    supabaseFields.custom_settings = customSettings;

    console.log('Prepared Supabase insert payload:', {
      ...supabaseFields,
      custom_settings: 'object with trial info',
      hours_json: supabaseFields.hours_json ? 'provided' : 'not provided',
      faqs_json: supabaseFields.faqs_json ? 'provided' : 'not provided'
    });

    // Insert into Supabase
    console.log('Attempting to insert business into Supabase...');
    const { data, error } = await supabase
      .from('businesses')
      .insert(supabaseFields)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Handle specific Supabase errors
      if (error.code === 'PGRST116' || error.message?.includes('invalid api key')) {
        return NextResponse.json(
          { 
            error: 'Database configuration error',
            message: 'Unable to connect to database. Please try again later.'
          },
          { 
            status: 500,
            headers: getSecurityHeaders()
          }
        );
      } else if (error.code === '42P01' || error.message?.includes('not found')) {
        return NextResponse.json(
          { 
            error: 'Database schema error',
            message: 'Database table not found. Please contact support.'
          },
          { 
            status: 500,
            headers: getSecurityHeaders()
          }
        );
      } else if (error.code === '42501' || error.message?.includes('permission')) {
        return NextResponse.json(
          { 
            error: 'Database permission error',
            message: 'Insufficient permissions to create business. Please contact support.'
          },
          { 
            status: 403,
            headers: getSecurityHeaders()
          }
        );
      } else if (error.code === '23505' || error.message?.includes('duplicate')) {
        return NextResponse.json(
          { 
            error: 'Duplicate business',
            message: 'A business with this information already exists.'
          },
          { 
            status: 409,
            headers: getSecurityHeaders()
          }
        );
      }

      return NextResponse.json(
        { 
          error: 'Database error',
          message: 'Failed to create business. Please try again.',
          details: error.message
        },
        { 
          status: 500,
          headers: getSecurityHeaders()
        }
      );
    }

    if (!data) {
      console.error('No data returned from Supabase insert');
      return NextResponse.json(
        { 
          error: 'Insert failed',
          message: 'Business creation failed - no data returned'
        },
        { 
          status: 500,
          headers: getSecurityHeaders()
        }
      );
    }

    console.log('✅ Business created successfully:', {
      businessId: data.id,
      name: data.name,
      trialEndsAt: data.trial_ends_at,
      subscriptionTier: data.subscription_tier
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        businessId: data.id,
        message: 'Trial business created successfully',
        data: {
          id: data.id,
          name: data.name,
          phoneNumber: data.public_phone,
          twilioNumber: data.twilio_phone,
          businessType: data.business_type,
          subscriptionTier: data.subscription_tier,
          trialEndsAt: data.trial_ends_at,
          createdAt: data.created_at
        }
      },
      { 
        status: 201,
        headers: getSecurityHeaders()
      }
    );

  } catch (error: any) {
    console.error('=== Trial Business Creation Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while creating the business. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      message: "This endpoint only accepts POST requests for creating trial businesses"
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

// Handle other HTTP methods
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
