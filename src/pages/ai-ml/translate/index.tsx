import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Button, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { GetTranslations } from '@utils/aiml';

interface Translation {
    id: number;
    uuid: string;
    execution_time: string;
    no_of_tokens: number;
    num_chars: number;
    num_words: number;
    transcription: string;
    transcription_ar: string;
    transcription_ur: string;
    transcription_hi: string;
}

const CallTranslations = () => {
    const { data:session, status } = useSession();
    const [translations, setTranslations] = useState<Translation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uuid, setUuid] = useState('2025003611021');
    const [target, setTarget] = useState('');

    const handleGetTranslations = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await GetTranslations(uuid,target);
            setTranslations(response);
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
            <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Translations" />
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
                            {loading ? 'Loading...' : 'Get Translations'}
                        </Button>
                    </InputGroup>
                </Col>
            </Row>
            <Row>
                <Col md={12}>
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Translations</h5>
                            {loading && <p>Loading translations...</p>}
                            {error && <p className="text-danger">Error: {error}</p>}
                            {translations && (
                                <div>
                                    <div className="mb-3">
                                        <strong>UUID:</strong> {translations?.uuid}
                                    </div>
                                    <div className="mb-3">
                                        <strong>Execution Time:</strong> {translations.execution_time}
                                    </div>
                                    <div className="mb-3">
                                        <strong>Characters:</strong> {translations.num_chars}
                                    </div>
                                    <div className="mb-3">
                                        <strong>Words:</strong> {translations.num_words}
                                    </div>
                                    <div className="mb-3">
                                        <strong>Tokens:</strong> {translations.no_of_tokens}
                                    </div>
                                    <div className="mb-3">
                                        <strong>Transcription (English):</strong>
                                        <p className="mt-2">{translations.transcription}</p>
                                    </div>
                                    {translations.transcription_ar && (
                                        <div className="mb-3">
                                            <strong>Transcription (Arabic):</strong>
                                            <p className="mt-2" dir="rtl">{translations.transcription_ar}</p>
                                        </div>
                                    )}
                                    {translations.transcription_hi && (
                                        <div className="mb-3">
                                            <strong>Transcription (Hindi):</strong>
                                            <p className="mt-2">{translations.transcription_hi}</p>
                                        </div>
                                    )}
                                    {translations.transcription_ur && (
                                        <div className="mb-3">
                                            <strong>Transcription (Urdu):</strong>
                                            <p className="mt-2" dir="rtl">{translations.transcription_ur}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </Col>
            </Row>
        </React.Fragment>
    );
};

CallTranslations.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default CallTranslations;
