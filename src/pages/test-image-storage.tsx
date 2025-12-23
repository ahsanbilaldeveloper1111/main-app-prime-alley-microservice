import React, { useState } from 'react';
import { Card, Row, Col, Alert } from 'react-bootstrap';
import { getStorageImageUrl } from '@utils/imageUtils';

const TestImageStorage = () => {
  const imagePath = 'profiles/profile_2936_1765831932.jpg';
  const transformedUrl = getStorageImageUrl(imagePath);

  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Image Storage Test Page</h1>
      
      <Alert variant="info" className="mt-3 mb-4">
        <strong>Test Image:</strong> This page tests the image storage proxy route.
        <br />
        <strong>Original Path:</strong> <code>{imagePath}</code>
        <br />
        <strong>Transformed URL:</strong> <code>{transformedUrl || 'null'}</code>
      </Alert>

      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Image Display</h5>
            </Card.Header>
            <Card.Body className="text-center">
              {!imageLoaded && !imageError && (
                <div className="text-muted mb-3">Loading image...</div>
              )}
              
              {imageError && (
                <Alert variant="danger" className="mb-3">
                  Failed to load image. Check the console for errors.
                </Alert>
              )}

              {transformedUrl && (
                <div>
                  <img
                    src={transformedUrl}
                    alt="Test Profile"
                    className="img-fluid rounded"
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '500px',
                      objectFit: 'cover',
                      border: '2px solid #dee2e6',
                      padding: '10px'
                    }}
                    onLoad={() => {
                      setImageLoaded(true);
                      setImageError(false);
                    }}
                    onError={() => {
                      setImageError(true);
                      setImageLoaded(false);
                    }}
                  />
                  
                  {imageLoaded && (
                    <Alert variant="success" className="mt-3">
                      ✅ Image loaded successfully!
                    </Alert>
                  )}
                </div>
              )}

              {!transformedUrl && (
                <Alert variant="warning">
                  Image URL transformation returned null
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Image Information</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>Original Image Path:</strong>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '10px', 
                  borderRadius: '4px',
                  marginTop: '5px'
                }}>
                  {imagePath}
                </pre>
              </div>

              <div className="mb-3">
                <strong>Transformed URL:</strong>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '10px', 
                  borderRadius: '4px',
                  marginTop: '5px'
                }}>
                  {transformedUrl || 'null'}
                </pre>
              </div>

              <div className="mb-3">
                <strong>API Route:</strong>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '10px', 
                  borderRadius: '4px',
                  marginTop: '5px'
                }}>
                  /api/storage/{imagePath}
                </pre>
              </div>

              <div className="mb-3">
                <strong>Status:</strong>
                <div className="mt-2">
                  {imageLoaded && (
                    <span className="badge bg-success">Image Loaded</span>
                  )}
                  {imageError && (
                    <span className="badge bg-danger">Load Failed</span>
                  )}
                  {!imageLoaded && !imageError && transformedUrl && (
                    <span className="badge bg-warning">Loading...</span>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mt-4">
        <Card.Header>
          <h5>How It Works</h5>
        </Card.Header>
        <Card.Body>
          <ol>
            <li>The image path <code>{imagePath}</code> is passed to <code>getStorageImageUrl()</code></li>
            <li>The utility function transforms it to <code>{transformedUrl}</code></li>
            <li>The browser requests the image from <code>/api/storage/profiles/profile_2936_1765831932.jpg</code></li>
            <li>The API route at <code>/api/storage/[...path].ts</code> proxies the request to the storage server</li>
            <li>The storage server (configured via <code>NEXT_PUBLIC_BACKEND_URL</code>) serves the image</li>
            <li>The image is displayed in the browser</li>
          </ol>
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Header>
          <h5>Test Instructions</h5>
        </Card.Header>
        <Card.Body>
          <ul>
            <li>Check that the image displays correctly</li>
            <li>Open browser DevTools → Network tab to see the request to <code>/api/storage/...</code></li>
            <li>Verify the API route is proxying to the correct storage server</li>
            <li>Check the console for any errors</li>
            <li>Ensure <code>NEXT_PUBLIC_BACKEND_URL</code> is configured correctly</li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TestImageStorage;

