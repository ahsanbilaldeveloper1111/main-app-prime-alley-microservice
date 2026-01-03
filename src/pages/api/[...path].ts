import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import formidable from "formidable";
import { promises as fs } from "fs";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/";

// Custom body parser function for FormData
const parseFormData = async (req: NextApiRequest) => {
  const form = formidable({
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  const [fields, files] = await form.parse(req);

  // Reconstruct FormData with proper file handling
  const formData = new FormData();

  // Add fields
  console.log("FIELDS", fields, "files", files);
  Object.entries(fields).forEach(([key, values]) => {
    if (values && Array.isArray(values) && values.length > 0) {
      values.forEach((value) => {
        formData.append(key, value);
      });
    }
  });

  // Add files with proper MIME type preservation
  for (const [key, fileArray] of Object.entries(files)) {
    if (fileArray && Array.isArray(fileArray) && fileArray.length > 0) {
      for (const file of fileArray) {
        if (file.filepath && file.mimetype) {
          //console.log(`Processing file: ${key}, MIME: ${file.mimetype}, Size: ${file.size}`);

          // Read file buffer and append with proper MIME type
          const fileBuffer = await fs.readFile(file.filepath);

          // Create a Blob with the correct MIME type
          // Convert Buffer to Uint8Array for proper Blob compatibility
          const blob = new Blob([new Uint8Array(fileBuffer)], {
            type: file.mimetype,
          });

          // Append to FormData with filename and proper MIME type
          formData.append(key, blob, file.originalFilename || "file");

          // Clean up temporary file
          await fs.unlink(file.filepath);

          //console.log(`File ${key} added with MIME type: ${file.mimetype}`);
        }
      }
    }
  }

  return formData;
};

// Custom body parser function for JSON
const parseJSON = async (req: NextApiRequest) => {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      try {
        if (data.trim()) {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } else {
          resolve({});
        }
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", (error) => {
      reject(error);
    });
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { path } = req.query;

  // Validate path parameter
  if (!path) {
    return res.status(400).json({ error: "Path parameter is required" });
  }

  // Reconstruct the path from the catch-all parameter
  const targetPath = Array.isArray(path) ? path.join("/") : path;
  const targetUrl = `${BACKEND_URL}${targetPath}`;

  // Special handling for audio downloads
  const isAudioDownload = true;

  try {
    // Prepare headers for the backend request
    const headers: Record<string, string> = {};

    // Forward authorization header if present
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // Forward other important headers
    const headersToForward = [
      "x-requested-with",
      "x-forwarded-for",
      "x-forwarded-proto",
      "user-agent",
      "referer",
      "origin",
    ];

    headersToForward.forEach((header) => {
      if (req.headers[header]) {
        headers[header] = req.headers[header] as string;
      }
    });

    // Check content type and handle accordingly
    const contentType = req.headers["content-type"] || "";
    const isFormData = contentType.includes("multipart/form-data");
    const isJSON = contentType.includes("application/json");

    let requestData: any;

    if (isFormData) {
      // For FormData requests, preserve the original Content-Type header with boundary
      headers["Content-Type"] = contentType;
      // console.log('=== FORMDATA DEBUG ===');
      // console.log('Original Content-Type:', contentType);
      // console.log('Target URL:', targetUrl);
      // console.log('Request method:', req.method);

      try {
        // Parse FormData manually since bodyParser is disabled for this route
        requestData = await parseFormData(req);
        // console.log('FormData parsed successfully');
        // console.log('FormData entries count:', Array.from(requestData.entries()).length);
      } catch (parseError) {
        // console.error('Error parsing FormData:', parseError);
        throw new Error("Failed to parse FormData");
      }

      console.log("=====================");
    } else if (isJSON) {
      // For JSON requests, parse manually
      // console.log('=== JSON DEBUG ===');
      // console.log('Content-Type:', contentType);
      // console.log('Target URL:', targetUrl);
      // console.log('Request method:', req.method);

      try {
        requestData = await parseJSON(req);
        //console.log('JSON parsed successfully:', requestData);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        throw new Error("Failed to parse JSON");
      }

      // Set JSON headers
      headers["Content-Type"] = "application/json";
      headers["Accept"] = "application/json";

      //console.log('=====================');
    } else if (isAudioDownload) {
      // Special handling for audio downloads
      headers["Accept"] = "audio/*, application/octet-stream, */*";
      headers["Content-Type"] = "application/octet-stream";
      requestData = req.body;
    } else {
      // For other content types, try to get body if available
      headers["Content-Type"] = contentType || "application/octet-stream";
      requestData = req.body || {};
    }

    // console.log('Final request data type:', typeof requestData);
    // console.log('Making request to backend:', targetUrl, req.headers['accept']);

    // Make the request to the backend
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers,
      data: requestData,
      params: req.query,
      timeout: isAudioDownload ? 600000 : 30000, // 60 second timeout for audio files, 30 for others
      validateStatus: () => true, // Don't throw on HTTP error status
      responseType: isAudioDownload
        ? "arraybuffer"
        : req.headers["accept"]?.includes("blob")
        ? "arraybuffer"
        : "json",
    });

    // console.log('Backend response status:', response.status);
    // console.log('Backend response headers:', response.headers);

    // Forward the response status
    res.status(response.status);

    // Forward response headers (excluding problematic ones)
    const headersToExclude = [
      "content-encoding",
      "transfer-encoding",
      "connection",
    ];
    Object.entries(response.headers).forEach(([key, value]) => {
      if (
        value !== undefined &&
        !headersToExclude.includes(key.toLowerCase())
      ) {
        res.setHeader(key, value);
      }
    });
    //console.log("ZEZEZE", response.data instanceof Buffer , response.data instanceof ArrayBuffer);
    // Handle different response types
    if (
      isAudioDownload ||
      response.data instanceof Buffer ||
      response.data instanceof ArrayBuffer
    ) {
      // For binary data (audio files, blobs, etc.)
      //console.log("SENDING BINARY RESPONSE", typeof response.data);
      if (response.data instanceof Buffer) {
        res.send(response.data);
      } else if (response.data instanceof ArrayBuffer) {
        res.send(Buffer.from(new Uint8Array(response.data)));
      } else {
        res.send(Buffer.from(response.data));
      }
    } else if (typeof response.data === "string") {
      // For text responses
      // console.log('Sending text response');
      res.send(response.data);
    } else {
      //console.log("SENDING JSON RESPONSE");
      // For JSON responses
      res.json(response.data);
    }
  } catch (error: any) {
    // console.error('=== PROXY ERROR ===');
    // console.error('Error type:', error.constructor.name);
    // console.error('Error message:', error.message);
    // console.error('Error code:', error.code);
    // console.error('Error response:', error.response?.data);
    // console.error('Error status:', error.response?.status);
    // console.error('==================');

    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // console.log('Backend responded with error status:', error.response.status);
      res.status(error.response.status);

      // Handle error response data
      if (error.response.data instanceof Buffer) {
        res.send(error.response.data);
      } else if (error.response.data instanceof ArrayBuffer) {
        res.send(Buffer.from(new Uint8Array(error.response.data)));
      } else if (typeof error.response.data === "string") {
        res.send(error.response.data);
      } else {
        res.json(error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      // console.log('No response received from backend');
      res.status(503);
      res.json({
        error: "Service unavailable",
        message: "Backend server is not responding",
        details: error.message,
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      // console.log('Request setup error:', error.message);
      res.status(500);
      res.json({
        error: "Internal server error",
        message: error.message,
        details: "Failed to make request to backend",
      });
    }
  }
}

// Configure the API route to handle all HTTP methods
// We need to disable bodyParser for FormData requests to work properly
export const config = {
  api: {
    bodyParser: false,
  },
};
