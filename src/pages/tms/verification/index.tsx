import React, { ReactElement, useState, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Card, Row, Col, Button, Form, InputGroup, Alert } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { tmsLogin, verifyEmailCode, resendEmailCode } from '@services/tms/tmsAuth';
import { signIn } from 'next-auth/react';
import { toast } from 'react-toastify';

const TmsLogin = () => {

    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    
    // Verification states
    const [verificationStep, setVerificationStep] = useState<'login' | 'email' | '2fa'>('login');
    const [verificationCode, setVerificationCode] = useState('');
    const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [codeSent, setCodeSent] = useState(false);
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [resendLoading, setResendLoading] = useState(false);
    const [otpExpiry, setOtpExpiry] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [storedPassword, setStoredPassword] = useState<string>('');

    // Debug: Log component mount
    useEffect(() => {
        console.log('TMS Verification component mounted');
        return () => {
            console.log('TMS Verification component unmounting');
        };
    }, []);

    // Function to handle TMS session after verification
    const handleTmsSessionSuccess = async (accessToken: string, userData: any, expiresIn: number) => {
        try {
            console.log('TMS verification successful, creating session...');
            console.log('User data:', userData);
            console.log('Stored password length:', storedPassword.length);
            
            // Create a custom session by calling our session API
            const requestBody = {
                accessToken,
                userData,
                expiresIn,
                email: userData.email
            };
            
            console.log('Sending session request with body:', {
                accessToken: accessToken ? 'present' : 'missing',
                accessTokenValue: accessToken,
                userData: userData ? 'present' : 'missing',
                userDataType: typeof userData,
                userDataKeys: userData ? Object.keys(userData) : 'N/A',
                expiresIn,
                email: userData.email
            });
            
            const response = await fetch('/api/auth/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Session API response status:', response.status);
            console.log('Session API response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Session API error response:', errorText);
                throw new Error(`Failed to create session: ${response.status} ${errorText}`);
            }

            const sessionData = await response.json();
            console.log('Session created successfully:', sessionData);

            // Store session ID in localStorage as backup
            localStorage.setItem('tmsSessionId', sessionData.sessionId);
            console.log('Stored session ID in localStorage as backup:', sessionData.sessionId);

            toast.success('Verification successful');
            console.log('Redirecting to dashboard...');
            
            // Add a small delay to ensure the cookie is set
            setTimeout(() => {
                console.log('Executing redirect to dashboard...');
                window.location.href = '/tms/dashboard';
            }, 500);

        } catch (error) {
            console.error('Session creation error:', error);
            toast.error('Session setup failed. Please try again.');
        }
    };

    // Timer effect for OTP expiry
    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (otpExpiry > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [otpExpiry]);


    // Start OTP timer (5 minutes = 300 seconds)
    const startOtpTimer = () => {
        const expiryTime = Date.now() + (5 * 60 * 1000); // 5 minutes from now
        setOtpExpiry(expiryTime);
        setTimeLeft(300); // 5 minutes in seconds
    };

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle OTP digit input
    const handleOtpChange = (index: number, value: string) => {
        // Only allow single digit
        if (value.length > 1) return;
        
        // Only allow numbers
        if (value && !/^\d$/.test(value)) return;
        
        const newOtpDigits = [...otpDigits];
        newOtpDigits[index] = value;
        setOtpDigits(newOtpDigits);
        
        // Update verification code
        const code = newOtpDigits.join('');
        setVerificationCode(code);
        
        // Auto-focus next input (only if not the last digit)
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) {
                nextInput.focus();
            }
        }
        
        // Auto-submit when all 6 digits are filled
        if (value && code.length === 6) {
            // Use the updated code directly instead of relying on state
            setTimeout(() => {
                handleVerifyCodeWithCode(code);
            }, 100);
        }
    };

    // Handle OTP key down (backspace, paste, etc.)
    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            // Focus previous input on backspace
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) {
                prevInput.focus();
            }
        }
        
        // Handle paste
        if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            navigator.clipboard.readText().then(text => {
                const pastedDigits = text.replace(/\D/g, '').slice(0, 6).split('');
                const newOtpDigits = ['', '', '', '', '', ''];
                pastedDigits.forEach((digit, i) => {
                    if (i < 6) newOtpDigits[i] = digit;
                });
                setOtpDigits(newOtpDigits);
                const code = newOtpDigits.join('');
                setVerificationCode(code);
                
                // Auto-submit if 6 digits are pasted
                if (code.length === 6) {
                    setTimeout(() => {
                        handleVerifyCodeWithCode(code);
                    }, 100);
                } else {
                    // Focus last filled input
                    const lastFilledIndex = pastedDigits.length - 1;
                    const nextInput = document.getElementById(`otp-${Math.min(lastFilledIndex + 1, 5)}`);
                    if (nextInput) {
                        nextInput.focus();
                    }
                }
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        setStoredPassword(password); // Store password for later use with NextAuth
        try {
            const res = await tmsLogin(email, password, false);
            
            // Handle new response structure with data wrapper
            const userData = res?.data?.user || res?.user;
            const requiresEmailVerification = res?.data?.requires_email_verification || res?.requires_email_verification;
            const requiresGoogleAuthVerification = res?.data?.requires_google_auth_verification || res?.requires_google_auth_verification;
            const accessToken = res?.data?.access_token || res?.access_token;
            const expiresIn = res?.data?.expires_in || res?.expires_in;
            
            if (requiresEmailVerification) {
                setVerificationStep('email');
                setCodeSent(true); // Code is sent automatically by server
                setUserId(userData?.id?.toString() || ''); // Store user_id for verification
                setOtpDigits(['', '', '', '', '', '']); // Reset OTP digits
                setVerificationCode(''); // Reset verification code
                startOtpTimer(); // Start 5-minute timer
                setLoading(false);
                return;
            }

            // Check if 2FA is required
            if (requiresGoogleAuthVerification) {
                setVerificationStep('2fa');
                setCodeSent(false);
                setUserId(userData?.id?.toString() || ''); // Set userId from login response
                setOtpDigits(['', '', '', '', '', '']); // Reset OTP digits
                setVerificationCode(''); // Reset verification code
                setLoading(false);
                return;
            }

            // Direct login if no verification required
            if (accessToken) {
                // Handle TMS session directly
                const directExpiresIn = typeof expiresIn === 'string' ? parseInt(expiresIn) : (expiresIn || 3600);
                await handleTmsSessionSuccess(accessToken, userData, directExpiresIn);
            } else {
                toast.error(res?.data?.message || res?.message || 'Login failed. Please try again.');
            }
        } catch (err: any) {
            // Handle different error response structures
            if (err?.response?.data?.response?.message) {
                toast.error(err.response.data.response.message);
            } else if (err?.response?.data?.message) {
                toast.error(err.response.data.message);
            } else if (err?.message) {
                toast.error(err.message);
            } else {
                toast.error('Unable to verify. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };


    const handleVerifyCodeWithCode = async (code: string) => {
        setError(null);
        setVerificationLoading(true);
        
        try {
            if (!userId) {
                toast.error('User ID not found. Please try logging in again.');
                setVerificationLoading(false);
                return;
            }
            
            const res = await verifyEmailCode(userId, code, verificationStep === '2fa');

            // Handle new response structure with data wrapper
            const accessToken = res?.data?.access_token || res?.access_token;
            const expiresIn = res?.data?.expires_in || res?.expires_in;
            const userData = res?.data?.user || res?.user;
            const requiresGoogleAuthVerification = res?.data?.requires_google_auth_verification || res?.requires_google_auth_verification;

            if (res && accessToken) {
                // Check if 2FA is required after email verification
                if (verificationStep === 'email' && requiresGoogleAuthVerification) {
                    setVerificationStep('2fa');
                    setOtpDigits(['', '', '', '', '', '']); // Reset OTP digits
                    setVerificationCode(''); // Reset verification code
                    setError(null); // Clear any errors
                    // Keep userId for 2FA verification
                } else if (accessToken) {
                    // Handle TMS session directly
                    const verifyExpiresIn = typeof expiresIn === 'string' ? parseInt(expiresIn) : (expiresIn || 3600);
                    await handleTmsSessionSuccess(accessToken, userData, verifyExpiresIn);
                } else {
                    toast.error(res?.data?.message || res?.response?.message || res?.message || 'Verification failed');
                }
            } else {
                toast.error(res?.data?.message || res?.response?.message || res?.message || 'Verification failed');
            }
        } catch (err: any) {
            // Handle different error response structures
            if (err?.response?.data?.response?.message) {
                toast.error(err.response.data.response.message);
            } else if (err?.response?.data?.message) {
                toast.error(err.response.data.message);
            } else if (err?.message) {
                toast.error(err.message);
            } else {
                toast.error('Verification failed. Please try again.');
            }
        } finally {
            setVerificationLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setVerificationLoading(true);
        
        try {
            if (!userId) {
                toast.error('User ID not found. Please try logging in again.');
                setVerificationLoading(false);
                return;
            }
            
            const res = await verifyEmailCode(userId, verificationCode, verificationStep === '2fa');

            // Handle new response structure with data wrapper
            const accessToken = res?.data?.access_token || res?.access_token;
            const expiresIn = res?.data?.expires_in || res?.expires_in;
            const userData = res?.data?.user || res?.user;
            const requiresGoogleAuthVerification = res?.data?.requires_google_auth_verification || res?.requires_google_auth_verification;

            if (res && accessToken) {
                // Check if 2FA is required after email verification
                if (verificationStep === 'email' && requiresGoogleAuthVerification) {
                    setVerificationStep('2fa');
                    setOtpDigits(['', '', '', '', '', '']); // Reset OTP digits
                    setVerificationCode(''); // Reset verification code
                    setError(null); // Clear any errors
                    // Keep userId for 2FA verification
                } else if (accessToken) {
                    // Handle TMS session directly
                    const verifyExpiresIn = typeof expiresIn === 'string' ? parseInt(expiresIn) : (expiresIn || 3600);
                    await handleTmsSessionSuccess(accessToken, userData, verifyExpiresIn);
                } else {
                    toast.error(res?.data?.message || res?.response?.message || res?.message || 'Verification failed');
                }
            } else {
                toast.error(res?.data?.message || res?.response?.message || res?.message || 'Verification failed');
            }
        } catch (err: any) {
            // Handle different error response structures
            if (err?.response?.data?.response?.message) {
                toast.error(err.response.data.response.message);
            } else if (err?.response?.data?.message) {
                toast.error(err.response.data.message);
            } else if (err?.message) {
                toast.error(err.message);
            } else {
                toast.error('Verification failed. Please try again.');
            }
        } finally {
            setVerificationLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError(null);
        setResendLoading(true);
        try {
            const res = await resendEmailCode(userId);
            
            // Handle new response structure
            if (res.success === true) {
                setCodeSent(true);
                startOtpTimer(); // Restart timer for new code
                toast.success(res?.data?.message || 'Verification code resent successfully');
            } else {
                toast.error(res?.message || 'Failed to resend verification code');
            }
        } catch (err: any) {
            // Handle different error response structures
            if (err?.response?.data?.response?.message) {
                toast.error(err.response.data.response.message);
            } else if (err?.response?.data?.message) {
                toast.error(err.response.data.message);
            } else if (err?.message) {
                toast.error(err.message);
            } else {
                toast.error('Failed to resend verification code. Please try again.');
            }
        } finally {
            setResendLoading(false);
        }
    };

    const handleBackToLogin = () => {
        setVerificationStep('login');
        setVerificationCode('');
        setOtpDigits(['', '', '', '', '', '']);
        setCodeSent(false);
        setError(null);
        setUserId('');
        setOtpExpiry(0);
        setTimeLeft(0);
    };

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="TMS" mainLink="/tms" subTitle="TMS Verify" />
            <div 
                className="d-flex align-items-center justify-content-center px-3" 
                style={{ minHeight: '80vh',  }}
            >
                <Row className="w-100 justify-content-center">
                    <Col md={12} lg={6} xl={5}>
                        <Card className="shadow-lg border-0 rounded-4">
                            <Card.Header className="border-0 bg-transparent pt-4">
                                <div className="text-center">
                                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 56, height: 56, backgroundColor: 'rgba(13,110,253,0.1)' }}>
                                        <i className={`ph-duotone ${verificationStep === 'login' ? 'ph-shield-check' : verificationStep === 'email' ? 'ph-envelope' : 'ph-device-mobile'}`} style={{ fontSize: 26, color: '#0d6efd' }}></i>
                                    </div>
                                    <h3 className="mb-1">
                                        {verificationStep === 'login' && 'Verify your identity'}
                                        {verificationStep === 'email' && 'Email Verification'}
                                        {verificationStep === '2fa' && 'Two-Factor Authentication'}
                                    </h3>
                                    <div className="text-muted">
                                        {verificationStep === 'login' && 'Verify your identity to access TMS system'}
                                        {verificationStep === 'email' && 'A verification code has been sent to your email. Please enter it below.'}
                                        {verificationStep === '2fa' && 'Enter the 6-digit code from your authenticator app to complete verification'}
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body className="px-4 pb-4 pt-3">
                                {error && (
                                    <Alert variant="danger" className="mb-3">
                                        {error}
                                    </Alert>
                                )}
                                {verificationStep === 'login' && (
                                    <Form onSubmit={handleSubmit}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Username</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text><i className="ph-duotone ph-envelope"></i></InputGroup.Text>
                                                <Form.Control 
                                                    type="text" 
                                                    value={email} 
                                                    onChange={(e) => setEmail(e.target.value)} 
                                                    required 
                                                    placeholder="username" 
                                                />
                                            </InputGroup>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Password</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text><i className="ph-duotone ph-lock-simple"></i></InputGroup.Text>
                                                <Form.Control 
                                                    type={showPassword ? 'text' : 'password'} 
                                                    value={password} 
                                                    onChange={(e) => setPassword(e.target.value)} 
                                                    required 
                                                    placeholder="••••••••"
                                                />
                                                <Button 
                                                    variant="outline-secondary" 
                                                    type="button" 
                                                    onClick={() => setShowPassword((s) => !s)}
                                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                >
                                                    <i className={showPassword ? 'ph-duotone ph-eye-slash' : 'ph-duotone ph-eye'}></i>
                                                </Button>
                                            </InputGroup>
                                        </Form.Group>
                                        <div className="d-flex gap-2 justify-content-center pt-2">
                                            <Button type="submit" disabled={loading} className="px-4">
                                                {loading ? 'Verifying...' : 'Verify'}
                                            </Button>
                                        </div>
                                    </Form>
                                )}

                                {(verificationStep === 'email' || verificationStep === '2fa') && (
                                    <Form onSubmit={handleVerifyCode}>
                                        
                                        {verificationStep === 'email' && (
                                            <>
                                                {/* <div className="mb-3">
                                                    <div className="alert alert-info d-flex align-items-center">
                                                        <i className="ph-duotone ph-info me-2"></i>
                                                        <small>Verification code sent to your email. Please check your inbox.</small>
                                                    </div>
                                                </div> */}

                                                <Form.Group className="mb-3">
                                                    {/* <Form.Label className="fw-semibold">Verification Code</Form.Label> */}
                                                    <div className="d-flex justify-content-center gap-2">
                                                        {otpDigits.map((digit, index) => (
                                                            <Form.Control
                                                                key={index}
                                                                id={`otp-${index}`}
                                                                type="text"
                                                                value={digit}
                                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                                className={`text-center fw-bold ${verificationLoading ? 'opacity-50' : ''}`}
                                                                style={{
                                                                    width: '45px',
                                                                    height: '45px',
                                                                    fontSize: '18px',
                                                                    border: verificationLoading ? '2px solid #0d6efd' : '2px solid #dee2e6',
                                                                    borderRadius: '8px',
                                                                    backgroundColor: verificationLoading ? '#f8f9fa' : 'white'
                                                                }}
                                                                maxLength={1}
                                                                inputMode="numeric"
                                                                pattern="[0-9]*"
                                                                autoComplete="off"
                                                                disabled={verificationLoading}
                                                            />
                                                        ))}
                                                    </div>
                                                </Form.Group>

                                                {timeLeft > 0 && (
                                                    <div className="mb-3 text-center">
                                                        <div className="d-inline-flex align-items-center bg-light rounded px-3 py-2">
                                                            <i className="ph-duotone ph-clock me-2 text-warning"></i>
                                                            <small className="fw-semibold text-muted">
                                                                Code expires in: <span className="text-danger">{formatTime(timeLeft)}</span>
                                                            </small>
                                                        </div>
                                                    </div>
                                                )}

                                                {timeLeft === 0 && (
                                                    <div className="mb-3 text-center">
                                                        <Button 
                                                            variant="link" 
                                                            onClick={handleResendCode}
                                                            disabled={resendLoading}
                                                            className="text-decoration-none p-0"
                                                        >
                                                            {resendLoading ? 'Resending...' : 'Resend Code'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {verificationStep === '2fa' && (
                                            <>

                                                <Form.Group className="mb-3">
                                                    
                                                    <div className="d-flex justify-content-center gap-2">
                                                        {otpDigits.map((digit, index) => (
                                                            <Form.Control
                                                                key={index}
                                                                id={`otp-${index}`}
                                                                type="text"
                                                                value={digit}
                                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                                className={`text-center fw-bold ${verificationLoading ? 'opacity-50' : ''}`}
                                                                style={{
                                                                    width: '45px',
                                                                    height: '45px',
                                                                    fontSize: '18px',
                                                                    border: verificationLoading ? '2px solid #0d6efd' : '2px solid #dee2e6',
                                                                    borderRadius: '8px',
                                                                    backgroundColor: verificationLoading ? '#f8f9fa' : 'white'
                                                                }}
                                                                maxLength={1}
                                                                inputMode="numeric"
                                                                pattern="[0-9]*"
                                                                autoComplete="off"
                                                                disabled={verificationLoading}
                                                            />
                                                        ))}
                                                    </div>
                                                </Form.Group>
                                            </>
                                        )}

                                        <div className="d-flex gap-2 justify-content-center pt-2">
                                            <Button 
                                                variant="outline-secondary" 
                                                type="button" 
                                                onClick={handleBackToLogin}
                                                className="px-3"
                                            >
                                                Back
                                            </Button>
                                            <Button 
                                                type="submit" 
                                                disabled={verificationLoading} 
                                                className="px-4"
                                            >
                                                {verificationLoading ? 'Verifying...' : 'Verify'}
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </React.Fragment>
    );
};

TmsLogin.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default TmsLogin;   
