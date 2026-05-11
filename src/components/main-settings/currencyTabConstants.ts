import type { Currency } from './currencyTabTypes'

export const INITIAL_CURRENCIES: Currency[] = [
  {
    id: 1,
    name: 'United Arab Emirates Dirham (AED) د.إ',
    exchangeRate: null,
    format: 'AED 123,456.78',
    lastUpdatedDate: '26/02/2026',
    lastUpdatedSource: 'CRM UI',
    updatedBy: 'Rizwan Haider',
    isCompanyCurrency: true,
  },
  {
    id: 2,
    name: 'US Dollar (USD) $',
    exchangeRate: '3.6725',
    format: 'US$123,456.78',
    lastUpdatedDate: '03/03/2026',
    lastUpdatedSource: 'Exchange Rate Updates',
    isCompanyCurrency: false,
  },
]

export const AVAILABLE_CURRENCY_DEFS = [
  { code: 'EUR', name: 'Euro (EUR) €', format: '€123,456.78' },
  { code: 'GBP', name: 'British Pound (GBP) £', format: '£123,456.78' },
  { code: 'PKR', name: 'Pakistani Rupee (PKR) ₨', format: '₨123,456.78' },
  { code: 'SAR', name: 'Saudi Riyal (SAR) ر.س', format: 'SAR 123,456.78' },
  { code: 'INR', name: 'Indian Rupee (INR) ₹', format: '₹123,456.78' },
  { code: 'CAD', name: 'Canadian Dollar (CAD) $', format: 'CA$123,456.78' },
  { code: 'AUD', name: 'Australian Dollar (AUD) $', format: 'A$123,456.78' },
] as const
