// API endpoint for updating business information
export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // or replace * with 'http://localhost:8080' if you want it stricter
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Respond to preflight (OPTIONS) request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Handle actual POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock success — replace this with Airtable integration when ready
    return res.status(200).json({
      success: true,
      id: 'mock-id-' + Date.now(),
      data: req.body,
    });
  } catch (error) {
    console.error('Error updating business info:', error);
    return res.status(500).json({ error: error.message });
  }
}