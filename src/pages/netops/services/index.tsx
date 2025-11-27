import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { Column } from '@components/CustomDataTable';
import { Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { getServices, getMonitoringDashboard, deleteService, createService, updateService, getDevices, Service, MonitoringDashboardResponse, Device } from '@utils/netops';
import { convertUTCToUserTimezone, GlobalDateFormat, GlobalTimeFormat } from '@utils/Helper';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye,FiPlus } from "react-icons/fi";


interface Summary {
    total_services: number;
    services_up: number;
    services_down: number;
    active_alerts: number;
}

const Services = () => {
    const { data: session, status } = useSession();
    
    const columns: Column[] = [
        { key: 'service_name', name: 'Service Name', selector: (row: any) => row.service_name, sortable: true },
        { key: 'service_type', name: 'Type', selector: (row: any) => row.service_type, sortable: true },
        { key: 'api_endpoint', name: 'Endpoint', selector: (row: any) => row.api_endpoint, sortable: true },
        { key: 'check_interval', name: 'Check Interval', selector: (row: any) => row.check_interval, sortable: true,
            cell: (props: any) => {
                return `${props.check_interval}s`;
            }
        },
        { key: 'timeout_seconds', name: 'Timeout', selector: (row: any) => row.timeout_seconds, sortable: true,
            cell: (props: any) => {
                return `${props.timeout_seconds}s`;
            }
        },
        { key: 'status', name: 'Status', selector: (row: any) => row.status, sortable: true,
            cell: (props: any) => {
                return (
                    <span className={`status-badge ${props.status === 'UP' ? 'success' : 'danger'}`}>
                        {props.status}
                    </span>
                );
            }
        },
        { key: 'response_time', name: 'Response Time', selector: (row: any) => row.response_time, sortable: true,
            cell: (props: any) => {
                return props.response_time ? `${props.response_time}ms` : 'N/A';
            }
        },
        { key: 'is_active', name: 'Active', selector: (row: any) => row.is_active, sortable: true,
            cell: (props: any) => {
                return (
                    <span className={`status-badge ${props.is_active ? 'success' : 'secondary'}`}>
                        {props.is_active ? 'Active' : 'Inactive'}
                    </span>
                );
            }
        },
        { key: 'last_checked', name: 'Last Checked', selector: (row: any) => row.last_checked, sortable: true,
            cell: (props: any) => {
                const formattedDate = convertUTCToUserTimezone(props.last_checked, {
                    outputFormat: 'DD-MM-YYYY hh:mm:ss A'
                });
                return formattedDate;
            }
        },
        { key: 'alert_count', name: 'Alerts', selector: (row: any) => row.alert_count, sortable: true,
            cell: (props: any) => {
                return (
                    <span className={`badge bg-${props.alert_count > 0 ? 'warning' : 'success'}`}>
                        {props.alert_count}
                    </span>
                );
            }
        },
        ...(session?.user?.permissions?.includes('edit-service-netops') || session?.user?.permissions?.includes('delete-service-netops') ? [
        { key: 'actions', name: 'Actions', selector: (row: any) => row.service_id, sortable: false,
            cell: (props: any) => {
                return (
                    <DatatableActionButton
                        actions={[
                            ...(session?.user?.permissions?.includes('edit-service-netops') ? [
                            {
                                label: 'Edit',
                                icon: <FiEdit />,
                                onClick: () => handleEditService(props),
                                className: 'gap-2'
                            },
                            ] : []),
                            ...(session?.user?.permissions?.includes('delete-service-netops') ? [
                            {
                                label: 'Delete',
                                icon: <FiTrash2 />,
                                onClick: () => handleDeleteService(props.id, props.service_name),
                                className: 'text-danger gap-2'
                            }
                        ]: []),
                        ]}
                    />
                );
            }
        }
        ] : []),

    ];

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({});
    const [summary, setSummary] = useState<Summary>({
        total_services: 0,
        services_up: 0,
        services_down: 0,
        active_alerts: 0
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<{id: number, name: string} | null>(null);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [formData, setFormData] = useState({
        device_id: 0,
        service_name: '',
        service_type: 'HTTP' as 'PING' | 'HTTP' | 'HTTPS' | 'SSH' | 'TELNET',
        api_endpoint: '',
        check_interval: 60,
        timeout_seconds: 30
    });

    // Create cards data for PageSummaryGrid
    const summaryCards: SummaryCard[] = [
        {
            id: 'total-services',
            title: 'Total Services',
            value: summary?.total_services || 0,
            description: 'Total services in the system',
            delay: 0.1,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'services-up',
            title: 'Services Up',
            value: summary?.services_up || 0,
            description: 'Services currently running',
            delay: 0.3,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'services-down',
            title: 'Services Down',
            value: summary?.services_down || 0,
            description: 'Services currently down',
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

    // Fetch devices for dropdown
    useEffect(() => {
        const fetchDevicesData = async () => {
            try {
                const devicesData = await getDevices();
                setDevices(devicesData);
            } catch (error) {
                console.error('Error fetching devices:', error);
            }
        };
        fetchDevicesData();
    }, []);
    
    const fetchServices = useCallback(async (page = 1, perPage = 15, search = "") => {
        try {
            const [servicesResponse, dashboardResponse] = await Promise.all([
                getServices({ page, perPage, limit: perPage, search, ...currentFilters }),
                getMonitoringDashboard()
            ]);

            // Update summary from dashboard data
            setSummary({
                total_services: dashboardResponse.total_services || 0,
                services_up: dashboardResponse.services_up || 0,
                services_down: dashboardResponse.services_down || 0,
                active_alerts: dashboardResponse.active_alerts || 0
            });

            // Return services data in the format expected by GenericListPage
            return {
                data: servicesResponse || [],
                total: servicesResponse?.length || 0,
                current_page: page,
                per_page: perPage,
                last_page: Math.ceil((servicesResponse?.length || 0) / perPage)
            };
        } catch (error) {
            console.error('Error fetching services:', error);
            toast.error('Failed to fetch services');
            return {
                data: [],
                total: 0,
                current_page: 1,
                per_page: perPage,
                last_page: 1
            };
        }
    }, [currentFilters]);

    const handleDeleteService = (serviceId: number, serviceName: string) => {
        setServiceToDelete({ id: serviceId, name: serviceName });
        setShowDeleteModal(true);
    };

    const confirmDeleteService = async () => {
        if (!serviceToDelete) return;

        try {
            await deleteService(serviceToDelete.id);
            toast.success(`Service ${serviceToDelete.name} deleted successfully`);
            setRefreshKey(prev => prev + 1);
            setShowDeleteModal(false);
            setServiceToDelete(null);
        } catch (error) {
            console.error('Error deleting service:', error);
            toast.error('Failed to delete service');
        }
    };

    const handleCreateService = () => {
        setFormData({
            device_id: 0,
            service_name: '',
            service_type: 'HTTP',
            api_endpoint: '',
            check_interval: 60,
            timeout_seconds: 30
        });
        setShowCreateModal(true);
    };

    const handleEditService = (service: any) => {
        setEditingService(service);
        setFormData({
            device_id: service.device_id || 0,
            service_name: service.service_name,
            service_type: service.service_type,
            api_endpoint: service.api_endpoint || '',
            check_interval: service.check_interval,
            timeout_seconds: service.timeout_seconds
        });
        setShowEditModal(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'device_id' || name === 'check_interval' || name === 'timeout_seconds' 
                ? parseInt(value) || 0 
                : value
        }));
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createService(formData);
            toast.success('Service created successfully');
            setRefreshKey(prev => prev + 1);
            setShowCreateModal(false);
            setFormData({
                device_id: 0,
                service_name: '',
                service_type: 'HTTP',
                api_endpoint: '',
                check_interval: 60,
                timeout_seconds: 30
            });
        } catch (error) {
            console.error('Error creating service:', error);
            toast.error('Failed to create service');
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingService) return;
        console.log("ZE EDITING DEVICE", editingService, formData)
        try {
            await updateService(editingService.id, formData);
            toast.success('Service updated successfully');
            setRefreshKey(prev => prev + 1);
            setShowEditModal(false);
            setEditingService(null);
        } catch (error) {
            console.error('Error updating service:', error);
            toast.error('Failed to update service');
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
            <BreadcrumbItem mainTitle="NetOps" mainLink="/netops/dashboard" subTitle="Services" />
           
            <Row className="mb-3">
                <Col md={12}>
                    <div className="page-header-title style-2">
                        <Row className="d-flex justify-content-between align-items-center">
                            <Col md={4}>
                                <h2 className="mb-0">Services</h2>
                            </Col>
                            <Col md={8} className="d-flex justify-content-end">



                                <div className="action-buttons">
                                <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search services..." onChange={(e) => handleFiltersChange({...currentFilters, search: e.target.value})}/>
                        </div>
                                    
                                    {session?.user?.permissions?.includes('add-service-netops') && (
                                    <Button
                                        variant="primary"
                                        onClick={handleCreateService}
                                        
                                    >
                                        <i className="fas fa-plus"></i> Add Service
                                    </Button>
                                    )}

                                    <Button
                                        variant="info"
                                        onClick={() => setRefreshKey(prev => prev + 1)}
                                        
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
                    fetchData={fetchServices}
                    title="Services"
                    searchPlaceholder="Search services..."
                    defaultPageSize={15}
                    filters={currentFilters}
                    refreshKey={refreshKey}
                    search={false}
                    tableStyle='table-style-2'
                />

            {/* Create Service Modal */}
            <FormModal
                show={showCreateModal}
                onHide={() => setShowCreateModal(false)}
                title="Add New Service"
                desc="Please fill in the details below to create a new service."
                formHtml={
                    <>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Device *</label>
                                    <select
                                        name="device_id"
                                        value={formData.device_id}
                                        onChange={handleInputChange}
                                        required
                                        className="form-control"
                                    >
                                        <option value={0}>Select a device</option>
                                        {devices.map((device) => (
                                            <option key={device.id} value={device.id}>
                                                {device.hostname} ({device.ip_address})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Service Name *</label>
                                    <input
                                        type="text"
                                        name="service_name"
                                        value={formData.service_name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter service name"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Service Type *</label>
                                    <select
                                        name="service_type"
                                        value={formData.service_type}
                                        onChange={handleInputChange}
                                        required
                                        className="form-control"
                                    >
                                        <option value="PING">PING</option>
                                        <option value="HTTP">HTTP</option>
                                        <option value="HTTPS">HTTPS</option>
                                        <option value="SSH">SSH</option>
                                        <option value="TELNET">TELNET</option>
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">API Endpoint</label>
                                    <input
                                        type="url"
                                        name="api_endpoint"
                                        value={formData.api_endpoint}
                                        onChange={handleInputChange}
                                        placeholder="Enter API endpoint (optional)"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Check Interval (seconds) *</label>
                                    <input
                                        type="number"
                                        name="check_interval"
                                        value={formData.check_interval}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        max="3600"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Timeout (seconds) *</label>
                                    <input
                                        type="number"
                                        name="timeout_seconds"
                                        value={formData.timeout_seconds}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        max="300"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                }
                onSubmit={() => {
                    const mockEvent = { preventDefault: () => {} } as React.FormEvent;
                    handleCreateSubmit(mockEvent);
                }}
                submitButtonText="Create Service"
                cancelButtonText="Cancel"
            />

            {/* Edit Service Modal */}
            <FormModal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                title="Edit Service"
                desc="Please update the service details below."
                formHtml={
                    <>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Device *</label>
                                    <select
                                        name="device_id"
                                        value={formData.device_id}
                                        onChange={handleInputChange}
                                        required
                                        className="form-control"
                                    >
                                        <option value={0}>Select a device</option>
                                        {devices.map((device) => (
                                            <option key={device.id} value={device.id}>
                                                {device.hostname} ({device.ip_address})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Service Name *</label>
                                    <input
                                        type="text"
                                        name="service_name"
                                        value={formData.service_name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter service name"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Service Type *</label>
                                    <select
                                        name="service_type"
                                        value={formData.service_type}
                                        onChange={handleInputChange}
                                        required
                                        className="form-control"
                                    >
                                        <option value="PING">PING</option>
                                        <option value="HTTP">HTTP</option>
                                        <option value="HTTPS">HTTPS</option>
                                        <option value="SSH">SSH</option>
                                        <option value="TELNET">TELNET</option>
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">API Endpoint</label>
                                    <input
                                        type="url"
                                        name="api_endpoint"
                                        value={formData.api_endpoint}
                                        onChange={handleInputChange}
                                        placeholder="Enter API endpoint (optional)"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Check Interval (seconds) *</label>
                                    <input
                                        type="number"
                                        name="check_interval"
                                        value={formData.check_interval}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        max="3600"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Timeout (seconds) *</label>
                                    <input
                                        type="number"
                                        name="timeout_seconds"
                                        value={formData.timeout_seconds}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        max="300"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                }
                onSubmit={() => {
                    const mockEvent = { preventDefault: () => {} } as React.FormEvent;
                    handleEditSubmit(mockEvent);
                }}
                submitButtonText="Update Service"
                cancelButtonText="Cancel"
            />

            {/* Delete Confirmation Modal */}
            {showDeleteModal && serviceToDelete && (
                <ConfirmModal
                    show={showDeleteModal}
                    onHide={() => setShowDeleteModal(false)}
                    title="Delete Service?"
                    description="Are you sure you want to delete service {targetName}? This action cannot be undone."
                    targetName={serviceToDelete.name}
                    confirmButtonText="Delete Service"
                    cancelButtonText="Cancel"
                    onConfirm={confirmDeleteService}
                    onCancel={() => setShowDeleteModal(false)}
                    confirmButtonVariant="danger"
                    cancelButtonVariant="secondary"
                    requireTextConfirmation={true}
                    confirmationPlaceholder="Type the word DELETE to confirm"
                    confirmationLabel=""
                    requiredConfirmationText="DELETE"
                />
            )}
        </React.Fragment>
    );
};

Services.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Services;
