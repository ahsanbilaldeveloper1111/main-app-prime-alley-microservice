import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Button, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { GetTranslations } from '@utils/aiml';

interface Translation {
    id: number;
    uuid: string;
    target: string;
    translation: string;
}

const CallTranslations = () => {
    const { data:session, status } = useSession();
    const [translations, setTranslations] = useState<Translation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uuid, setUuid] = useState('');
    const [target, setTarget] = useState('');
    const [isError, setIsError] = useState(false);
    const [showPageLoader, setShowPageLoader] = useState(false);

    const handleGetTranslations = async () => {
        setLoading(true);
        setError(null);

        if(uuid === ''){
            toast.error('Please enter a valid UUID');
            setLoading(false);
            return;
        }

        if(target === ''){
            toast.error('Please select a target language');
            setLoading(false);
            return;
        }
        
        try {
            //setShowPageLoader(true);
            const response = await GetTranslations(uuid,target).finally(() => {
                setLoading(false);
            });
            setTranslations(response);
            if(response.error){
                toast.error(response.error);
                setIsError(true);
                setError(response.error);
                setLoading(false);
                return;
            }
            console.log(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching translations:', err);
        } finally {
            setLoading(false);
        }
    }
   
    
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Translations"  />
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title">
                <Row className="align-items-center">
                    <Col md={3}>
                      <h2 className="mb-0 d-flex align-items-center">
                      Call Translations
                      </h2>
                    </Col>
                  </Row>
                </div>
            </Col>
            </Row>

            <Row className="mb-3">
                <Col md={12}>
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Enter UUID"
                            value={uuid}
                            onChange={(e) => setUuid(e.target.value)}
                        />
                        <Form.Select
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                        >
                            <option value="">Select Translation Language</option>
                            <option value="ar">Arabic</option>
                            <option value="ur">Urdu</option>
                            <option value="hi">Hindi</option>
                            <option value="en">English</option>
                        </Form.Select>
                        <Button variant="primary" onClick={handleGetTranslations} disabled={loading}>
                            {loading ? 
                            <Spinner animation="border" role="status" size="sm" />
                             : 'Get Translations'}
                        </Button>
                    </InputGroup>
                </Col>
            </Row>

          
                    

            {translations  && (
            <Row>
                <Col md={12}>
                    {isError && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    {!isError && translations && (
                        <div className="card">
                        <div className="card-body">
                            
                        
                                <div>
                                    <h5 className="card-title">Translations</h5>
                                    <div className="mb-3">
                                        <strong>UUID:</strong> {translations?.uuid}
                                    </div>

                                    {translations?.target && (
                                    <div className="mb-3">
                                        <strong>Language:</strong> {translations?.target}
                                    </div>
                                    )}

                                    {translations?.translation && (
                                    <div className="mb-3">
                                        <strong>Translation:</strong> {translations?.translation}
                                    </div>
                                    )}

                            
                                </div>
                            
                        </div>
                    </div>
                    )}
                   
                    
                        
                </Col>
            </Row>
            )}
        </React.Fragment>
    );
};

CallTranslations.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default CallTranslations;
