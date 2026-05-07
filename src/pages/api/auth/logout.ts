import { NextApiRequest, NextApiResponse } from 'next';
import { jwtPayloadStore, sessionStore } from '../../../utils/sessionStore';
import { setCookieClearHeaders } from '../../../utils/cookieUtils';
import { verifySmallPayload } from '../../../utils/smallJwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    if (sessionId) {
      // Clear specific session from memory store
      sessionStore.delete(sessionId);
    }

    // Clear NextAuth server-side payload store entry for THIS browser session (small cookie contains sessionId)
    // This prevents cases where sessionStorage is cleared but server still considers cookie session valid.
    const nextAuthCookie =
      req.cookies['next-auth.session-token'] || req.cookies['__Secure-next-auth.session-token'];
    const secret = process.env.NEXTAUTH_SECRET;

    if (nextAuthCookie && secret) {
      const payload = verifySmallPayload(nextAuthCookie, secret);
      if (payload?.sessionId) {
        jwtPayloadStore.delete(payload.sessionId);
        // Also delete from sessionStore just in case something stored there with same key.
        sessionStore.delete(payload.sessionId);
      }
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
