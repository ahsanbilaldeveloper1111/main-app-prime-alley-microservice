import { NextApiRequest, NextApiResponse } from 'next';
import { getServerTmsSession } from '../../../utils/tmsSessionServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get TMS session ID from cookie
    const sessionId = req.cookies?.tmsSessionId;
    
    if (!sessionId) {
      return res.status(401).json({ message: 'No TMS session found' });
    }

    // Retrieve session data from memory store
    if (!global.tmsSessions) {
      return res.status(401).json({ message: 'No TMS session found' });
    }

    const tmsSession = global.tmsSessions.get(sessionId);
    
    if (!tmsSession) {
      return res.status(401).json({ message: 'TMS session expired or not found' });
    }

    // Check if session is still valid
    const now = Math.floor(Date.now() / 1000);
    if (tmsSession.expiresAt <= now) {
      // Clean up expired session
      global.tmsSessions.delete(sessionId);
      return res.status(401).json({ message: 'TMS session expired' });
    }

    return res.status(200).json({
      session: tmsSession
    });
  } catch (error) {
    console.error('TMS session API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
