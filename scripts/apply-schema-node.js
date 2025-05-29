import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize Supabase client
const supabase = createClient(
  'https://aeojiqvwwmpfpxsttzca.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb2ppcXZ3d21wZnB4c3R0emNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDUwMTI5NiwiZXhwIjoyMDYwMDc3Mjk2fQ.xTKqiXxUj6ISgpwLHqbPT0Y4A-J8iqr1zO9YG1MmbC0'
);

async function applySchema() {
  try {
    // Get the directory name of the current module
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Read SQL files as text
    const schemaPath = path.join(__dirname, '../scripts/create-supabase-schema.sql');
    const rlsPath = path.join(__dirname, '../scripts/setup-supabase-rls.sql');

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const rls = fs.readFileSync(rlsPath, 'utf-8');

    // Execute schema
    const { error: schemaError } = await supabase
      .rpc('execute_sql', { sql: schema });

    if (schemaError) throw schemaError;

    // Execute RLS policies
    const { error: rlsError } = await supabase
      .rpc('execute_sql', { sql: rls });

    if (rlsError) throw rlsError;

    console.log('Schema and RLS policies applied successfully!');
  } catch (error) {
    console.error('Error applying schema:', error);
    process.exit(1);
  }
}

applySchema();
