import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle both JSON and form data
    let refresh_token: string;
    let force_refresh: boolean = false;

    if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
      // Parse form data
      const formData = new URLSearchParams(req.body as string);
      refresh_token = formData.get('refresh_token') || '';
      force_refresh = formData.get('force_refresh') === 'true';
    } else {
      // Parse JSON
      refresh_token = req.body?.refresh_token || '';
      force_refresh = req.body?.force_refresh === true;
    }

    if (!refresh_token) {
      return res.status(400).json({ error: 'refresh_token is required' });
    }

    // Send as form data to backend
    const formData = new URLSearchParams();
    formData.append('refresh_token', refresh_token);
    if (force_refresh) {
      formData.append('force_refresh', 'true');
    }

    const response = await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL + 'auth/refreshToken',
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        proxy: false
      }
    );

    // If refresh is successful, set a cookie with the new refresh token
    // This allows NextAuth JWT callback to sync the refresh token
    if (response.data.code === 200 && response.data.data?.refresh_token?.access_token) {
      const refreshToken = response.data.data.refresh_token.access_token;
      const refreshTokenExpires = response.data.data.refresh_token.expires_in || 0;
      
      // Set cookie with refresh token (for NextAuth to sync)
      // Cookie expires when refresh token expires
      const cookieMaxAge = refreshTokenExpires > 0 ? refreshTokenExpires : 7 * 24 * 60 * 60; // Default 7 days
      res.setHeader('Set-Cookie', [
        `nextauth-refresh-token=${refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${cookieMaxAge}`,
        // Also set a flag to indicate token was refreshed
        `nextauth-token-refreshed=true; Path=/; SameSite=Lax; Max-Age=60` // 1 minute flag
      ]);
    }

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Refresh token error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal server error' });
  }
}
