import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { sessionStore } from '../../../utils/sessionStore';
import { setCookieClearHeaders } from '../../../utils/cookieUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow both POST and GET for sendBeacon compatibility
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify user is authenticated
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get user ID to clear only their sessions (optional - can clear all if needed)
    const userId = session.user.id;

    // Clear all sessions from memory store
    let clearedCount = 0;
    if (global.nextAuthSessions) {
      const sessionsToDelete: string[] = [];
      
      // Find all sessions to delete
      // Option 1: Clear all sessions (more secure)
      global.nextAuthSessions.forEach((sessionData: any, sessionId: string) => {
        sessionsToDelete.push(sessionId);
      });
      
      // Option 2: Clear only sessions for this user (uncomment if preferred)
      // global.nextAuthSessions.forEach((sessionData: any, sessionId: string) => {
      //   if (sessionData.user?.id === userId) {
      //     sessionsToDelete.push(sessionId);
      //   }
      // });
      
      // Delete all identified sessions
      sessionsToDelete.forEach(sessionId => {
        sessionStore.delete(sessionId);
        clearedCount++;
      });
    }


    // Clear all cookies related to sessions (including NextAuth cookies)
    setCookieClearHeaders(res, true);

    console.log(`Cleared ${clearedCount} sessions on browser close`);

    return res.status(200).json({
      success: true,
      message: 'All sessions cleared successfully',
      clearedCount
    });

  } catch (error) {
    console.error('Clear all sessions API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

