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
import { getSession } from './auth-utils';

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
    const session = await getSession(request, new Response());
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

// Note: POST_READ, GET_UNREAD, and POST_CLEANUP functions have been removed as they're not valid Next.js route exports
// These functionalities should be implemented in separate route files like read/route.js, unread/route.js, and cleanup/route.js
