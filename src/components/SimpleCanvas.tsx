import React, { useRef, useEffect, useState } from 'react';
import { Offcanvas, Button, Row, Col } from 'react-bootstrap';
import '@assets/scss/offcanvas.scss';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import moment from 'moment';
import { formatDateTimeToLocal, GlobalDateTimeFormat } from '@utils/Helper';

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

  const handleDisableUser = (encId: string) => {
    console.log(encId);
  }

  const handleResetPassword = (encId: string) => {
    console.log(encId);
  }

  return (
    <Offcanvas 
      show={show} 
      onHide={onHide} 
      placement="end" 
      style={{ width: '300px' }}
    >
      {/* <Offcanvas.Header closeButton>
        <Offcanvas.Title>User Details</Offcanvas.Title>
      </Offcanvas.Header> */}
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
                          <div className="uAvatar">
                            <div className="iBox">
                              {rowData?.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="dContent">
                              <h5 className="dName">{rowData?.name}</h5>
                              <p className="dRole badge bg-primary small">{rowData?.role || ''}</p>
                            </div>
                          </div>
                          
                        </div>
                        
                        {/* <div className="sbox">
                          <p className="text-muted mb-0 small">Dispaly Name</p>
                          <h5><b>{rowData.name}</b></h5>
                        </div> */}

                        <div className="sbox">
                          <p className="text-muted mb-0 small">User Name</p>
                          <h5><b style={{textTransform: 'none'}}>{rowData.username}</b></h5>
                        </div>

                        {/* <div className="sbox">
                          <p className="text-muted mb-0 small">Username</p>
                          <h5><b>{rowData.username}</b></h5>
                        </div> */}

                        <div className="sbox">
                          <p className="text-muted mb-0 small">Extension</p>
                          <h5><b>{rowData.phone}</b></h5>
                        </div>

                        {/* <div className="sbox">
                          <p className="text-muted mb-0 small">Role</p>
                          <h5><b>{rowData.role || 'N/A'}</b></h5>
                        </div> */}

                        {/* <div className="sbox">
                          <p className="text-muted mb-0 small">Group</p>
                          <h5><b>{rowData.group || 'N/A'}</b></h5>
                        </div> */}

                        {/* <div className="sbox">
                          <p className="text-muted mb-0 small">OU</p>
                          <h5><b>{rowData.ou}</b></h5>
                        </div> */}

                        <div className="sbox">
                          <p className="text-muted mb-0 small">Company</p>
                          <h5><b>{rowData.company?.name || 'N/A'}</b></h5>
                        </div>

                        <div className="sbox">
                          <p className="text-muted mb-0 small">Department</p>
                          <h5><b>{rowData.department?.name || 'N/A'}</b></h5>
                        </div>

                        <div className="sbox">
                          <p className="text-muted mb-0 small">Last Login</p>
                          <h5><b>{rowData.last_login_at ? formatDateTimeToLocal(rowData.last_login_at, GlobalDateTimeFormat) : 'N/A'}</b></h5>
                        </div>



                        <div className="button-group mt-3 d-flex flex-column gap-2">
                        {session?.user?.permissions?.includes('edit-users')  && (
                            <Link 
                                href={`/controlhub/users/${rowData.encId}`} 
                                className="btn btn-sm btn-outline-primary w-100">
                                Edit
                            </Link> 
                        )}
                        
                        {session?.user?.permissions?.includes('reset-password-users')  && (
                        <Button size="sm" variant="primary" className="w-100" onClick={() => handleResetPassword(rowData.encId)}>Reset Password</Button>  
                        )}

                        {session?.user?.permissions?.includes('disable-user-users')  && (
                            <Button size="sm" variant="danger" className="w-100" onClick={() => handleDisableUser(rowData.encId)}>Disable User</Button>
                        )}


                        </div>


                        <div className="userActvityHistory">
                          <h5>User Activity History</h5>
                          
                          <div className="timeline">
                            <div className="timeline-item">
                              <div className="timeline-number">1</div>
                              <div className="timeline-content">
                                <div className="activity-title">Login Activity</div>
                                <div className="activity-time">2 hours ago</div>
                                <div className="activity-details">User logged in from Chrome browser</div>
                              </div>
                            </div>
                            
                            <div className="timeline-item">
                              <div className="timeline-number">2</div>
                              <div className="timeline-content">
                                <div className="activity-title">Report Generated</div>
                                <div className="activity-time">6 hours ago</div>
                                <div className="activity-details">Call statistics report exported</div>
                              </div>
                            </div>
                            
                            <div className="timeline-item">
                              <div className="timeline-number">3</div>
                              <div className="timeline-content">
                                <div className="activity-title">Role Updated</div>
                                <div className="activity-time">1 day ago</div>
                                <div className="activity-details">Role changed</div>
                              </div>
                            </div>
                          </div>
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
