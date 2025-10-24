import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import formidable from 'formidable';
import { promises as fs } from 'fs';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;
  
  // Reconstruct the path from the catch-all parameter
  const targetPath = Array.isArray(path) ? path.join('/') : path || '';
  
  // Construct the full backend URL
  const targetUrl = `${BACKEND_URL}${targetPath}`;
  
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
    
    let requestData: any = req.body;
    
    if (isFormData) {
      // For FormData requests, preserve the original Content-Type header with boundary
      headers['Content-Type'] = req.headers['content-type'] as string;
      console.log('=== PROXY FORMDATA DEBUG ===');
      console.log('Original Content-Type:', req.headers['content-type']);
      console.log('Preserved Content-Type:', headers['Content-Type']);
      console.log('Request body type:', typeof req.body);
      
      // Parse FormData manually to preserve file information
      const form = formidable({});
      const [fields, files] = await form.parse(req);
      
      // Reconstruct FormData with proper file handling
      const formData = new FormData();
      
      // Add fields
      Object.entries(fields).forEach(([key, values]) => {
        if (values && Array.isArray(values) && values.length > 0) {
          formData.append(key, values[0]);
        }
      });
      
      // Add files with proper MIME type preservation
      for (const [key, fileArray] of Object.entries(files)) {
        if (fileArray && Array.isArray(fileArray) && fileArray.length > 0) {
          const file = fileArray[0];
          if (file.filepath && file.mimetype) {
            // Read file buffer and append with proper MIME type
            const fileBuffer = await fs.readFile(file.filepath);
            // Convert Buffer to Uint8Array for proper Blob compatibility
            const blob = new Blob([new Uint8Array(fileBuffer)], { type: file.mimetype });
            formData.append(key, blob, file.originalFilename || 'file');
            
            // Clean up temporary file
            await fs.unlink(file.filepath);
          }
        }
      }
      
      requestData = formData;
      console.log('FormData reconstructed with proper MIME types');
      console.log('==========================');
    } else {
      // For regular JSON requests, set default headers
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
      
      // For non-FormData requests, the bodyParser should have already parsed the JSON
      // If it's a string, try to parse it as JSON
      if (typeof requestData === 'string' && requestData.trim()) {
        try {
          requestData = JSON.parse(requestData);
        } catch (e) {
          // If parsing fails, keep it as is
          console.log('Failed to parse request body as JSON, keeping as string');
        }
      }
    }

    console.log('Proxy request data:', requestData);
    console.log('Proxy request data type:', typeof requestData);

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
    if (response.data instanceof Buffer) {
      // For Buffer data
      res.send(response.data);
    } else if (response.data instanceof ArrayBuffer) {
      // For ArrayBuffer data
      res.send(Buffer.from(new Uint8Array(response.data)));
    } else if (typeof response.data === 'string') {
      // For text responses
      res.send(response.data);
    } else {
      // For JSON responses
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
      if (error.response.data instanceof Buffer) {
        res.send(error.response.data);
      } else if (error.response.data instanceof ArrayBuffer) {
        res.send(Buffer.from(new Uint8Array(error.response.data)));
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