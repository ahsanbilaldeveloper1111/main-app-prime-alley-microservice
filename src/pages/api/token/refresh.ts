import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { refresh_token, force_refresh } = req.body;

    const response = await axios.post(
      'http://crmstaging.sipzon.com:74800/api/auth/refreshToken',
      { refresh_token, force_refresh },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        proxy: false
      }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Refresh token error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal server error' });
  }
}
