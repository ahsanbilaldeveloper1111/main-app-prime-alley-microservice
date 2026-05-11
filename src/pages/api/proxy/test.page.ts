import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/';
  
  res.status(200).json({
    message: 'Proxy test endpoint',
    backendUrl: BACKEND_URL,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    headers: req.headers,
    method: req.method,
    url: req.url
  });
} 