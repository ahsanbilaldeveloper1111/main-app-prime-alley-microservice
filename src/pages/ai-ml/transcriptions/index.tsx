import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Button, Card, Form, InputGroup, Modal, Row, Spinner, Tab, Tabs } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { GetTranscriptions } from '@utils/aiml';
import StatCard from '@components/StatCard';
import imgStatus1 from '@assets/images/widget/img-status-1.svg';
import imgStatus2 from '@assets/images/widget/img-status-2.svg';
import imgStatus3 from '@assets/images/widget/img-status-3.svg';
import imgStatus4 from '@assets/images/widget/img-status-4.svg';
import '@assets/scss/tabs.scss';
import { easeIn } from 'framer-motion';
import { easeOut } from 'framer-motion';

interface Transcription {
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
interface Summary {
    characters: number;
    words: number;
    tokens: number;
}

const CallTranscriptions = () => {
    const { data:session, status } = useSession();
    const [transcription, setTranscription] = useState<Transcription | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uuid, setUuid] = useState('2025003611021');
    const [summary, setSummary] = useState<Summary | null>(null);
    const [activeTab, setActiveTab] = useState('en');
    // Animation variants for tab transitions
    const tabVariants = {
        hidden: { 
            opacity: 0, 
            x: 20,
            scale: 0.95
        },
        visible: { 
            opacity: 1, 
            x: 0,
            scale: 1,
            transition: {
                duration: 0.3,
                ease: easeOut
            }
        },
        exit: { 
            opacity: 0, 
            x: -20,
            scale: 0.95,
            transition: {
                duration: 0.2,
                ease: easeIn
            }
        }
    };
    const handleTabChange = (key: string | null) => {
        if (key) {
            setActiveTab(key);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleGetTranscriptions();
      };

    const handleGetTranscriptions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await GetTranscriptions(uuid);
            setTranscription(response);
            console.log(response);
            setSummary({
                characters: response?.num_chars || 0,
                words: response?.num_words || 0,
                tokens: response?.no_of_tokens || 0
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching transcription:', err);
        } finally {
            setLoading(false);
        }
    }

    const renderAnalysisForm = () => (
        <Row className="mb-4">
          <Col md={12}>
            <Card>
              <Card.Header>
                <h5 className="card-title mb-0">Transcription Parameters</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleFormSubmit}>
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>UUID</Form.Label>
                        <Form.Control
                          type="text"
                          value={uuid}
                          onChange={(e) => setUuid(e.target.value)}
                          placeholder="Enter UUID"
                          required
                        />
                      </Form.Group>
                    </Col>
                   
                   
                  </Row>
                  <Row>
                    <Col md={12}>
                      <div className="d-flex justify-content-end">
                        <Button 
                          type="submit" 
                          variant="primary" 
                          disabled={loading}
                          className="me-2"
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Loading...
                            </>
                          ) : (
                            'Get Transcriptions'
                          )}
                        </Button>
                        
                      </div>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      );
   
    
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Transcriptions" />
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title">
                <Row className="align-items-center">
                    <Col md={3}>
                      <h2 className="mb-0 d-flex align-items-center">
                      Call Transcriptions
                      </h2>
                    </Col>
                  </Row>
                </div>
            </Col>
            </Row>

            {/* <Row className="mb-12">
                <Col md={4}>
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Enter UUID"
                            value={uuid}
                            onChange={(e) => setUuid(e.target.value)}
                        />
                        <Button variant="primary" onClick={handleGetTranscriptions} disabled={loading}>
                            {loading ? 'Loading...' : 'Get Transcriptions'}
                        </Button>
                    </InputGroup>
                </Col>
            </Row> */}

            {/* Always show the form */}
      {renderAnalysisForm()}
            

            <Row>
                <Col md={4}>
                    <StatCard
                        title="Characters"
                        value={summary?.characters || 0}
                        valueType="number"
                        icon="phone"
                        size="xl"
                        bgImage={imgStatus1.src}
                        delay={0}
                        />
                </Col>
                <Col md={4}>
                    <StatCard
                        title="Words"
                        value={summary?.words || 0}
                        valueType="number"
                        icon="phone"
                        size="xl"
                        bgImage={imgStatus2.src}
                        delay={0}
                    />
                </Col>
                <Col md={4}>
                    <StatCard
                        title="Tokens"
                        value={summary?.tokens || 0}
                        valueType="number"
                        icon="phone"
                        size="xl"
                        bgImage={imgStatus3.src}
                        delay={0}
                    />
                </Col>
            </Row>
            <Row>
                <Col md={12}>
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Transcriptions List</h5>
                            <Tabs
                                 defaultActiveKey="calls_chart"
                                 id="system-tabs"
                                 className="mb-3 tab-style-two"
                                 activeKey={activeTab}
                                 onSelect={handleTabChange}
                            >
                                <Tab eventKey="en" title="English">
                                    <p>{transcription?.transcription}</p>
                                </Tab>
                                <Tab eventKey="ar" title="Arabic">
                                    <p>{transcription?.transcription_ar}</p>
                                </Tab>
                                <Tab eventKey="ur" title="Urdu">
                                    <p>{transcription?.transcription_ur}</p>
                                </Tab>
                                <Tab eventKey="hi" title="Hindi">
                                    <p>{transcription?.transcription_hi}</p>
                                </Tab>
                            </Tabs>
                        </div>
                    </div>
                </Col>
            </Row>
        </React.Fragment>
    );
};

CallTranscriptions.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default CallTranscriptions;
