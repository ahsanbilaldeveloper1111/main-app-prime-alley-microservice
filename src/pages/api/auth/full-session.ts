import { NextApiRequest, NextApiResponse } from 'next';
import { sessionStore } from '../../../utils/sessionStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const sessionData = sessionStore.get(sessionId);

    if (!sessionData) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if session is expired
    if (new Date(sessionData.expires) <= new Date()) {
      sessionStore.delete(sessionId);
      return res.status(401).json({ message: 'Session expired' });
    }

    // Clean up the session data - remove TMS session if it's not valid
    const cleanedSessionData = {
      ...sessionData,
      user: {
        ...sessionData.user,
        // Only include TMS session if it has valid data
        tmsSession: sessionData.user.tmsSession && 
                   sessionData.user.tmsSession.accessToken && 
                   sessionData.user.tmsSession.user ? 
                   sessionData.user.tmsSession : undefined
      }
    };

    console.log('Returning cleaned session data:', {
      hasTmsSession: !!cleanedSessionData.user.tmsSession,
      tmsSessionValid: !!(cleanedSessionData.user.tmsSession?.accessToken && cleanedSessionData.user.tmsSession?.user)
    });

    return res.status(200).json(cleanedSessionData);

  } catch (error) {
    console.error('Full session API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
