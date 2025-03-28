import Airtable from "airtable";

// Check if required environment variables are set
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Initialize Airtable base if credentials are available
let base;
try {
  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    console.warn("Airtable credentials not found in environment variables");
  } else {
    base = new Airtable({ apiKey: AIRTABLE_PAT }).base(AIRTABLE_BASE_ID);
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
