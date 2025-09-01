import React, { ReactElement, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Card, Row, Col, Button, Form, InputGroup, Alert } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { tmsLogin } from '@services/tmsAuth';
import { tmsSession } from '@utils/tmsSession';

const TmsLogin = () => {

    const router = useRouter();
    const [email, setEmail] = useState('test@test.com');
    const [password, setPassword] = useState('test@123');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await tmsLogin(email, password);
            if (res.code !== 200 || !res.data?.access_token) {
                setError(res.message || 'TMS login failed');
                setLoading(false);
                return;
            }
            const expiresAt = Math.floor(Date.now() / 1000) + (res.data.expires_in || 3600);
            tmsSession.save({
                accessToken: res.data.access_token,
                expiresAt,
                user: res.data.user,
            });
            router.push('/tms');
        } catch (err) {
            setError('Unable to login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="TMS" mainLink="/tms" subTitle="TMS Login" />
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
                                        <i className="ph-duotone ph-shield-check" style={{ fontSize: 26, color: '#0d6efd' }}></i>
                                    </div>
                                    <h3 className="mb-1">Verify your identity</h3>
                                    <div className="text-muted">Sign in to access TMS system</div>
                                </div>
                            </Card.Header>
                            <Card.Body className="px-4 pb-4 pt-3">
                                {error && (
                                    <Alert variant="danger" className="mb-3">
                                        {error}
                                    </Alert>
                                )}
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold">Email</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text><i className="ph-duotone ph-envelope"></i></InputGroup.Text>
                                            <Form.Control 
                                                type="email" 
                                                value={email} 
                                                onChange={(e) => setEmail(e.target.value)} 
                                                required 
                                                placeholder="you@company.com" 
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
                                            {loading ? 'Signing in...' : 'Sign in'}
                                        </Button>
                                    </div>
                                </Form>
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
