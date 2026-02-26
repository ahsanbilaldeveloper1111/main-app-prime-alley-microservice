import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';

/**
 * API endpoint to sync tokens from client-side (sessionStorage).
 * No cookies are set here to keep request headers small and avoid 431.
 * Tokens live in sessionStorage; NextAuth JWT no longer stores tokens.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { access_token, refresh_token } = req.body;
    if (!access_token || !refresh_token) {
      return res.status(400).json({ error: 'access_token and refresh_token are required' });
    }

    return res.status(200).json({
      success: true,
      message: 'Tokens synced (client keeps in sessionStorage; no cookies set to avoid 431)',
    });
  } catch (error: unknown) {
    console.error('Sync tokens error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

