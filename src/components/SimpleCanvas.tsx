import React, { useRef, useEffect, useState } from 'react';
import { Offcanvas, Button, Row, Col } from 'react-bootstrap';
import '@assets/scss/offcanvas.scss';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface SimpleCanvasProps {
  show: boolean;
  onHide: () => void;
  rowData?: any;
  title?: string;
}

const SimpleCanvas: React.FC<SimpleCanvasProps> = ({
  show,
  onHide,
  rowData,
  title = ""
}) => {
  const { data:session, status } = useSession();
  
  const [currentPage, setCurrentPage] = useState<string>('');

  useEffect(() => {
    // Get current page information
    const pathname = window.location.pathname;
    const pageName = pathname.split('/').pop() || 'home';
    setCurrentPage(pageName);
  }, []);

  return (
    <Offcanvas 
      show={show} 
      onHide={onHide} 
      placement="end" 
      style={{ width: '400px' }}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>User Details</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        
        
        {rowData && (
          <Row className="mb-3">
            <Col md={12}>
              <div className="mt-2">
                {/* Conditional rendering based on page */}
                {currentPage === 'users' && (
                  <div className="canvasDisplay">
                     {rowData  && (
                      <div className="data-item">
                        
                        <div className="sbox">
                          <p className="text-muted mb-0 small">Dispaly Name</p>
                          <h5><b>{rowData.name}</b></h5>
                        </div>

                        <div className="sbox">
                          <p className="text-muted mb-0 small">Customer Email</p>
                          <h5><b>{rowData.email}</b></h5>
                        </div>

                        <div className="sbox">
                          <p className="text-muted mb-0 small">Username</p>
                          <h5><b>{rowData.username}</b></h5>
                        </div>

                        <div className="sbox">
                          <p className="text-muted mb-0 small">Phone</p>
                          <h5><b>{rowData.phone}</b></h5>
                        </div>

                        <div className="sbox">
                          <p className="text-muted mb-0 small">Role</p>
                          <h5><b>{rowData.role || 'N/A'}</b></h5>
                        </div>

                        <div className="sbox">
                          <p className="text-muted mb-0 small">Group</p>
                          <h5><b>{rowData.group || 'N/A'}</b></h5>
                        </div>

                        <div className="sbox">
                          <p className="text-muted mb-0 small">OU</p>
                          <h5><b>{rowData.ou}</b></h5>
                        </div>

                        <div className="sbox">
                          <p className="text-muted mb-0 small">Company</p>
                          <h5><b>{rowData.company?.name || 'N/A'}</b></h5>
                        </div>

                        <div className="sbox">
                          <p className="text-muted mb-0 small">Department</p>
                          <h5><b>{rowData.department?.name || 'N/A'}</b></h5>
                        </div>
                        <div className="button-group mt-3 gap-2 d-flex justify-content-end">
                        {session?.user?.permissions?.includes('edit-users')  && (
                            <Link 
                                href={`/controlhub/users/${rowData.encId}`} 
                                className="btn btn-sm btn-outline-primary">
                                Edit
                            </Link> 
                        )}
                        </div>
                      </div>
                     )}
                  </div>
                )}
                
                
              </div>
            </Col>
          </Row>
        )}
        
        
        
        
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default SimpleCanvas;
