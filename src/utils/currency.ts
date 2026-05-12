/**
 * Currency conversion utilities using Stripe exchange rates
 */

import { backendUrl } from "./backendUrl";

interface ExchangeRateCache {
  [key: string]: {
    rate: number;
    timestamp: number;
  };
}

// Cache exchange rates for 1 hour (3600000 ms)
const CACHE_DURATION = 3600000;
const rateCache: ExchangeRateCache = {};

/**
 * Get exchange rate from one currency to another
 * @param fromCurrency Source currency code (e.g., 'USD')
 * @param toCurrency Target currency code (e.g., 'PKR')
 * @returns Exchange rate (number)
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  // Normalize currency codes
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  // If same currency, return 1
  if (from === to) {
    return 1;
  }

  // Check cache first
  const cacheKey = `${from}_${to}`;
  const cached = rateCache[cacheKey];
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rate;
  }

  try {
    // Fetch exchange rate from API
    const response = await fetch(
      backendUrl(`/api/stripe/exchange-rate?from=${from}&to=${to}`),
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.rate) {
      throw new Error(data.error || 'Failed to get exchange rate');
    }

    // Cache the rate
    rateCache[cacheKey] = {
      rate: data.rate,
      timestamp: Date.now(),
    };

    return data.rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Return 1 as fallback to avoid breaking the UI
    // In production, you might want to show an error message
    return 1;
  }
}

/**
 * Convert price from one currency to another
 * @param amount Amount in source currency
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Converted amount rounded to 2 decimal places
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return parseFloat(amount.toFixed(2));
  }

  const rate = await getExchangeRate(fromCurrency, toCurrency);
  const converted = amount * rate;
  
  // Round to 2 decimal places
  return parseFloat(converted.toFixed(2));
}

/**
 * Format currency amount with currency symbol
 * @param amount Amount to format
 * @param currency Currency code
 * @returns Formatted string (e.g., "1,234.56 USD")
 */
export function formatCurrency(amount: number, currency: string): string {
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency.toUpperCase()}`;
}

