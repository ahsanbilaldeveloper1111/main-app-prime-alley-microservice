import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import '@assets/scss/common.scss';
import { Tag, Info } from 'lucide-react';
import { getFAQTypes, getAllFAQTopics } from '@utils/faqs';
import Select from 'react-select';

const FAQTypes = () => {
  const { data: session } = useSession();
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [topicOptions, setTopicOptions] = useState<any[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(false);

  useEffect(() => {
    fetchTopicOptions();
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [selectedTopic]);

  const fetchTopicOptions = async () => {
    setIsLoadingTopics(true);
    try {
      const topics = await getAllFAQTopics();
      setTopicOptions([
        { value: null, label: 'All Topics' },
        ...topics.map((t: any) => ({
          value: t.id,
          label: `${t.name}${t.faq_module ? ` (${t.faq_module.name})` : ''}`
        }))
      ]);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const response = await getFAQTypes(selectedTopic || undefined);
      setTypes(response || []);
    } catch (error) {
      console.error('Error fetching FAQ types:', error);
      setTypes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="FAQs" mainLink="/faqs" subTitle="Types" />
      
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={6}>
                {/* <h2 className="mb-0">FAQ Types</h2>
                <p className="text-muted mb-0">View all FAQ types used across FAQ items</p> */}
              </Col>
              <Col md={6} className="d-flex justify-content-end align-items-center">
                <div style={{ minWidth: '250px' }}>
                  <Select
                    options={topicOptions}
                    value={topicOptions.find(opt => opt.value === selectedTopic)}
                    onChange={(option: any) => setSelectedTopic(option?.value || null)}
                    placeholder="Filter by topic..."
                    isLoading={isLoadingTopics}
                    isClearable={true}
                  />
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status" className="mb-3">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="text-muted">Loading FAQ types...</p>
                </div>
              ) : types.length > 0 ? (
                <div>
                  <div className="mb-3">
                    <p className="text-muted mb-0">
                      <Info size={14} className="me-1" />
                      Found {types.length} unique type{types.length !== 1 ? 's' : ''}
                      {selectedTopic && ` for selected topic`}
                    </p>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {types.map((type, index) => (
                      <Badge key={index} bg="primary" className="p-2" style={{ fontSize: '0.9rem' }}>
                        <Tag size={14} className="me-1" />
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <Tag size={48} className="text-muted mb-3" />
                  <p className="text-muted">
                    {selectedTopic 
                      ? 'No types found for the selected topic' 
                      : 'No FAQ types found. Types are automatically created when FAQ items are assigned a type.'}
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

FAQTypes.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default FAQTypes;

