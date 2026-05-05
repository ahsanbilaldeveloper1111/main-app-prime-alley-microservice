import type { NextApiRequest, NextApiResponse } from 'next';

// Note: This API uses a public exchange rate service (exchangerate-api.com)
// which is free and supports all major currencies including PKR.
// 
// For Next.js API routes (server-side), you can use any env variable name 
// without NEXT_PUBLIC_ prefix. NEXT_PUBLIC_ prefix is only needed for 
// client-side access in browser code.

interface ExchangeRateResponse {
  success: boolean;
  rate?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExchangeRateResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ success: false, error: 'Missing from or to currency' });
  }

  if (from === to) {
    return res.status(200).json({ success: true, rate: 1 });
  }

  try {
    // Use a public exchange rate API (free and reliable)
    // This API supports all major currencies including PKR, USD, EUR, GBP, etc.
    try {
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${(from as string).toUpperCase()}`
      );
      
      if (!response.ok) {
        throw new Error(`Exchange rate API returned ${response.status}`);
      }
      
      const data = await response.json();
      const rate = data.rates?.[(to as string).toUpperCase()];
      
      if (rate && typeof rate === 'number') {
        return res.status(200).json({ success: true, rate });
      } else {
        throw new Error(`Exchange rate not found for ${to}`);
      }
    } catch (apiError: any) {
      console.error('Exchange rate API failed:', apiError.message);
      
      // Optional: Stripe FX Quotes API could be wired here when STRIPE_SECRET_KEY is set.

      return res.status(500).json({ 
        success: false, 
        error: `Unable to fetch exchange rate: ${apiError.message}` 
      });
    }
  } catch (error: any) {
    console.error('Error fetching exchange rate:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch exchange rate' 
    });
  }
}

