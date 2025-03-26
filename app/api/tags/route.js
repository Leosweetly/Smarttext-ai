/**
 * API routes for tags
 * 
 * These routes handle CRUD operations for tags and tag assignments.
 */

import { NextResponse } from 'next/server';
import { 
  createTag, 
  getTagById, 
  updateTag, 
  deleteTag, 
  getTagsByBusinessId,
  getTagsByParentId,
  getRootTags,
  searchTags
} from '../../../lib/tags';
import { validateAuth } from '../../../lib/auth/api-auth';

/**
 * GET /api/tags
 * Get tags for the current business
 * 
 * Query parameters:
 * - parentId: Get child tags for a parent tag
 * - search: Search tags by name
 * - rootOnly: Get only root tags (tags with no parent)
 */
export async function GET(request) {
  try {
    // Validate authentication
    const authResult = await validateAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    
    // Get the business ID from the auth result
    const businessId = authResult.businessId;
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID not found in session' }, { status: 400 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const search = searchParams.get('search');
    const rootOnly = searchParams.get('rootOnly') === 'true';
    
    let tags;
    
    // Handle different query types
    if (search) {
      // Search tags
      tags = await searchTags(businessId, search);
    } else if (parentId) {
      // Get child tags
      tags = await getTagsByParentId(parentId);
    } else if (rootOnly) {
      // Get root tags
      tags = await getRootTags(businessId);
    } else {
      // Get all tags
      tags = await getTagsByBusinessId(businessId);
    }
    
    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error in GET /api/tags:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/tags
 * Create a new tag
 * 
 * Request body:
 * - name: Tag name
 * - color: Tag color (hex code)
 * - parentId: Parent tag ID (optional)
 */
export async function POST(request) {
  try {
    // Validate authentication
    const authResult = await validateAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    
    // Get the business ID from the auth result
    const businessId = authResult.businessId;
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID not found in session' }, { status: 400 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }
    
    if (!body.color) {
      return NextResponse.json({ error: 'Tag color is required' }, { status: 400 });
    }
    
    // Create the tag
    const tag = await createTag({
      name: body.name,
      color: body.color,
      parentId: body.parentId || null,
      businessId
    });
    
    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/tags:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Note: GET_BY_ID function has been removed as it's not a valid Next.js route export
// This functionality should be implemented in a dynamic route file like [id]/route.js

/**
 * PUT /api/tags/:id
 * Update a tag
 * 
 * Request body:
 * - name: Tag name (optional)
 * - color: Tag color (optional)
 * - parentId: Parent tag ID (optional)
 */
export async function PUT(request, { params }) {
  try {
    // Validate authentication
    const authResult = await validateAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    
    // Get the business ID from the auth result
    const businessId = authResult.businessId;
    
    // Get the tag
    const tag = await getTagById(params.id);
    
    // Check if the tag exists
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }
    
    // Check if the tag belongs to the user's business
    if (tag.businessId !== businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Update the tag
    const updatedTag = await updateTag(params.id, {
      name: body.name,
      color: body.color,
      parentId: body.parentId
    });
    
    return NextResponse.json({ tag: updatedTag });
  } catch (error) {
    console.error(`Error in PUT /api/tags/${params.id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/tags/:id
 * Delete a tag
 */
export async function DELETE(request, { params }) {
  try {
    // Validate authentication
    const authResult = await validateAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    
    // Get the business ID from the auth result
    const businessId = authResult.businessId;
    
    // Get the tag
    const tag = await getTagById(params.id);
    
    // Check if the tag exists
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }
    
    // Check if the tag belongs to the user's business
    if (tag.businessId !== businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Delete the tag
    await deleteTag(params.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error in DELETE /api/tags/${params.id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
