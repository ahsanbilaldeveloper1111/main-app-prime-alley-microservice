import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListNotifications, MarkNotificationAsRead, DeleteNotification } from '@utils/notifications';
import { Column } from '@components/CustomDataTable';
import { Badge, Modal, Button } from 'react-bootstrap';
import moment from 'moment';
import { toast } from 'react-toastify';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

/** Matches API response for a single notification. */
interface NotificationRow {
    id: number;
    extension_id?: number | null;
    triggered_by_extension_id?: number | null;
    company_id?: number | null;
    action?: string; // CREATE | UPDATE | DELETE
    target_id?: number;
    target_type?: string;
    module?: string;
    source_service?: string | null;
    title?: string;
    description?: string;
    changes?: Record<string, unknown> | null;
    priority?: string; // low | medium | high
    status?: string; // pending | read | archived
    created_at?: string; // ISO 8601
    [key: string]: any;
}

const Notifications = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({ search: '' });
    const [viewNotification, setViewNotification] = useState<NotificationRow | null>(null);

    const fetchNotifications = useCallback(async (page: number, perPage: number, search: string) => {
        const response = await ListNotifications({ page, perPage, search });
        return response?.notifications;
    }, [currentFilters]);

    const handleMarkAsRead = useCallback(async (id: string | number) => {
        try {
            await MarkNotificationAsRead(String(id));
            toast.success('Marked as read');
            setRefreshKey((k) => k + 1);
        } catch {
            toast.error('Failed to mark as read');
        }
    }, []);

    const handleDeleteNotification = useCallback(async (id: string | number) => {
        try {
            await DeleteNotification(String(id));
            toast.success('Notification deleted');
            setRefreshKey((k) => k + 1);
        } catch {
            toast.error('Failed to delete notification');
        }
    }, []);

    const handleFiltersChange = useCallback((filters: Record<string, any>) => {
        setCurrentFilters(filters);
        setRefreshKey((k) => k + 1);
    }, []);

    const handleViewNotification = useCallback((row: NotificationRow) => {
        setViewNotification(row);
    }, []);

    const handleCloseViewModal = useCallback(() => {
        setViewNotification(null);
    }, []);

    const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

    const columns: Column[] = useMemo(() => [
        { 
            key: 'title', 
            name: 'Title', 
            selector: (row: any) => row.title || '-', 
            sortable: true, 
            cell: (props: any) => (
                <div className="font-weight-500">
                    <span>{props.title || '-'}</span>
                </div>
            ) 
        },
        { 
            key: 'description', 
            name: 'Description', 
            selector: (row: any) => row.description || '', 
            sortable: true,
            cell: (props: any) => (
                <div className="text-muted" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {props.description || '-'}
                </div>
            )
        },
        { 
            key: 'action', 
            name: 'Action', 
            selector: (row: any) => row.action || '', 
            sortable: true,
            cell: (props: any) => (
                <Badge bg={props.action === 'CREATE' ? 'success' : props.action === 'UPDATE' ? 'info' : 'danger'}>
                    {props.action || '-'}
                </Badge>
            )
        },
        { 
            key: 'module', 
            name: 'Module', 
            selector: (row: any) => row.module || '-', 
            sortable: true 
        },
        {
            key: 'priority',
            name: 'Priority',
            selector: (row: any) => row.priority || '-',
            sortable: true,
            cell: (props: any) => (
                <Badge bg={props.priority === 'high' ? 'danger' : props.priority === 'medium' ? 'warning' : 'secondary'} className="text-capitalize">
                    {props.priority || '-'}
                </Badge>
            )
        },
        {
            key: 'triggered_by_extension_id',
            name: 'Triggered By',
            selector: (row: any) => row.triggered_by_extension_id ?? '-',
            sortable: true
        },
        { 
            key: 'status', 
            name: 'Status', 
            selector: (row: any) => row.status || '', 
            sortable: true,
            cell: (props: any) => {
                const s = props.status || 'pending';
                const bg = s === 'read' ? 'success' : s === 'archived' ? 'secondary' : 'warning';
                return (
                    <Badge bg={bg} className="text-capitalize">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Badge>
                );
            }
        },
        { 
            key: 'created_at', 
            name: 'Created At', 
            selector: (row: any) => row.created_at || '', 
            sortable: true,
            cell: (props: any) => (
                <span className="text-muted">
                    {props.created_at ? moment(props.created_at).format('DD/MM/YYYY HH:mm') : '-'}
                </span>
            )
        },
        {
            key: 'actions',
            name: '',
            selector: (row: any) => row.id,
            sortable: false,
            cell: (props: any) => (
                <div className="d-flex gap-2">
                    <button onClick={() => handleViewNotification(props)} className="btn btn-primary btn-sm">View</button>
                    <button onClick={() => handleMarkAsRead(props.id)} className="btn btn-primary btn-sm">Mark as read</button>
                    <button onClick={() => handleDeleteNotification(props.id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
            )
        },
    ], [handleMarkAsRead, handleDeleteNotification, handleViewNotification]);
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Notifications" mainLink="/notifications" subTitle="Notifications" />
            <PageHeader
                title="Notifications"
                description="View and manage your notifications"
                showSearch={false}
                searchPlaceholder="Search notifications..."
                searchValue={currentFilters.search || ""}
                onSearchChange={(value) => handleFiltersChange({...currentFilters, search: value})}
                buttons={
                    <>
                    </>
                }
            />

            <GenericListPage
                columns={columns}
                fetchData={fetchNotifications}
                title="Notifications"
                searchPlaceholder="Search notifications..."
                defaultPageSize={15}
                filters={memoizedFilters}
                refreshKey={refreshKey}
                search={true}
                tableStyle="table-style-2"
            />

            <Modal show={!!viewNotification} onHide={handleCloseViewModal} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{viewNotification?.title || 'Notification'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {viewNotification && (
                        <>
                            <p className="mb-3">{viewNotification.description || '-'}</p>
                            <dl className="row mb-0 small">
                                <dt className="col-sm-3 text-muted">Action</dt>
                                <dd className="col-sm-9"><Badge bg={viewNotification.action === 'CREATE' ? 'success' : viewNotification.action === 'UPDATE' ? 'info' : 'danger'}>{viewNotification.action || '-'}</Badge></dd>
                                <dt className="col-sm-3 text-muted">Module</dt>
                                <dd className="col-sm-9">{viewNotification.module || '-'}</dd>
                                <dt className="col-sm-3 text-muted">Source service</dt>
                                <dd className="col-sm-9">{viewNotification.source_service ?? '-'}</dd>
                                <dt className="col-sm-3 text-muted">Target</dt>
                                <dd className="col-sm-9">{viewNotification.target_type && viewNotification.target_id != null ? `${viewNotification.target_type} #${viewNotification.target_id}` : '-'}</dd>
                                <dt className="col-sm-3 text-muted">Triggered by</dt>
                                <dd className="col-sm-9">{viewNotification.triggered_by_extension_id ?? '-'}</dd>
                                <dt className="col-sm-3 text-muted">Priority</dt>
                                <dd className="col-sm-9"><Badge bg={viewNotification.priority === 'high' ? 'danger' : viewNotification.priority === 'medium' ? 'warning' : 'secondary'} className="text-capitalize">{viewNotification.priority || '-'}</Badge></dd>
                                <dt className="col-sm-3 text-muted">Status</dt>
                                <dd className="col-sm-9">
                                    <Badge bg={viewNotification.status === 'read' ? 'success' : viewNotification.status === 'archived' ? 'secondary' : 'warning'} className="text-capitalize">
                                        {viewNotification.status ? viewNotification.status.charAt(0).toUpperCase() + viewNotification.status.slice(1) : '-'}
                                    </Badge>
                                </dd>
                                <dt className="col-sm-3 text-muted">Created at</dt>
                                <dd className="col-sm-9">{viewNotification.created_at ? moment(viewNotification.created_at).format('DD/MM/YYYY HH:mm') : '-'}</dd>
                                {viewNotification.changes && Object.keys(viewNotification.changes).length > 0 && (
                                    <>
                                        <dt className="col-sm-3 text-muted">Changes</dt>
                                        <dd className="col-sm-9"><pre className="mb-0 small bg-light p-2 rounded">{JSON.stringify(viewNotification.changes, null, 2)}</pre></dd>
                                    </>
                                )}
                            </dl>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {viewNotification && viewNotification.status !== 'read' && (
                        <Button variant="primary" size="sm" onClick={() => { handleMarkAsRead(viewNotification.id); handleCloseViewModal(); }}>
                            Mark as read
                        </Button>
                    )}
                    {viewNotification && (
                        <Button variant="danger" size="sm" onClick={() => { handleDeleteNotification(viewNotification.id); handleCloseViewModal(); }}>
                            Delete
                        </Button>
                    )}
                    <Button variant="secondary" onClick={handleCloseViewModal}>Close</Button>
                </Modal.Footer>
            </Modal>
        
        </React.Fragment>
    );
};

Notifications.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Notifications;

