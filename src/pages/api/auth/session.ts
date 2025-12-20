import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { sessionStore, NextAuthSessionData } from '../../../utils/sessionStore';
import { randomBytes } from 'crypto';

// Request deduplication cache - stores pending requests by user identifier
// This prevents multiple concurrent requests from the same user from blocking each other
interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

declare global {
  var sessionRequestCache: Map<string, PendingRequest> | undefined;
}

if (!global.sessionRequestCache) {
  global.sessionRequestCache = new Map();
}

// Clean up stale cache entries (older than 5 seconds)
const cleanupCache = () => {
  const now = Date.now();
  global.sessionRequestCache!.forEach((value, key) => {
    if (now - value.timestamp > 5000) {
      global.sessionRequestCache!.delete(key);
    }
  });
};

// Get a cache key based on cookies (to identify same user across tabs)
const getCacheKey = (req: NextApiRequest): string => {
  // Use NextAuth session token cookie as identifier
  const sessionToken = req.cookies['next-auth.session-token'] || req.cookies['__Secure-next-auth.session-token'];
  return sessionToken || 'anonymous';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Clean up stale cache entries periodically
    cleanupCache();

    // Get cache key for request deduplication
    const cacheKey = getCacheKey(req);
    
    // Check if there's already a pending request for this user
    const pendingRequest = global.sessionRequestCache!.get(cacheKey);
    
    if (pendingRequest && Date.now() - pendingRequest.timestamp < 2000) {
      // If there's a recent pending request (within 2 seconds), wait for it
      try {
        const result = await pendingRequest.promise;
        return res.status(200).json(result);
      } catch (error) {
        // If the pending request failed, continue with new request
        global.sessionRequestCache!.delete(cacheKey);
      }
    }

    // Create a new request promise
    const requestPromise = (async () => {
      try {
        const session = await getServerSession(req, res, authOptions);
        
        if (!session?.user) {
          throw new Error('Not authenticated');
        }

        // Generate a session ID for this request
        const sessionId = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Create session data
        const sessionData: NextAuthSessionData = {
          user: {
            ...session.user
          },
          expires: expires.toISOString()
        };

        // Store session data in memory
        sessionStore.set(sessionId, sessionData);

        // Return session with session ID
        return {
          ...session,
          user: {
            ...session.user,
            sessionId: sessionId
          }
        };
      } catch (error) {
        console.error('Session API error:', error);
        throw error;
      }
    })();

    // Store the pending request in cache
    global.sessionRequestCache!.set(cacheKey, {
      promise: requestPromise,
      timestamp: Date.now()
    });

    try {
      const result = await requestPromise;
      
      // Remove from cache after successful completion
      global.sessionRequestCache!.delete(cacheKey);
      
      return res.status(200).json(result);
    } catch (error: any) {
      // Remove from cache on error
      global.sessionRequestCache!.delete(cacheKey);
      
      if (error.message === 'Not authenticated') {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      console.error('Session API error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
