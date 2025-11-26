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

    // Return the session data as-is (tmsSession has been removed from the structure)
    // console.log('Returning session data:', {
    //   userId: sessionData.user.id,
    //   hasTmsPermissions: !!sessionData.user.tmsPermissions,
    //   tmsPermissionsCount: sessionData.user.tmsPermissions?.length || 0
    // });

    return res.status(200).json(sessionData);

  } catch (error) {
    console.error('Full session API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
