import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row, Col, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import { getDevices, getMonitoringDashboard, deleteDevice, createDevice, updateDevice, Device, MonitoringDashboardResponse } from '@utils/netops';
import { convertUTCToUserTimezone, GlobalDateFormat, GlobalTimeFormat } from '@utils/Helper';

interface Summary {
    total_devices: number;
    devices_up: number;
    devices_down: number;
    active_alerts: number;
}

const Devices = () => {
    const { data: session, status } = useSession();
    
    const columns: Column[] = [
        { key: 'hostname', name: 'Hostname', selector: (row: any) => row.hostname, sortable: true },
        { key: 'ip_address', name: 'IP Address', selector: (row: any) => row.ip_address, sortable: true },
        { key: 'customer_name', name: 'Customer', selector: (row: any) => row.customer_name, sortable: true },
        { key: 'device_type', name: 'Device Type', selector: (row: any) => row.device_type, sortable: true },
        { key: 'protocol', name: 'Protocol', selector: (row: any) => row.protocol, sortable: true },
        { key: 'port', name: 'Port', selector: (row: any) => row.port, sortable: true },
        { key: 'is_active', name: 'Status', selector: (row: any) => row.is_active, sortable: true,
            cell: (props: any) => {
                return (
                    <span className={`badge bg-${props.is_active ? 'success' : 'danger'}`}>
                        {props.is_active ? 'Active' : 'Inactive'}
                    </span>
                );
            }
        },
        { key: 'created_at', name: 'Created At', selector: (row: any) => row.created_at, sortable: true,
            cell: (props: any) => {
                const formattedDate = convertUTCToUserTimezone(props.created_at, {
                    outputFormat: 'DD-MM-YYYY hh:mm:ss A'
                });
                return formattedDate;
            }
        },
        { key: 'actions', name: 'Actions', selector: (row: any) => row.id, sortable: false,
            cell: (props: any) => {
                return (
                    <div className="d-flex gap-2">
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEditDevice(props)}
                        >
                            <i className="fas fa-edit"></i>
                        </Button>
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteDevice(props.id, props.hostname)}
                        >
                            <i className="fas fa-trash"></i>
                        </Button>
                    </div>
                );
            }
        }
    ];

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({});
    const [summary, setSummary] = useState<Summary>({
        total_devices: 0,
        devices_up: 0,
        devices_down: 0,
        active_alerts: 0
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState<{id: number, hostname: string} | null>(null);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [formData, setFormData] = useState({
        hostname: '',
        ip_address: '',
        username: '',
        password: '',
        protocol: 'SSH' as 'SSH' | 'TELNET' | 'HTTP' | 'HTTPS',
        port: 22,
        customer_name: '',
        device_type: null as 'cisco_ios' | 'cisco_ios_telnet' | 'generic' | null,
        enable_password: ''
    });

    // Create cards data for PageSummaryGrid
    const summaryCards: SummaryCard[] = [
        {
            id: 'total-devices',
            title: 'Total Devices',
            value: summary?.total_devices || 0,
            description: 'Total devices in the system',
            delay: 0.1,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'devices-up',
            title: 'Devices Online',
            value: summary?.devices_up || 0,
            description: 'Devices currently online',
            delay: 0.3,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'devices-down',
            title: 'Devices Offline',
            value: summary?.devices_down || 0,
            description: 'Devices currently offline',
            delay: 0.5,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'active-alerts',
            title: 'Active Alerts',
            value: summary?.active_alerts || 0,
            description: 'Currently active alerts',
            delay: 0.7,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        }
    ];
    
    const fetchDevices = useCallback(async (page = 1, perPage = 15, search = "") => {
        try {
            const [devicesResponse, dashboardResponse] = await Promise.all([
                getDevices({ page, perPage, limit: perPage, search, ...currentFilters }),
                getMonitoringDashboard()
            ]);

            // Update summary from dashboard data
            setSummary({
                total_devices: dashboardResponse.total_devices || 0,
                devices_up: dashboardResponse.devices_up || 0,
                devices_down: dashboardResponse.devices_down || 0,
                active_alerts: dashboardResponse.active_alerts || 0
            });

            // Return devices data in the format expected by GenericListPage
            return {
                data: devicesResponse || [],
                total: devicesResponse?.length || 0,
                current_page: page,
                per_page: perPage,
                last_page: Math.ceil((devicesResponse?.length || 0) / perPage)
            };
        } catch (error) {
            console.error('Error fetching devices:', error);
            toast.error('Failed to fetch devices');
            return {
                data: [],
                total: 0,
                current_page: 1,
                per_page: perPage,
                last_page: 1
            };
        }
    }, [currentFilters]);

    const handleDeleteDevice = (deviceId: number, hostname: string) => {
        setDeviceToDelete({ id: deviceId, hostname });
        setShowDeleteModal(true);
    };

    const confirmDeleteDevice = async () => {
        if (!deviceToDelete) return;

        try {
            await deleteDevice(deviceToDelete.id);
            toast.success(`Device ${deviceToDelete.hostname} deleted successfully`);
            setRefreshKey(prev => prev + 1);
            setShowDeleteModal(false);
            setDeviceToDelete(null);
        } catch (error) {
            console.error('Error deleting device:', error);
            toast.error('Failed to delete device');
        }
    };

    const handleCreateDevice = () => {
        setFormData({
            hostname: '',
            ip_address: '',
            username: '',
            password: '',
            protocol: 'SSH',
            port: 22,
            customer_name: '',
            device_type: null,
            enable_password: ''
        });
        setShowCreateModal(true);
    };

    const handleEditDevice = (device: Device) => {
        setEditingDevice(device);
        setFormData({
            hostname: device.hostname,
            ip_address: device.ip_address,
            username: device.username,
            password: '', // Don't pre-fill password for security
            protocol: device.protocol,
            port: device.port,
            customer_name: device.customer_name,
            device_type: device.device_type,
            enable_password: '' // Don't pre-fill enable password for security
        });
        setShowEditModal(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'port' ? parseInt(value) || 22 : value
        }));
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createDevice(formData);
            toast.success('Device created successfully');
            setRefreshKey(prev => prev + 1);
            setShowCreateModal(false);
            setFormData({
                hostname: '',
                ip_address: '',
                username: '',
                password: '',
                protocol: 'SSH',
                port: 22,
                customer_name: '',
                device_type: null,
                enable_password: ''
            });
        } catch (error) {
            console.error('Error creating device:', error);
            toast.error('Failed to create device');
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDevice) return;

        try {
            // Only include password fields if they have values
            const updateData: any = { ...formData };
            if (!updateData.password) {
                delete updateData.password;
            }
            if (!updateData.enable_password) {
                delete updateData.enable_password;
            }
            
            await updateDevice(editingDevice.id, updateData);
            toast.success('Device updated successfully');
            setRefreshKey(prev => prev + 1);
            setShowEditModal(false);
            setEditingDevice(null);
        } catch (error) {
            console.error('Error updating device:', error);
            toast.error('Failed to update device');
        }
    };

    const handleFiltersChange = (filters: any) => {
        setCurrentFilters(filters);
    };

    const handleExport = async (exportType: string, filters: Record<string, any>) => {
        try {
            // TODO: Implement export functionality
            toast.info('Export functionality will be implemented soon');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Export failed');
        }
    };
    
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="NetOps" mainLink="/netops/dashboard" subTitle="Devices" />
           
            <Row className="mb-3">
                <Col md={12}>
                    <div className="page-header-title style-2">
                        <Row className="d-flex justify-content-between align-items-center">
                            <Col md={4}>
                                <h2 className="mb-0">Devices</h2>
                            </Col>
                            <Col md={8} className="d-flex justify-content-end">
                                <div className="action-buttons">
                                    <Button
                                        variant="primary"
                                        onClick={handleCreateDevice}
                                        className="me-2"
                                    >
                                        <i className="fas fa-plus"></i> Add Device
                                    </Button>
                                    <Button
                                        variant="outline-primary"
                                        onClick={() => setRefreshKey(prev => prev + 1)}
                                        className="me-2"
                                    >
                                        <i className="fas fa-sync-alt"></i> Refresh
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Col>
            </Row>

            <PageSummaryGrid cards={summaryCards} />

                <GenericListPage
                    columns={columns}
                    fetchData={fetchDevices}
                    title="Devices"
                    searchPlaceholder="Search devices..."
                    defaultPageSize={15}
                    filters={currentFilters}
                    refreshKey={refreshKey}
                    search={true}
                    tableStyle='table-style-2'
                />

            {/* Create Device Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Device</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Hostname *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="hostname"
                                        value={formData.hostname}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter hostname"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>IP Address *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="ip_address"
                                        value={formData.ip_address}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter IP address"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Username *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter username"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Password *</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter password"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Protocol *</Form.Label>
                                    <Form.Select
                                        name="protocol"
                                        value={formData.protocol}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="SSH">SSH</option>
                                        <option value="TELNET">TELNET</option>
                                        <option value="HTTP">HTTP</option>
                                        <option value="HTTPS">HTTPS</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Port *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="port"
                                        value={formData.port}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        max="65535"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Customer Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="customer_name"
                                        value={formData.customer_name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter customer name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Device Type</Form.Label>
                                    <Form.Select
                                        name="device_type"
                                        value={formData.device_type || ''}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select device type</option>
                                        <option value="cisco_ios">Cisco IOS</option>
                                        <option value="cisco_ios_telnet">Cisco IOS Telnet</option>
                                        <option value="generic">Generic</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Create Device
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit Device Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Device</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Hostname *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="hostname"
                                        value={formData.hostname}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter hostname"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>IP Address *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="ip_address"
                                        value={formData.ip_address}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter IP address"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Username *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter username"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Enter new password (leave blank to keep current)"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Protocol *</Form.Label>
                                    <Form.Select
                                        name="protocol"
                                        value={formData.protocol}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="SSH">SSH</option>
                                        <option value="TELNET">TELNET</option>
                                        <option value="HTTP">HTTP</option>
                                        <option value="HTTPS">HTTPS</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Port *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="port"
                                        value={formData.port}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        max="65535"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Customer Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="customer_name"
                                        value={formData.customer_name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter customer name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Device Type</Form.Label>
                                    <Form.Select
                                        name="device_type"
                                        value={formData.device_type || ''}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select device type</option>
                                        <option value="cisco_ios">Cisco IOS</option>
                                        <option value="cisco_ios_telnet">Cisco IOS Telnet</option>
                                        <option value="generic">Generic</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Enable Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="enable_password"
                                        value={formData.enable_password}
                                        onChange={handleInputChange}
                                        placeholder="Enter new enable password (leave blank to keep current)"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Update Device
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete device <strong>{deviceToDelete?.hostname}</strong>? 
                    This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDeleteDevice}>
                        Delete Device
                    </Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
};

Devices.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Devices;
