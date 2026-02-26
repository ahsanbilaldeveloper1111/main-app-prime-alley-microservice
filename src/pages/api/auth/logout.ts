import { NextApiRequest, NextApiResponse } from 'next';
import { sessionStore } from '../../../utils/sessionStore';
import { setCookieClearHeaders } from '../../../utils/cookieUtils';

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

    // Clear all session cookies including NextAuth (avoids 431 and clean multi-account use)
    setCookieClearHeaders(res, true);

    return res.status(200).json({
      success: true,
      message: 'TMS session cleared successfully'
    });

  } catch (error) {
    console.error('Logout API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
