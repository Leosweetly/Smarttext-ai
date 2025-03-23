/**
 * API routes for notifications
 * 
 * These routes handle operations on notifications in the shared team inbox.
 */

import { NextResponse } from 'next/server';
import {
  getNotificationsByUserId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteOldNotifications,
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY
} from '../../../lib/inbox/notifications';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

/**
 * GET /api/notifications
 * Get notifications for the current user
 * 
 * Query parameters:
 * - unreadOnly: Whether to get only unread notifications (default: false)
 * - type: Filter by notification type
 * - limit: Maximum number of notifications to return
 * - offset: Offset for pagination
 */
export async function GET(request) {
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')) : undefined;
    
    // Get notifications
    const notifications = await getNotificationsByUserId(session.user.id, businessId, {
      unreadOnly,
      type,
      sortBy: 'createdAt',
      sortDirection: 'desc',
      limit,
      offset
    });
    
    // Get unread notification count
    const unreadCount = await getUnreadNotificationCount(session.user.id, businessId);
    
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/notifications/read
 * Mark all notifications as read
 */
export async function POST_READ(request) {
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
    
    // Mark all notifications as read
    const markedCount = await markAllNotificationsAsRead(session.user.id, businessId);
    
    return NextResponse.json({ markedCount });
  } catch (error) {
    console.error('Error in POST /api/notifications/read:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/notifications/unread
 * Get unread notification count
 */
export async function GET_UNREAD(request) {
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
    
    // Get unread notification count
    const unreadCount = await getUnreadNotificationCount(session.user.id, businessId);
    
    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('Error in GET /api/notifications/unread:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/notifications/cleanup
 * Delete old notifications
 * 
 * Request body:
 * - days: Number of days to keep notifications (default: 30)
 */
export async function POST_CLEANUP(request) {
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
    
    // Check if the user is an admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get request body
    const body = await request.json();
    const days = body.days || 30;
    
    // Delete old notifications
    const deletedCount = await deleteOldNotifications(businessId, days);
    
    return NextResponse.json({ deletedCount });
  } catch (error) {
    console.error('Error in POST /api/notifications/cleanup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
