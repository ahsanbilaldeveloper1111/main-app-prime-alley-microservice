import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useRef } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { Column } from '@components/CustomDataTable';
import { Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import { getDevices, getMonitoringDashboard, deleteDevice, createDevice, updateDevice, Device, getDeviceMonitoringStatus } from '@utils/netops';
import { convertUTCToUserTimezone } from '@utils/Helper';
import "@assets/scss/common.scss";
import { FiRefreshCw, FiEdit, FiTrash2, FiPlus } from "react-icons/fi";

import "@assets/scss/tabs.scss";
import FormModal from "@components/page-partials/FormModal";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import DatatableActionButton from "@components/DatatableActionButton";



interface Summary {
    total_devices: number;
    devices_up: number;
    devices_down: number;
    active_alerts: number;
}

interface DeviceWithStatus extends Device {
    monitoring_status?: 'UP' | 'DOWN';
    last_check?: string | null;
    uptime_percentage?: number;
}

const Devices = () => {
    const { data: session } = useSession();
    
    const columns: Column[] = [
        { key: 'hostname', name: 'Hostname', selector: (row: any) => row.hostname, sortable: true },
        { key: 'ip_address', name: 'IP Address', selector: (row: any) => row.ip_address, sortable: true },
        { key: 'customer_name', name: 'Customer', selector: (row: any) => row.customer_name, sortable: true },
        { key: 'device_type', name: 'Device Type', selector: (row: any) => row.device_type, sortable: true },
        { key: 'protocol', name: 'Protocol', selector: (row: any) => row.protocol, sortable: true },
        { key: 'port', name: 'Port', selector: (row: any) => row.port, sortable: true },
        { key: 'monitoring_status', name: 'Status', selector: (row: any) => row.monitoring_status, sortable: true,
            cell: (props: any) => {
                // if (props.monitoring_status === undefined) {
                //     return (
                //         <span className="status-badge loading">
                //             <i className="fas fa-spinner fa-spin me-1"></i>
                //             Checking...
                //         </span>
                //     );
                // }
                const status = props.status;
                return (
                    <span className={`status-badge ${status === 'UP' ? 'success' : 'danger'}`}>
                        <i className={`fas ${status === 'UP' ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                        {status}
                        {/* {status === 'UP' ? 'Online' : 'Offline'} */}
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
        ...(session?.user?.permissions?.includes('edit-device-netops') || session?.user?.permissions?.includes('delete-device-netops') ? [
        { key: 'actions', name: 'Actions', selector: (row: any) => row.id, sortable: false,
            cell: (props: any) => {
                return (
                    <DatatableActionButton
                        actions={[

                            ...(session?.user?.permissions?.includes('edit-device-netops') ? [
                            {
                                label: 'Edit',
                                    icon: <FiEdit />,
                                    onClick: () => handleEditDevice(props),
                                    className: 'gap-2'
                                },
                            ] : []),


                            ...(session?.user?.permissions?.includes('delete-device-netops') ? [
                            {
                                label: 'Delete',
                                icon: <FiTrash2 />,
                                onClick: () => handleDeleteDevice(props.id, props.hostname),
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
    const [devicesWithStatus, setDevicesWithStatus] = useState<DeviceWithStatus[]>([]);
    const [loadingStatuses, setLoadingStatuses] = useState<boolean>(false);
    const [statusProgress, setStatusProgress] = useState<{loaded: number, total: number}>({loaded: 0, total: 0});
    const hasInitialLoad = useRef<boolean>(false);
    const devicesRef = useRef<DeviceWithStatus[]>([]);

    // Function to handle refresh - clears cache and forces refetch
    const handleRefresh = useCallback(() => {
        hasInitialLoad.current = false;
        setDevicesWithStatus([]);
        devicesRef.current = [];
        setStatusProgress({loaded: 0, total: 0});
        setRefreshKey(prev => prev + 1);
    }, []);

    const loadMonitoringStatuses = useCallback(async (devices: DeviceWithStatus[]) => {
        setLoadingStatuses(true);
        setStatusProgress({loaded: 0, total: devices.length});
        
        try {
            // Create promises for all devices in parallel
            const statusPromises = devices.map(async (device) =>     {
                try {
                    const monitoringStatus = await getDeviceMonitoringStatus(device.id);
                    const updatedDevice = {
                        ...device,
                        monitoring_status: monitoringStatus.status,
                        last_check: monitoringStatus.last_check,
                        uptime_percentage: monitoringStatus.uptime_percentage
                    };
                    
                    // Update state immediately as each status is fetched
                    setDevicesWithStatus(prevDevices => {
                        const updatedDevices = [...prevDevices];
                        const index = updatedDevices.findIndex(d => d.id === device.id);
                        if (index !== -1) {
                            updatedDevices[index] = updatedDevice;
                        }
                        // Also update the ref
                        devicesRef.current = updatedDevices;
                        return updatedDevices;
                    });
                    
                    // Update progress
                    setStatusProgress(prev => ({...prev, loaded: prev.loaded + 1}));
                    
                    return updatedDevice;
                } catch (error) {
                    console.warn(`Failed to fetch monitoring status for device ${device.id}:`, error);
                    const updatedDevice = {
                        ...device,
                        monitoring_status: 'DOWN' as 'UP' | 'DOWN',
                        last_check: null,
                        uptime_percentage: 0
                    };
                    
                    // Update state immediately even for failed requests
                    setDevicesWithStatus(prevDevices => {
                        const updatedDevices = [...prevDevices];
                        const index = updatedDevices.findIndex(d => d.id === device.id);
                        if (index !== -1) {
                            updatedDevices[index] = updatedDevice;
                        }
                        // Also update the ref
                        devicesRef.current = updatedDevices;
                        return updatedDevices;
                    });
                    
                    // Update progress even for failed requests
                    setStatusProgress(prev => ({...prev, loaded: prev.loaded + 1}));
                    
                    return updatedDevice;
                }
            });

            // Wait for all promises to complete (though individual updates happen immediately)
            await Promise.all(statusPromises);
        } catch (error) {
            console.error('Error loading monitoring statuses:', error);
        } finally {
            setLoadingStatuses(false);
        }
    }, []);

    const fetchDevices = useCallback(async (page = 1, perPage = 15, search = "") => {
        try {
            // If we already have devices with status, return them to avoid refetching
            if (hasInitialLoad.current && devicesRef.current.length > 0) {
                return {
                    data: devicesRef.current || [],
                    total: devicesRef.current?.length || 0,
                    current_page: page,
                    per_page: perPage,
                    last_page: Math.ceil((devicesRef.current?.length || 0) / perPage)
                };
            }

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

            // Convert devices to DeviceWithStatus format without monitoring status initially
            const devicesWithStatus: DeviceWithStatus[] = (devicesResponse || []).map((device: Device) => ({
                ...device,
                monitoring_status: undefined,
                last_check: undefined,
                uptime_percentage: undefined
            }));

            // Store devices in state and ref for progressive loading
            setDevicesWithStatus(devicesWithStatus);
            devicesRef.current = devicesWithStatus;
            hasInitialLoad.current = true;

            // Start loading monitoring statuses in the background
            // loadMonitoringStatuses(devicesWithStatus);

            // Return devices data in the format expected by GenericListPage
            return {
                data: devicesWithStatus || [],
                total: devicesWithStatus?.length || 0,
                current_page: page,
                per_page: perPage,
                last_page: Math.ceil((devicesWithStatus?.length || 0) / perPage)
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
    
    const handleDeleteDevice = (deviceId: number, hostname: string) => {
        setDeviceToDelete({ id: deviceId, hostname });
        setShowDeleteModal(true);
    };

    const confirmDeleteDevice = async (confirmationText: string) => {
        if (!deviceToDelete) return;

        try {
            await deleteDevice(deviceToDelete.id);
            toast.success(`Device ${deviceToDelete.hostname} deleted successfully`);
            handleRefresh();
            setShowDeleteModal(false);
            setDeviceToDelete(null);
        } catch (error) {
            console.error('Error deleting device:', error);
            toast.error('Failed to delete device');
        }
    };

    const handleCreateDevice = () => {
        setShowCreateModal(true);
    };

    const [editFormData, setEditFormData] = useState({
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

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: name === 'port' ? parseInt(value) || 22 : value
        }));
    };

    const handleEditDevice = (device: Device) => {
        setEditingDevice(device);
        setEditFormData({
            hostname: device.hostname,
            ip_address: device.ip_address,
            username: device.username,
            password: '', // Don't pre-fill password for security
            protocol: device.protocol,
            port: device.port,
            customer_name: device.customer_name,
            device_type: device.device_type || null,
            enable_password: '' // Don't pre-fill enable password for security
        });
        setShowEditModal(true);
    };


    const [createFormData, setCreateFormData] = useState({
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

    const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCreateFormData(prev => ({
            ...prev,
            [name]: name === 'port' ? parseInt(value) || 22 : value
        }));
    };

    const handleCreateSubmit = async () => {
        try {
            await createDevice(createFormData);
            toast.success('Device created successfully');
            handleRefresh();
            setShowCreateModal(false);
            setCreateFormData({
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
            const updateData: any = { ...editFormData };
            if (!updateData.password) {
                delete updateData.password;
            }
            if (!updateData.enable_password) {
                delete updateData.enable_password;
            }
            
            await updateDevice(editingDevice.id, updateData);
            toast.success('Device updated successfully');
            handleRefresh();
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
            <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/uptime-sla" subTitle="Devices" />
           
            <Row className="mb-3">
                <Col md={12}>
                    <div className="page-header-title style-2">
                        <Row className="d-flex justify-content-between align-items-center">
                            <Col md={4}>
                                <h2 className="mb-0">Devices</h2>
                            </Col>
                            <Col md={8} className="d-flex justify-content-end align-items-center">
                                {loadingStatuses && statusProgress.total > 0 && (
                                    <div className="me-3">
                                        <small className="text-muted">
                                            <i className="fas fa-spinner fa-spin me-1"></i>
                                            Loading statuses: {statusProgress.loaded}/{statusProgress.total}
                                        </small>
                                    </div>
                                )}
                                <div className="action-buttons gap-2">
                                    <>
                                    {session?.user?.permissions?.includes('add-device-netops') && (
                                    <Button
                                        variant="primary"
                                        className="me-2"
                                        onClick={handleCreateDevice}
                                        
                                    >

                                        <FiPlus size={14} /> Add Device
                                    </Button>
                                    )}

                                    <Button
                                        variant="info"
                                        className="me-2"
                                        onClick={handleRefresh}
                                       
                                    >
                                        <FiRefreshCw size={14} /> Refresh
                                    </Button>

                                    </>
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
            <FormModal
                show={showCreateModal}
                onHide={() => setShowCreateModal(false)}
                title="Add New Device"
                desc="Please fill in the details below to create a new device."
                formHtml={
                    <>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Hostname *</label>
                                    <input
                                        type="text"
                                        name="hostname"
                                        value={createFormData.hostname}
                                        onChange={handleCreateInputChange}
                                        required
                                        placeholder="Enter hostname"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">IP Address *</label>
                                    <input
                                        type="text"
                                        name="ip_address"
                                        value={createFormData.ip_address}
                                        onChange={handleCreateInputChange}
                                        required
                                        placeholder="Enter IP address"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Username *</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={createFormData.username}
                                        onChange={handleCreateInputChange}
                                        required
                                        placeholder="Enter username"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Password *</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={createFormData.password}
                                        onChange={handleCreateInputChange}
                                        required
                                        placeholder="Enter password"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Protocol *</label>
                                    <select
                                        name="protocol"
                                        value={createFormData.protocol}
                                        onChange={handleCreateInputChange}
                                        required
                                        className="form-control"
                                    >
                                        <option value="SSH">SSH</option>
                                        <option value="TELNET">TELNET</option>
                                        <option value="HTTP">HTTP</option>
                                        <option value="HTTPS">HTTPS</option>
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Port *</label>
                                    <input
                                        type="number"
                                        name="port"
                                        value={createFormData.port}
                                        onChange={handleCreateInputChange}
                                        required
                                        min="1"
                                        max="65535"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Customer Name *</label>
                                    <input
                                        type="text"
                                        name="customer_name"
                                        value={createFormData.customer_name}
                                        onChange={handleCreateInputChange}
                                        required
                                        placeholder="Enter customer name"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Device Type</label>
                                    <select
                                        name="device_type"
                                        value={createFormData.device_type || ''}
                                        onChange={handleCreateInputChange}
                                        className="form-control"
                                    >
                                        <option value="">Select device type</option>
                                        <option value="cisco_ios">Cisco IOS</option>
                                        <option value="cisco_ios_telnet">Cisco IOS Telnet</option>
                                        <option value="generic">Generic</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-12">
                                <div className="form-group mb-3">
                                    <label className="form-label">Enable Password</label>
                                    <input
                                        type="password"
                                        name="enable_password"
                                        value={createFormData.enable_password}
                                        onChange={handleCreateInputChange}
                                        placeholder="Enter enable password"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                }
                onSubmit={handleCreateSubmit}
                submitButtonText="Create Device"
                cancelButtonText="Cancel"
            />

            {/* Edit Device Modal */}
            <FormModal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                title="Edit Device"
                desc="Please update the device details below."
                formHtml={
                    <>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Hostname *</label>
                                    <input
                                        type="text"
                                        name="hostname"
                                        value={editFormData.hostname}
                                        onChange={handleEditInputChange}
                                        required
                                        placeholder="Enter hostname"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">IP Address *</label>
                                    <input
                                        type="text"
                                        name="ip_address"
                                        value={editFormData.ip_address}
                                        onChange={handleEditInputChange}
                                        required
                                        placeholder="Enter IP address"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Username *</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={editFormData.username}
                                        onChange={handleEditInputChange}
                                        required
                                        placeholder="Enter username"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={editFormData.password}
                                        onChange={handleEditInputChange}
                                        placeholder="Enter new password (leave blank to keep current)"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Protocol *</label>
                                    <select
                                        name="protocol"
                                        value={editFormData.protocol}
                                        onChange={handleEditInputChange}
                                        required
                                        className="form-control"
                                    >
                                        <option value="SSH">SSH</option>
                                        <option value="TELNET">TELNET</option>
                                        <option value="HTTP">HTTP</option>
                                        <option value="HTTPS">HTTPS</option>
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Port *</label>
                                    <input
                                        type="number"
                                        name="port"
                                        value={editFormData.port}
                                        onChange={handleEditInputChange}
                                        required
                                        min="1"
                                        max="65535"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Customer Name *</label>
                                    <input
                                        type="text"
                                        name="customer_name"
                                        value={editFormData.customer_name}
                                        onChange={handleEditInputChange}
                                        required
                                        placeholder="Enter customer name"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label className="form-label">Device Type</label>
                                    <select
                                        name="device_type"
                                        value={editFormData.device_type || ''}
                                        onChange={handleEditInputChange}
                                        className="form-control"
                                    >
                                        <option value="">Select device type</option>
                                        <option value="cisco_ios">Cisco IOS</option>
                                        <option value="cisco_ios_telnet">Cisco IOS Telnet</option>
                                        <option value="generic">Generic</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-12">
                                <div className="form-group mb-3">
                                    <label className="form-label">Enable Password</label>
                                    <input
                                        type="password"
                                        name="enable_password"
                                        value={editFormData.enable_password}
                                        onChange={handleEditInputChange}
                                        placeholder="Enter new enable password (leave blank to keep current)"
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
                submitButtonText="Update Device"
                cancelButtonText="Cancel"
            />

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deviceToDelete && (
                <ConfirmModal
                    show={showDeleteModal}
                    onHide={() => setShowDeleteModal(false)}
                    title="Delete Device?"
                    description="Are you sure you want to delete device {targetName}? This action cannot be undone."
                    targetName={deviceToDelete.hostname}
                    confirmButtonText="Delete Device"
                    cancelButtonText="Cancel"
                    onConfirm={confirmDeleteDevice}
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

Devices.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Devices;
