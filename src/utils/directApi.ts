import axios from 'axios';

// Prefer same-origin proxy (e.g. /api) to avoid 431; set NEXT_PUBLIC_DIRECT_API_URL only if needed
const directApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_DIRECT_API_URL || '/api',
  timeout: 1000000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  proxy: false,
});

export default directApi;
