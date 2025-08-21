import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;
  
  // Reconstruct the path from the catch-all parameter
  const targetPath = Array.isArray(path) ? path.join('/') : path || '';
  
  // Construct the full backend URL
  const targetUrl = `${BACKEND_URL}${targetPath}`;
  
  // Debug logging
//   console.log('=== PROXY DEBUG ===');
//   console.log('Request method:', req.method);
//   console.log('Request path:', path);
//   console.log('Target path:', targetPath);
//   console.log('Backend URL:', BACKEND_URL);
//   console.log('Full target URL:', targetUrl);
//   console.log('Request headers:', req.headers);
//   console.log('Request body:', req.body);
//   console.log('==================');
  
  try {
    // Prepare headers for the backend request
    const headers: Record<string, string> = {};

    // Forward authorization header if present
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // Forward other important headers
    const headersToForward = [
      'x-requested-with',
      'x-forwarded-for',
      'x-forwarded-proto',
      'user-agent',
      'referer',
      'origin'
    ];

    headersToForward.forEach(header => {
      if (req.headers[header]) {
        headers[header] = req.headers[header] as string;
      }
    });

    // Special handling for FormData (file uploads) - preserve original Content-Type
    const isFormData = req.headers['content-type']?.includes('multipart/form-data');
    
    if (isFormData) {
      // For FormData requests, preserve the original Content-Type header with boundary
      headers['Content-Type'] = req.headers['content-type'] as string;
      console.log('=== PROXY FORMDATA DEBUG ===');
      console.log('Original Content-Type:', req.headers['content-type']);
      console.log('Preserved Content-Type:', headers['Content-Type']);
      console.log('Request body type:', typeof req.body);
      console.log('==========================');
    } else {
      // For regular JSON requests, set default headers
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    }

    // Use the parsed body from bodyParser (this will work for both JSON and FormData)
    const requestData = req.body;
    console.log('Proxy request data:', requestData);
    console.log('Proxy request data type:', typeof requestData);

    //console.log('Making request to backend with headers:', headers);

    // Make the request to the backend
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers,
      data: requestData,
      params: req.query,
      timeout: 30000, // 30 second timeout
      validateStatus: () => true, // Don't throw on HTTP error status
      responseType: req.headers['accept']?.includes('blob') ? 'blob' : 'json',
    });

//     console.log('Backend response status:', response.status);
//     console.log('Backend response headers:', response.headers);
//     console.log('Response type:', typeof response.data);

    // Forward the response status
    res.status(response.status);
    
    // Forward response headers (excluding problematic ones)
    const headersToExclude = ['content-encoding', 'transfer-encoding', 'connection'];
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value !== undefined && !headersToExclude.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    // Handle different response types
    if (response.data instanceof Buffer || response.data instanceof Blob) {
      // For binary data (blobs, files, etc.)
      //console.log('Sending binary response');
      res.send(response.data);
    } else if (typeof response.data === 'string') {
      // For text responses
      //console.log('Sending text response');
      res.send(response.data);
    } else {
      // For JSON responses
      //console.log('Sending JSON response');
      res.json(response.data);
    }
    
  } catch (error: any) {
//     console.error('=== PROXY ERROR ===');
//     console.error('Error type:', error.constructor.name);
//     console.error('Error message:', error.message);
//     console.error('Error code:', error.code);
//     console.error('Error response:', error.response?.data);
//     console.error('Error status:', error.response?.status);
//     console.error('==================');
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log('Backend responded with error status:', error.response.status);
      res.status(error.response.status);
      
      // Handle error response data
      if (error.response.data instanceof Buffer || error.response.data instanceof Blob) {
        res.send(error.response.data);
      } else if (typeof error.response.data === 'string') {
        res.send(error.response.data);
      } else {
        res.json(error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received from backend');
      res.status(503);
      res.json({ 
        error: 'Service unavailable',
        message: 'Backend server is not responding',
        details: error.message
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Request setup error:', error.message);
      res.status(500);
      res.json({ 
        error: 'Internal server error',
        message: error.message,
        details: 'Failed to make request to backend'
      });
    }
  }
}

// Configure the API route to handle all HTTP methods
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}; 