import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListNotifications } from '@utils/notifications';
import { Column } from '@components/CustomDataTable';
import { Badge } from 'react-bootstrap';
import moment from 'moment';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { CheckCircle, XCircle, Info, AlertCircle } from 'lucide-react';


const Notifications = () => {
   
    const columns: Column[] = useMemo(() => [
        { 
            key: 'title', 
            name: 'Title', 
            selector: (row: any) => row.title || row.message || 'No Title', 
            sortable: true, 
            cell: (props: any) => (
                <div className="font-weight-500">
                    <span>{props.title || props.message || 'No Title'}</span>
                </div>
            ) 
        },
        { 
            key: 'message', 
            name: 'Message', 
            selector: (row: any) => row.message || row.description || '', 
            sortable: true,
            cell: (props: any) => (
                <div className="text-muted" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {props.message || props.description || '-'}
                </div>
            )
        },
        { 
            key: 'type', 
            name: 'Type', 
            selector: (row: any) => row.type || 'info', 
            sortable: true,
            cell: (props: any) => {
                const type = props.type || 'info';
                const typeColors: any = {
                    'success': 'success',
                    'error': 'danger',
                    'warning': 'warning',
                    'info': 'info',
                    'danger': 'danger'
                };
                const typeIcons: any = {
                    'success': <CheckCircle size={14} />,
                    'error': <XCircle size={14} />,
                    'warning': <AlertCircle size={14} />,
                    'info': <Info size={14} />,
                    'danger': <XCircle size={14} />
                };
                return (
                    <Badge bg={typeColors[type] || 'info'} className="d-flex align-items-center gap-1" style={{ width: 'fit-content' }}>
                        {typeIcons[type] || <Info size={14} />}
                        <span style={{ textTransform: 'capitalize' }}>{type}</span>
                    </Badge>
                );
            }
        },
        { 
            key: 'read', 
            name: 'Status', 
            selector: (row: any) => row.read ? 'read' : 'unread', 
            sortable: true,
            cell: (props: any) => (
                <Badge bg={props.read ? 'secondary' : 'primary'}>
                    {props.read ? 'Read' : 'Unread'}
                </Badge>
            )
        },
        { 
            key: 'created_at', 
            name: 'Created At', 
            selector: (row: any) => row.created_at || row.timestamp, 
            sortable: true,
            cell: (props: any) => {
                const date = props.created_at || props.timestamp;
                return (
                    <span className="text-muted">
                        {date ? moment(date).format('DD/MM/YYYY HH:mm') : '-'}
                    </span>
                );
            }
        },
    ], []);

    const [refreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({search: ""});

    const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

    const fetchNotifications = useCallback(async (page = 1, perPage = 15, search = "") => {
        const response = await ListNotifications({ page, perPage, search:currentFilters.search || search, filters: memoizedFilters });
        console.log('Response:', response);
        return response;
    }, [memoizedFilters, currentFilters]);

    const handleFiltersChange = useCallback((filters: any) => {
        setCurrentFilters(filters);
    }, []);

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
        
        </React.Fragment>
    );
};

Notifications.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Notifications;

