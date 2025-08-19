import axios from 'axios';

// Create a proxy axios instance that routes through Next.js API routes
const proxyAxios = axios.create({
  baseURL: '/api', // This will route through our proxy API route (removed "proxy" word)
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Helper function to make proxied requests
export const proxyRequest = {
  get: (url: string, config?: any) => proxyAxios.get(url, config),
  post: (url: string, data?: any, config?: any) => proxyAxios.post(url, data, config),
  put: (url: string, data?: any, config?: any) => proxyAxios.put(url, data, config),
  patch: (url: string, data?: any, config?: any) => proxyAxios.patch(url, data, config),
  delete: (url: string, config?: any) => proxyAxios.delete(url, config),
};

// Export the proxy axios instance for direct use
export default proxyAxios;

// Helper function to get the full proxy URL for a backend endpoint
export const getProxyUrl = (endpoint: string) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `/api/${cleanEndpoint}`;
}; 