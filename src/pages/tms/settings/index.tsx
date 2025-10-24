import React, { ReactElement, useState, useCallback, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Button, Card, Row, Form, Alert, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { FaQrcode } from "react-icons/fa";

import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { User, UserSettingUpdate } from "@models/tms/User";
import { loadTmsSession, getTmsSessionId, isTmsSessionValid, getTmsUser } from "@utils/tmsSessionHelper";
import axiosInstance from "@utils/axios";

// Constants
const QR_CODE_SIZE = 200;
const QR_CODE_API_URL = 'https://api.qrserver.com/v1/create-qr-code';

// Types
interface QRCodeState {
  showQRCode: boolean;
  qrCodeUrl: string;
  secretKey: string;
  isResending: boolean;
}

interface UserSettingsState {
  enable_email_notification: boolean;
  enable_sms_notification: boolean;
  enable_google_authentication: boolean;
}

const TmsSettings = () => {
  const { data: session } = useSession();
  
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [tmsSession, setTmsSession] = useState<any | null>(null);
  const [userSetting, setUserSetting] = useState<UserSettingsState>({
    enable_email_notification: false,
    enable_sms_notification: false,
    enable_google_authentication: false
  });
  
  const [qrCodeState, setQrCodeState] = useState<QRCodeState>({
    showQRCode: false,
    qrCodeUrl: '',
    secretKey: '',
    isResending: false
  });
  
  const [hasInitialized2FA, setHasInitialized2FA] = useState(false);


  // Memoized functions
  const updateUserSetting = useCallback(async (data: Partial<UserSettingsState>) => {
    try {
      const updatedSettings = { ...userSetting, ...data, user_id: tmsSession?.user?.id as number };
      console.log("updatedSettings", updatedSettings);
      const response = await axiosInstance.post('tms/updateUserSettings', updatedSettings);
      
      if (response.status === 200 && response.data.success) {
        setUserSetting(updatedSettings);
        toast.success('Settings updated successfully');
      } else {
        toast.error(response.data.message || 'Failed to update settings');
      }
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings. Please try again.');
    }
  }, [userSetting, user]);

  // Initialize user data
  useEffect(() => {
    const initializeUser = async () => {
      // Load TMS session using helper function
      const tmsSessionData = await loadTmsSession();
      
      if (tmsSessionData && isTmsSessionValid(tmsSessionData)) {
        const user = getTmsUser(tmsSessionData);
        //console.log('TMS user data from session:', user);
        // You can use the TMS session user data here
        setTmsSession(tmsSessionData);
        getUserDetails(user);
      }
    };
    initializeUser();
  }, []);

  const getUserDetails = useCallback(async (userData?: User) => {
    try {
      const response = await axiosInstance.get('tms/getTmsUsers',{params: {auth:true}});
      
      const fetchedUserData = response.data?.data?.data?.user as User;
      if (fetchedUserData) {
        setUser(fetchedUserData);
      }
      //console.log("response getUserDetails", response?.data?.data?.data);
      //console.log("response getUserDetails", fetchedUserData);
      
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  }, [user]);



useEffect(() => {
  if (user?.id) {
    generateInitial2FA();
    setHasInitialized2FA(true);
  }
}, [user]);

  const generateInitial2FA = useCallback(async () => {
    //console.log("generateInitial2FA", user);
    // if (!tmsSession.isValid() || !user?.id) {
    //   console.log('TMS session is not valid or user not available, skipping 2FA generation');
    //   return;
    // }

    try {
     // console.log("generateInitial2FA", user);
      const response = await axiosInstance.post('tms/enableGoogle2Fa', {
        user_id: user?.id as number
      });
      
      if (response.status === 200 && response.data) {
        const data = response.data.data;
       // console.log("data generateInitial2FA", data);
        
        // Update user settings
        if (data?.user?.settings) {
          setUserSetting(data.user.settings as UserSettingsState);
          console.log("userSetting", userSetting);
        }
        
        console.log("data.qr_code_url", data.qr_code_url);
        // Handle QR code
        if (data.qr_code_url) {
          const qrCodeImageUrl = `${QR_CODE_API_URL}/?size=${QR_CODE_SIZE}x${QR_CODE_SIZE}&data=${encodeURIComponent(data.qr_code_url)}`;
          console.log("qrCodeImageUrl", qrCodeImageUrl);
          
          setQrCodeState(prev => ({
            ...prev,
            qrCodeUrl: qrCodeImageUrl,
            secretKey: data.secret || '',
            showQRCode: true
          }));
          console.log("qrCodeState", qrCodeState);
        }
      }
    } catch (error: any) {
      console.error('Failed to generate 2FA:', error);
      //toast.error('Failed to generate 2FA setup. Please try again.');
    }
  }, [user]);

  const handleResendCode = useCallback(async () => {
    if (!user?.id) return;

    setQrCodeState(prev => ({ ...prev, isResending: true }));
    
    try {
      const response = await axiosInstance.post('tms/generateGoogle2FaSecret', {
        user_id: user.id
      });
      
      if (response.status === 200 && response.data?.data?.qr_code_url) {
        const data = response.data.data;
        const qrCodeImageUrl = `${QR_CODE_API_URL}/?size=${QR_CODE_SIZE}x${QR_CODE_SIZE}&data=${encodeURIComponent(data.qr_code_url)}`;
        
        setQrCodeState(prev => ({
          ...prev,
          qrCodeUrl: qrCodeImageUrl,
          secretKey: data.secret || '',
          showQRCode: true,
          isResending: false
        }));
        
        toast.success('New QR code generated successfully');
      }
    } catch (error: any) {
      console.error('Failed to resend code:', error);
      toast.error('Failed to generate new QR code. Please try again.');
      setQrCodeState(prev => ({ ...prev, isResending: false }));
    }
  }, [user]);

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Settings"
        mainLink="/tms/settings"
        subTitle="Settings"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title d-flex align-items-center justify-content-between">
            <h2 className="mb-0">
              Settings
            </h2>
            
          </div>
        </Col>
      </Row>

      <Row className="mt-4">
                <Col sm={12} className="col-sm-12">
                    <Card>
                        <div className="card-header">
                            <h5>User Settings</h5>
                        </div>
                        <Card.Body>
                            <Row className="mb-3">
                                <label className="col-form-label col-sm-3 text-sm-end">
                                    Enable SMS
                                </label>
                                <Col lg={6} sm={7}>
                                    <Form.Check
                                        type="switch"
                                        id="ssms-switch"
                                        checked={userSetting?.enable_sms_notification}
                                        onChange={(e) =>
                                            updateUserSetting({
                                                enable_sms_notification: e.target.checked,
                                            })
                                        }
                                        label="Enable SMS integration for enhanced security"
                                    />
                                    {userSetting?.enable_sms_notification && (   
                                        <Alert variant="info" className="mt-2">
                                            <i className="ti ti-info-circle me-2"></i>
                                            SMS integration has been enabled.
                                            Your account will now use enhanced
                                            security protocols.
                                        </Alert>
                                    )}
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <label className="col-form-label col-sm-3 text-sm-end">
                                    Enable Google Authenticator
                                </label>
                                <Col lg={6} sm={7}>
                                    <Form.Check
                                        type="switch"
                                        id="google-auth-switch"
                                        checked={userSetting?.enable_google_authentication}
                                        onChange={(e) =>
                                            updateUserSetting({
                                                enable_google_authentication: e.target.checked,
                                            })
                                        }
                                        label="Enable two-factor authentication with Google Authenticator"
                                    />
                                    {userSetting?.enable_google_authentication && (
                                        <Alert
                                            variant="success"
                                            className="mt-2"
                                        >
                                            <i className="ti ti-shield-check me-2"></i>
                                            Google Authenticator has been
                                            enabled. Scan the QR code below to
                                            set up your authenticator app.
                                        </Alert>
                                    )}
                                </Col>
                            </Row>

                          

                         
                            {userSetting?.enable_google_authentication  && (
                                <Row className="mb-3">
                                    <Col lg={6} sm={7} className="offset-sm-3">
                                    <Card className="border-primary">
                                          <Card.Header className="bg-primary text-white">
                                          <h6 className="mb-0">
                                                <i className="ti ti-shield-check me-2"></i>
                                                Two-Factor Authentication
                                          </h6>
                                          </Card.Header>
                                          <Card.Body>
                                          <Alert variant="info" className="mb-3">
                                                <i className="ti ti-info-circle me-2"></i>
                                                <strong>Step 1:</strong> Open Google Authenticator app on
                                                your mobile device
                                          </Alert>

                                          <Row>
                                                <Col>
                                                      <div className="step-indicator">
                                                      
                                                      <div className="step-text">Scan QR Code</div>
                                                      </div>

                                                      <div className="text-center mb-4">
                                                      <p className="text-muted mb-3">
                                                            Use Google Authenticator, Authy, or similar app
                                                            to scan this QR code
                                                      </p>

                                                      {qrCodeState.showQRCode && qrCodeState.qrCodeUrl && (
                                                            <div className="qr-code-container">
                                                                  <img
                                                                  src={qrCodeState.qrCodeUrl}
                                                                  alt="QR Code for 2FA Setup"
                                                                  className="qr-code-image"
                                                                  style={{ 
                                                                    maxWidth: '200px', 
                                                                    height: 'auto',
                                                                    border: '1px solid #ddd',
                                                                    borderRadius: '8px',
                                                                    padding: '10px',
                                                                    backgroundColor: 'white'
                                                                  }}
                                                                  onError={(e) => {
                                                                        console.error("Failed to load QR code image");
                                                                        (e.target as HTMLImageElement).style.display = "none";
                                                                  }}
                                                                  />
                                                                  <div className="mt-3">
                                                                        <small className="text-muted">
                                                                              Scan this QR code with your authenticator app
                                                                        </small>
                                                                  </div>
                                                            </div>
                                                      )}

                                                      {qrCodeState.showQRCode && !qrCodeState.qrCodeUrl && (
                                                            <div className="alert alert-warning">
                                                                  <strong>QR Code not available.</strong>{" "}
                                                                  Please use the secret key below to manually
                                                                  set up your authenticator app.
                                                            </div>
                                                      )}

                                                      {!qrCodeState.showQRCode && (
                                                            <div className="alert alert-info">
                                                                  <strong>Loading QR Code...</strong>{" "}
                                                                  Please wait while we generate your 2FA setup code.
                                                            </div>
                                                      )}

                                                      </div>

                                                      {/* <div className="secret-key-container mb-3">
                                                            <div className="d-flex align-items-center justify-content-center">
                                                                  <span className="text-muted me-2">Secret Key:</span>
                                                                  <code className="bg-light px-2 py-1 rounded">
                                                                  {secretKey}
                                                                  </code>
                                                                  <Button
                                                                  variant="link"
                                                                  size="sm"
                                                                  className="ms-2 p-0"
                                                                  onClick={() => setSecretKey(secretKey === '••••••••••••••••' ? secretKey : '••••••••••••••••')}
                                                                  >
                                                                  {secretKey === '••••••••••••••••' ? <FaEye /> : <FaEyeSlash />}
                                                                  </Button>
                                                            </div>
                                                      </div> */}

                                                      <div className="text-center">
                                                      <Button
                                                            variant="outline-secondary"
                                                            size="sm"
                                                            onClick={handleResendCode}
                                                            disabled={qrCodeState.isResending}
                                                      >
                                                            <FaQrcode className="me-2" />
                                                            Generate New QR Code
                                                      </Button>
                                                      </div>
                                                </Col>
                                          </Row>

                                          <hr className="my-4" />
                                          </Card.Body>
                                    </Card>
                                    </Col>
                                </Row>
                            )}

                            
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <style jsx global>{`
              label.col-form-label {
                padding: 0 !important;
              }
              .qr-code-container {
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .qr-code-image {
                transition: all 0.3s ease;
              }
              .qr-code-image:hover {
                transform: scale(1.05);
              }
            `}</style>
      

    </React.Fragment>
  );
};

TmsSettings.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TmsSettings;