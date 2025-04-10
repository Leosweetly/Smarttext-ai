import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    success: true, 
    message: '✅ SmartText API is running. No frontend here.' 
  });
}
