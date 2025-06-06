import Airtable from "airtable";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env.local
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
} catch (error) {
  console.warn("Error loading .env.local file:", error.message);
}

// Check if required environment variables are set
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Log environment variable status
console.log("Airtable client environment variables:");
console.log("AIRTABLE_PAT:", AIRTABLE_PAT ? "✅ Present" : "❌ Missing");
console.log("AIRTABLE_BASE_ID:", AIRTABLE_BASE_ID ? "✅ Present" : "❌ Missing");

// Initialize Airtable base if credentials are available
let base;
try {
  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    console.warn("Airtable credentials not found in environment variables");
  } else {
    base = new Airtable({ apiKey: AIRTABLE_PAT }).base(AIRTABLE_BASE_ID);
    console.log("✅ Airtable base initialized successfully");
  }
} catch (error) {
  console.error("Error initializing Airtable:", error);
}

// Helper function to safely get a table
export const getTable = (tableName) => {
  if (!base) {
    throw new Error("Airtable base not initialized. Check your environment variables.");
  }
  return base(tableName);
};

// Helper function to explore a table's schema
export async function exploreTableSchema(tableName) {
  try {
    const table = getTable(tableName);
    const records = await table.select({ maxRecords: 1 }).firstPage();
    
    if (records.length === 0) {
      return { fields: [], recordCount: 0 };
    }
    
    const record = records[0];
    const fields = Object.keys(record.fields).map(fieldName => ({
      name: fieldName,
      type: Array.isArray(record.get(fieldName)) 
        ? 'Array' 
        : typeof record.get(fieldName),
      sample: record.get(fieldName)
    }));
    
    const allRecords = await table.select().all();
    
    return {
      fields,
      recordCount: allRecords.length
    };
  } catch (error) {
    console.error(`Error exploring table ${tableName}:`, error);
    throw error;
  }
}
