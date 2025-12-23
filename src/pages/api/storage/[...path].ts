import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Storage server URL - can be configured via environment variable
// If not set, it will use the backend URL
const STORAGE_SERVER_URL = process.env.NEXT_PUBLIC_BACKEND_STORAGE_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests for image retrieval
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { path } = req.query;
  
  // Reconstruct the path from the catch-all parameter
  const targetPath = Array.isArray(path) ? path.join('/') : path || '';
  
  if (!targetPath) {
    return res.status(400).json({ error: 'Path is required' });
  }
  
  // Ensure STORAGE_SERVER_URL ends with a slash and targetPath doesn't start with one
  const baseUrl = STORAGE_SERVER_URL.endsWith('/') ? STORAGE_SERVER_URL : `${STORAGE_SERVER_URL}/`;
  const cleanPath = targetPath.startsWith('/') ? targetPath.slice(1) : targetPath;
  
  // Construct the full storage server URL
  const targetUrl = `${baseUrl}${cleanPath}`;
  console.log('Storage proxy request:', { targetUrl, targetPath, baseUrl });
  
  try {
    // Make the request to the storage server
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      responseType: 'arraybuffer', // Handle binary data (images)
      timeout: 30000, // 30 second timeout
      validateStatus: () => true, // Don't throw on HTTP error status
    });

    // Forward the response status
    res.status(response.status);
    
    // Set appropriate headers for image responses
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    
    // Set cache headers for images
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    // Forward other important headers
    const headersToForward = ['content-length', 'last-modified', 'etag'];
    headersToForward.forEach(header => {
      if (response.headers[header]) {
        res.setHeader(header, response.headers[header] as string);
      }
    });

    // Send the image data
    res.send(Buffer.from(response.data));
    
  } catch (error: any) {
    console.error('=== STORAGE PROXY ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Target URL:', targetUrl);
    console.error('==================');
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      res.status(error.response.status);
      if (error.response.data) {
        res.send(Buffer.from(error.response.data));
      } else {
        res.json({ 
          error: 'Failed to fetch image',
          status: error.response.status
        });
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received from storage server');
      res.status(503);
      res.json({ 
        error: 'Service unavailable',
        message: 'Storage server is not responding'
      });
    } else {
      // Something happened in setting up the request
      console.log('Request setup error:', error.message);
      res.status(500);
      res.json({ 
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}

// Configure the API route to disable body parsing for GET requests
export const config = {
  api: {
    bodyParser: false,
  },
};

