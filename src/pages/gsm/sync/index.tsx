import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { ListGsmManagement } from '@utils/GsmManagement';
import { SyncPorts, ViewGsm, SyncPortsMobileNumber, GetClientGsmProfile } from '@utils/GsmAssign';

import { Button, Row, Col, Card, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import Select from 'react-select';
import "@assets/scss/common.scss";

const GsmSync = () => {
    const { data: session, status } = useSession();
    
    const [gsmList, setGsmList] = useState<any[]>([]);
    const [selectedGsm, setSelectedGsm] = useState<any>(null);
    const [selectedType, setSelectedType] = useState<any>(null);
    const [portsList, setPortsList] = useState<any[]>([]);
    const [selectedPorts, setSelectedPorts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMobile, setIsLoadingMobile] = useState(false);
    const [isFetchingGsm, setIsFetchingGsm] = useState(false);

    // Type options for the second dropdown
    const typeOptions = [
        { value: 'imei', label: 'IMEI' },
        { value: 'iccid', label: 'ICCID' },
        { value: 'imsi', label: 'IMSI' },
        { value: 'reg', label: 'REG' }
    ];

    // Fetch GSM list on component mount
    useEffect(() => {
        fetchGsmList();
    }, []);

    const fetchGsmList = async () => {
        setIsFetchingGsm(true);
        try {
            const response = await ListGsmManagement({ page: 1, perPage: 1000 });
            if (response && response.dataList) {
                const gsmOptions = response.dataList.map((gsm: any) => ({
                    value: gsm.id,
                    label: `${gsm.name} (${gsm.ip_address})`,
                    gsm: gsm
                }));
                setGsmList(gsmOptions);
            }
        } catch (error) {
            console.error('Error fetching GSM list:', error);
            toast.error('Failed to fetch GSM list');
        } finally {
            setIsFetchingGsm(false);
        }
    };

    const handleGsmChange = (selectedOption: any) => {
        setSelectedGsm(selectedOption);
        setSelectedPorts([]);
        setPortsList([]);
        
        if (selectedOption) {
            ViewGsm(selectedOption.value).then((res: any) => {
                if (res && res.data) {
                    const portOptions = res.data.map((port: any) => ({
                        value: port.id,
                        label: `Port ${port.port_number} (ID: ${port.id})`
                    }));
                    setPortsList(portOptions);
                }
            }).catch((error) => {
                console.error('Error fetching ports:', error);
                toast.error('Failed to fetch ports for selected GSM');
            });
        }
    };

    const handleTypeChange = (selectedOption: any) => {
        setSelectedType(selectedOption);
    };

    const handlePortsChange = (selectedOptions: any) => {
        setSelectedPorts(selectedOptions || []);
    };

    const handleFetchDetails = async () => {
        if (!selectedGsm || !selectedType) {
            toast.error('Please select both GSM and Type');
            return;
        }

        setIsLoading(true);
        try {
            const response = await SyncPorts(selectedType.value, selectedGsm.value);
            if (response) {
                toast.success('Sync completed successfully');
            } else {
                toast.error('Sync failed');
            }
        } catch (error) {
            console.error('Sync error:', error);
            toast.error('Sync failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSyncMobileNumbers = async () => {
        if (!selectedGsm || selectedPorts.length === 0) {
            toast.error('Please select GSM and at least one port');
            return;
        }

        setIsLoadingMobile(true);
        try {
            const portIds = selectedPorts.map(port => port.value);
            const response = await SyncPortsMobileNumber(portIds, selectedGsm.value);
            
            if (response) {
                toast.success('Mobile numbers sync completed successfully');
            } else {
                toast.error('Mobile numbers sync failed');
            }
        } catch (error) {
            console.error('Mobile sync error:', error);
            toast.error('Mobile numbers sync failed. Please try again.');
        } finally {
            setIsLoadingMobile(false);
        }
    };

    const isFetchButtonDisabled = !selectedGsm || !selectedType || isLoading;
    const isMobileSyncButtonDisabled = !selectedGsm || selectedPorts.length === 0 || isLoadingMobile;

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="GSM" mainLink="/gsm" subTitle="Sync GSM" />
            
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={5}>
						{/* <h2 className="mb-0">Sync Ports</h2> */}
					</Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <Card>
                        <Card.Header>
                            <h5 className="card-title mb-0">GSM Sync Configuration</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row className="d-flex justify-content-between align-items-center">
                                <Col md={5}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Select GSM</Form.Label>
                                        <Select
                                            value={selectedGsm}
                                            onChange={handleGsmChange}
                                            options={gsmList}
                                            placeholder="Choose a GSM..."
                                            isLoading={isFetchingGsm}
                                            isClearable
                                            isSearchable
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={5}>
                                    <Form.Group className="mb-3">
                                        
                                    <Form.Label>Select Type</Form.Label>
                                        <Select
                                            value={selectedType}
                                            onChange={handleTypeChange}
                                            options={typeOptions}
                                            placeholder="Choose a type..."
                                            isClearable
                                        />
                                    </Form.Group>

                                    
                                </Col>
                                <Col md={2}>
                                  <Form.Group className="mb-3">
                                  <Form.Label></Form.Label>
                                  <Button
                                            variant="primary"
                                            className="btn-sm app-button"
                                            onClick={handleFetchDetails}
                                            disabled={isFetchButtonDisabled}
                                            size="sm"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Spinner
                                                        as="span"
                                                        animation="border"
                                                        size="sm"
                                                        role="status"
                                                        aria-hidden="true"
                                                        className="me-2"
                                                    />
                                                    Syncing...
                                                </>
                                            ) : (
                                                'Sync Ports'
                                            )}
                                        </Button>
                                  </Form.Group>
                                </Col>
                            </Row>
                            
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Select Ports (Multi-select)</Form.Label>
                                        <Select
                                            value={selectedPorts}
                                            onChange={handlePortsChange}
                                            options={portsList}
                                            placeholder="Choose ports..."
                                            isMulti
                                            isClearable
                                            isSearchable
                                            isDisabled={!selectedGsm}
                                        />
                                    </Form.Group>
                                    <Button
                                            variant="success"
                                            onClick={handleSyncMobileNumbers}
                                            className="btn-sm app-button"
                                            disabled={isMobileSyncButtonDisabled}
                                            size="sm"
                                        >
                                            {isLoadingMobile ? (
                                                <>
                                                    <Spinner
                                                        as="span"
                                                        animation="border"
                                                        size="sm"
                                                        role="status"
                                                        aria-hidden="true"
                                                        className="me-2"
                                                    />
                                                    Syncing...
                                                </>
                                            ) : (
                                                'Sync Mobile Numbers'
                                            )}
                                        </Button>
                                </Col>
                               
                            </Row>

                            {(selectedGsm && selectedType) || (selectedGsm && selectedPorts.length > 0) ? (
                                <Row className="mt-4">
                                    <Col md={12}>
                                        <Card className="bg-light">
                                            <Card.Body>
                                                <h6>Selected Configuration:</h6>
                                                <p className="mb-1">
                                                    <strong>GSM:</strong> {selectedGsm.label}
                                                </p>
                                                {selectedType && (
                                                    <p className="mb-1">
                                                        <strong>Type:</strong> {selectedType.label}
                                                    </p>
                                                )}
                                                {selectedPorts.length > 0 && (
                                                    <p className="mb-0">
                                                        <strong>Selected Ports:</strong> {selectedPorts.map(port => port.label).join(', ')}
                                                    </p>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            ) : null}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    );
};

GsmSync.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default GsmSync;
