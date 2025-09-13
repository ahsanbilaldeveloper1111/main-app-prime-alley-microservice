import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getToken } from 'next-auth/jwt';
import '../../../utils/sessionCleanup';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { accessToken, userData, expiresIn } = req.body;

    if (!accessToken || !userData) {
      return res.status(400).json({ message: 'Missing required data' });
    }

    // Create TMS session data
    const expiresAt = Math.floor(Date.now() / 1000) + (expiresIn || 3600);
    const sessionId = `tms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const tmsSessionData = {
      sessionId,
      accessToken,
      expiresAt,
      user: {
        ...userData,
        id: userData?.id?.toString()
      }
    };

    // Store session data in memory (in production, use Redis or database)
    // For now, we'll use a simple in-memory store
    if (!global.tmsSessions) {
      global.tmsSessions = new Map();
    }
    global.tmsSessions.set(sessionId, tmsSessionData);

    // Set only session ID in cookie (much smaller)
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      `tmsSessionId=${sessionId}`,
      'HttpOnly',
      'SameSite=Strict',
      `Max-Age=${expiresIn || 3600}`,
      'Path=/'
    ];
    
    // Only add Secure flag in production (HTTPS)
    if (isProduction) {
      cookieOptions.push('Secure');
    }
    
    res.setHeader('Set-Cookie', cookieOptions.join('; '));
    
    console.log('TMS session created:', { 
      sessionId,
      expiresIn: expiresIn || 3600, 
      isProduction,
      sessionDataSize: JSON.stringify(tmsSessionData).length 
    });

    return res.status(200).json({
      success: true,
      message: 'TMS session created successfully'
    });
  } catch (error) {
    console.error('TMS auth API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
