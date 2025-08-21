import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;
  
  // Validate path parameter
  if (!path) {
    console.error('No path provided in request');
    return res.status(400).json({ error: 'No path provided' });
  }
  
  // Reconstruct the path from the catch-all parameter
  const targetPath = Array.isArray(path) ? path.join('/') : path || '';
  
  // Validate backend URL
  if (!BACKEND_URL) {
    console.error('BACKEND_URL not configured');
    return res.status(500).json({ error: 'Backend URL not configured' });
  }
  
  // Construct the full backend URL
  const targetUrl = `${BACKEND_URL}${targetPath}`;
  
  // Debug logging for audio downloads
  if (targetPath.includes('recordings/download')) {
    // console.log('=== AUDIO DOWNLOAD DEBUG ===');
    // console.log('Request method:', req.method);
    // console.log('Request path:', path);
    // console.log('Target path:', targetPath);
    // console.log('Backend URL:', BACKEND_URL);
    // console.log('Full target URL:', targetUrl);
    // console.log('Request headers:', req.headers);
    // console.log('Authorization header present:', !!req.headers.authorization);
    // console.log('==================');
  }
  
  try {
    // Prepare headers for the backend request
    const headers: Record<string, string> = {
      // 'Content-Type': 'application/json',
      // 'Accept': 'application/json',
    };

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
      'origin',
      'Content-Type',
      'Accept',
      'content-type',
      'accept'
    ];

    headersToForward.forEach(header => {
      if (req.headers[header]) {
        headers[header] = req.headers[header] as string;
      }
    });

    // Special handling for audio downloads
    const isAudioDownload = targetPath.includes('recordings/download');
    if (isAudioDownload) {
      headers['Accept'] = 'audio/*, application/octet-stream, */*';
      headers['Content-Type'] = 'application/octet-stream';
    }

    //console.log('Making request to backend with headers:', headers);

    // Make the request to the backend
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers,
      data: req.body,
      params: req.query,
      timeout: 60000, // 60 second timeout for audio files
      validateStatus: () => true, // Don't throw on HTTP error status
      responseType: isAudioDownload ? 'arraybuffer' : (req.headers['accept']?.includes('blob') ? 'arraybuffer' : 'json'),
    });

    //console.log('Backend response status:', response.status);
    //console.log('Backend response headers:', response.headers);
    //console.log('Response type:', typeof response.data);

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
    if (isAudioDownload || response.data instanceof Buffer || response.data instanceof ArrayBuffer) {
      // For binary data (audio files, blobs, etc.)
      console.log('Sending binary response for audio download');
      res.send(Buffer.from(response.data));
    } else if (typeof response.data === 'string') {
      // For text responses
      console.log('Sending text response');
      res.send(response.data);
    } else {
      // For JSON responses
      //console.log('Sending JSON response');
      res.json(response.data);
    }
    
  } catch (error: any) {
    console.error('=== PROXY ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('==================');
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log('Backend responded with error status:', error.response.status);
      res.status(error.response.status);
      
      // Handle error response data
      if (error.response.data instanceof Buffer || error.response.data instanceof ArrayBuffer) {
        res.send(Buffer.from(error.response.data));
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