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

    // No cookies set – tokens stay in sessionStorage to keep headers small and avoid 431
    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Refresh token error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal server error' });
  }
}
