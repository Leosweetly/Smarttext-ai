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
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

/**
 * GET /api/notifications/[notificationId]
 * Get a specific notification
 */
export async function GET(request, { params }) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
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

/**
 * POST /api/notifications/[notificationId]/read
 * Mark a notification as read
 */
export async function POST_READ(request, { params }) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
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
    
    // Mark the notification as read
    const updatedNotification = await markNotificationAsRead(notificationId);
    
    return NextResponse.json({ notification: updatedNotification });
  } catch (error) {
    console.error(`Error in POST /api/notifications/${params.notificationId}/read:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
