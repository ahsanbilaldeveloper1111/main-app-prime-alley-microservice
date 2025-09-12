import { NextApiRequest, NextApiResponse } from 'next';
import { sessionStore } from '../../../utils/sessionStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    if (sessionId) {
      // Clear specific session from memory store
      sessionStore.delete(sessionId);
      console.log('Cleared TMS session from memory store:', sessionId);
    }

    // Clear the TMS session ID cookie with multiple variations to ensure it's cleared
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      'tmsSessionId=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'tmsSessionId=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ];
    
    // Add Secure flag for production
    if (isProduction) {
      cookieOptions.push('tmsSessionId=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    }
    
    console.log('Setting cookie clearing headers:', cookieOptions);
    res.setHeader('Set-Cookie', cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'TMS session cleared successfully'
    });

  } catch (error) {
    console.error('Logout API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
