import React, { useEffect, useState, useCallback } from 'react';
import { Offcanvas, Button } from 'react-bootstrap';
import '@assets/scss/offcanvas.scss';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import moment from 'moment';
import { formatDateTimeToLocal, GlobalDateTimeFormat } from '@utils/Helper';
import ResetPasswordModal from './ResetPasswordModal';
import { buildUserEditPath } from '@utils/controlhub/usersNavigation';

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
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState<string>('');

  useEffect(() => {
    // Get current page information
    if (typeof globalThis !== 'undefined' && globalThis.window) {
      const pathname = globalThis.window.location.pathname;
      // Handle both '/controlhub/users' and '/controlhub/users/' cases
      const pathParts = pathname.split('/').filter(Boolean);
      const pageName = pathParts.at(-1) || 'home';
      // Also check if pathname includes 'users' for more robust detection
      const isUsersPage = pathname.includes('/users') || pageName === 'users';
      setCurrentPage(isUsersPage ? 'users' : pageName);
    }
  }, []);

  const handleDisableUser = (encId: string) => {
    console.log(encId);
  }

  const handleResetPassword = useCallback((username: string) => {
    setSelectedUsername(username);
    setShowResetPasswordModal(true);
  }, []);

  const handleCloseResetPasswordModal = useCallback(() => {
    setShowResetPasswordModal(false);
    setSelectedUsername('');
  }, []);

  return (
    <Offcanvas 
      show={show} 
      onHide={onHide} 
      placement="end" 
      className="user-directory-preview-canvas"
      style={{ width: '300px' }}
    >
      <Offcanvas.Header closeButton className="user-directory-preview-canvas__header py-2 px-3">
        <Offcanvas.Title className="fs-6 mb-0">User Details</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="user-directory-preview-canvas__body p-3">
        {!rowData && (
          <div className="text-center py-3">
            <p className="text-muted mb-0 small">No data available</p>
          </div>
        )}
        {rowData && (
              <div className="user-directory-preview-canvas__content">
                {/* Conditional rendering based on page */}
                {(currentPage === 'main-settings/users-teams/user-directory' || (typeof globalThis !== 'undefined' && globalThis.window?.location.pathname.includes('/main-settings/users-teams/user-directory'))) ? (
                  <div className="canvasDisplay">
                     {rowData && (
                      <div className="data-item">

                        <div className="sbox">
                          <div className="uAvatar">
                            <div className="iBox">
                              {rowData?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="dContent">
                              <h5 className="dName">{rowData?.name || 'N/A'}</h5>
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
                          <h5><b style={{textTransform: 'none'}}>{rowData?.username || 'N/A'}</b></h5>
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

                        {/* <div className="sbox">
                          <p className="text-muted mb-0 small">Last Login</p>
                          <h5><b>{rowData.last_login_at ? formatDateTimeToLocal(rowData.last_login_at, GlobalDateTimeFormat) : 'N/A'}</b></h5>
                        </div> */}



                        <div className="button-group mt-2 d-flex flex-column gap-2">
                        {session?.user?.permissions?.includes('edit-users')  && (
                            <Link 
                                href={buildUserEditPath(rowData.encId)} 
                                className="btn btn-sm btn-outline-primary w-100">
                                Edit
                            </Link> 
                        )}
                        
                        {session?.user?.permissions?.includes('reset-password-users')  && rowData?.username && (
                        <Button size="sm" variant="primary" className="w-100" onClick={() => handleResetPassword(rowData.username)}>Reset Password</Button>  
                        )}

                        {/* {session?.user?.permissions?.includes('disable-user-users')  && (
                            <Button size="sm" variant="danger" className="w-100" onClick={() => handleDisableUser(rowData.encId)}>Disable User</Button>
                        )} */}


                        </div>


                        {/* <div className="userActvityHistory">
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
                        </div> */}





                      </div>
                     )}
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-muted small">Page: {currentPage}</p>
                    <p className="text-muted small">Pathname: {typeof globalThis !== 'undefined' && globalThis.window ? globalThis.window.location.pathname : 'N/A'}</p>
                    <p className="text-muted small">RowData available: {rowData ? 'Yes' : 'No'}</p>
                  </div>
                )}
                
                
              </div>
        )}
        
        
        
        
      </Offcanvas.Body>
      
      <ResetPasswordModal
        show={showResetPasswordModal}
        onHide={handleCloseResetPasswordModal}
        username={selectedUsername}
      />
    </Offcanvas>
  );
};

export default SimpleCanvas;
