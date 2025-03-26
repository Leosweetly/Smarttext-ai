/**
 * API routes for notes
 * 
 * These routes handle CRUD operations for notes.
 */

import { NextResponse } from 'next/server';
import { 
  createNote, 
  getNoteById, 
  updateNote, 
  deleteNote, 
  getNotesForEntity,
  getNotesByBusinessId,
  searchNotes,
  archiveNote,
  unarchiveNote
} from '../../../lib/notes';
import { getSession } from './auth-utils';

/**
 * GET /api/notes
 * Get notes for the current business
 * 
 * Query parameters:
 * - entityId: Get notes for a specific entity
 * - entityType: The type of entity ('contact', 'conversation', etc.)
 * - search: Search notes by content
 * - includeArchived: Whether to include archived notes (default: false)
 * - limit: Maximum number of notes to return
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
    const entityId = searchParams.get('entityId');
    const entityType = searchParams.get('entityType');
    const search = searchParams.get('search');
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : undefined;
    
    let notes;
    
    // Handle different query types
    if (search) {
      // Search notes
      notes = await searchNotes(businessId, search, { 
        includeArchived,
        entityType
      });
    } else if (entityId && entityType) {
      // Get notes for an entity
      notes = await getNotesForEntity(entityId, entityType, { 
        includeArchived,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      });
    } else {
      // Get all notes for the business
      notes = await getNotesByBusinessId(businessId, {
        includeArchived,
        limit,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      });
    }
    
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error in GET /api/notes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/notes
 * Create a new note
 * 
 * Request body:
 * - content: Note content
 * - entityId: The ID of the entity the note is attached to
 * - entityType: The type of entity ('contact', 'conversation', etc.)
 */
export async function POST(request) {
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
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.content) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }
    
    if (!body.entityId) {
      return NextResponse.json({ error: 'Entity ID is required' }, { status: 400 });
    }
    
    if (!body.entityType) {
      return NextResponse.json({ error: 'Entity type is required' }, { status: 400 });
    }
    
    // Create the note
    const note = await createNote({
      content: body.content,
      entityId: body.entityId,
      entityType: body.entityType,
      createdBy: session.user.id,
      businessId
    });
    
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/notes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Note: GET_BY_ID function has been removed as it's not a valid Next.js route export
// This functionality should be implemented in a dynamic route file like [id]/route.js

/**
 * PUT /api/notes/:id
 * Update a note
 * 
 * Request body:
 * - content: Note content
 */
export async function PUT(request, { params }) {
  try {
    // Get the session
    const session = await getSession(request, new Response());
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the note
    const note = await getNoteById(params.id);
    
    // Check if the note exists
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    
    // Check if the note belongs to the user's business
    if (note.businessId !== session.user.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.content) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }
    
    // Update the note
    const updatedNote = await updateNote(params.id, {
      content: body.content
    });
    
    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error(`Error in PUT /api/notes/${params.id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
export async function DELETE(request, { params }) {
  try {
    // Get the session
    const session = await getSession(request, new Response());
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the note
    const note = await getNoteById(params.id);
    
    // Check if the note exists
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    
    // Check if the note belongs to the user's business
    if (note.businessId !== session.user.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Delete the note
    await deleteNote(params.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error in DELETE /api/notes/${params.id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Note: POST_ARCHIVE and POST_UNARCHIVE functions have been removed as they're not valid Next.js route exports
// These functionalities should be implemented in dynamic route files like [id]/archive/route.js and [id]/unarchive/route.js
