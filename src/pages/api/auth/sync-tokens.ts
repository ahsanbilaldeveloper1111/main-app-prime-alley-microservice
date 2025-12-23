import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';

/**
 * API endpoint to sync tokens from client-side (sessionStorage) to server-side (cookies)
 * This allows NextAuth JWT callback to read tokens from cookies
 * Called by tokenService after refreshing tokens
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user is authenticated
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get tokens from request body
    const {
      access_token,
      refresh_token,
      access_token_expires,
      refresh_token_expires
    } = req.body;

    if (!access_token || !refresh_token) {
      return res.status(400).json({ error: 'access_token and refresh_token are required' });
    }

    // Calculate cookie max age from expiry timestamps
    const now = Date.now();
    const accessTokenExpires = typeof access_token_expires === 'string' 
      ? parseInt(access_token_expires) 
      : access_token_expires || 0;
    const refreshTokenExpires = typeof refresh_token_expires === 'string'
      ? parseInt(refresh_token_expires)
      : refresh_token_expires || 0;

    // Calculate max age in seconds
    const accessTokenMaxAge = accessTokenExpires > now 
      ? Math.floor((accessTokenExpires - now) / 1000)
      : 15 * 60; // Default 15 minutes
    
    const refreshTokenMaxAge = refreshTokenExpires > now
      ? Math.floor((refreshTokenExpires - now) / 1000)
      : 2 * 60 * 60; // Default 2 hours

    // Set cookies with tokens
    // Using httpOnly for security, SameSite=Lax for CSRF protection
    const cookies: string[] = [
      `nextauth-access-token=${access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${accessTokenMaxAge}`,
      `nextauth-refresh-token=${refresh_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${refreshTokenMaxAge}`,
    ];

    // Also store expiry timestamps (non-httpOnly for client-side access if needed)
    if (accessTokenExpires > 0) {
      cookies.push(
        `nextauth-access-token-expires=${accessTokenExpires}; Path=/; SameSite=Lax; Max-Age=${accessTokenMaxAge}`
      );
    }
    if (refreshTokenExpires > 0) {
      cookies.push(
        `nextauth-refresh-token-expires=${refreshTokenExpires}; Path=/; SameSite=Lax; Max-Age=${refreshTokenMaxAge}`
      );
    }

    res.setHeader('Set-Cookie', cookies);

    return res.status(200).json({ 
      success: true,
      message: 'Tokens synced to cookies successfully'
    });
  } catch (error: any) {
    console.error('Sync tokens error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

