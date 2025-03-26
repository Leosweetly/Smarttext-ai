/**
 * API routes for specific notification operations
 * 
 * These routes handle operations on individual notifications.
 */

import { NextResponse } from 'next/server';
import {
  getNotificationById,
  markNotificationAsRead
} from '../../../../lib/inbox/notifications';
import { getSession } from '../auth-utils';

/**
 * GET /api/notifications/[notificationId]
 * Get a specific notification
 */
export async function GET(request, { params }) {
  try {
    // Get the session
    const session = await getSession(request, new Response());
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the business ID from the session
    const businessId = session.user.businessId;
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID not found in session' }, { status: 400 });
    }
    
    // Get the notification ID from the URL
    const notificationId = params.notificationId;
    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }
    
    // Get the notification
    const notification = await getNotificationById(notificationId);
    
    // Check if the notification exists
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    // Check if the notification belongs to the user
    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Check if the notification belongs to the user's business
    if (notification.businessId !== businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    return NextResponse.json({ notification });
  } catch (error) {
    console.error(`Error in GET /api/notifications/${params.notificationId}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Note: POST_READ function has been removed as it's not a valid Next.js route export
// This functionality should be implemented in a separate route file like read/route.js
