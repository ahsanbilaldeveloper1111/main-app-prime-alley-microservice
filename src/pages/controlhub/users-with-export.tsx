import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import DataTableWithExport from '@components/DataTableWithExport';
import { getAllUsers } from '@utils/users';
import { Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';

// Define columns for the DataTable
const columns = [
    {
        key: 'LDAP UID',
        name: 'LDAP UID',
        selector: (row: any) => row.ldap_uid,
        sortable: true,
        width: '150px'
    },
    {
        key: 'Name',
        name: 'Name',
        selector: (row: any) => row.name,
        sortable: true,
        width: '200px'
    },
    {
        key: 'Email',
        name: 'Email',
        selector: (row: any) => row.email,
        sortable: true,
        width: '250px'
    },
    {
        key: 'Phone',
        name: 'Phone',
        selector: (row: any) => row.phone,
        sortable: true,
        width: '150px'
    },
    {
        key: 'OU',
        name: 'OU',
        selector: (row: any) => row.ou,
        sortable: true,
        width: '100px'
    },
    {
        key: 'Department',
        name: 'Department',
        selector: (row: any) => row.department,
        sortable: true,
        width: '150px'
    },
    {
        key: 'Company',
        name: 'Company',
        selector: (row: any) => row.company,
        sortable: true,
        width: '150px'
    },
    {
        key: 'Role',
        name: 'Role',
        selector: (row: any) => row.role,
        sortable: true,
        width: '100px',
        cell: (props: any) => (
            <span className={`badge ${props.role === 'Admin' ? 'bg-danger' : props.role === 'Manager' ? 'bg-warning' : 'bg-success'}`}>
                {props.role}
            </span>
        )
    },
    {
        key: 'Group',
        name: 'Group',
        selector: (row: any) => row.group,
        sortable: true,
        width: '120px'
    },
    {
        key: 'Status',
        name: 'Status',
        selector: (row: any) => row.status,
        sortable: true,
        width: '100px',
        cell: (props: any) => (
            <span className={`badge ${props.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                {props.status}
            </span>
        )
    },
    {
        key: 'Last Synced At',
        name: 'Last Synced At',
        selector: (row: any) => row.last_synced_at,
        sortable: true,
        width: '150px',
        cell: (props: any) => (
            <span>{props.last_synced_at ? new Date(props.last_synced_at).toLocaleDateString() : '-'}</span>
        )
    },
    {
        key: 'Actions',
        name: 'Actions',
        selector: (row: any) => row.id,
        sortable: false,
        width: '120px',
        cell: (props: any) => (
            <div className="d-flex gap-2">
                <a href={`/controlhub/users/${props.id}`} className="btn btn-sm btn-outline-primary">
                    View
                </a>
            </div>
        ),
    },
];

const UsersWithExport = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [paginationInfo, setPaginationInfo] = useState({
        totalRows: 0,
        totalPages: 0,
        currentPage: 1,
        perPage: 15
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [currentFilters, setCurrentFilters] = useState({});

    // Fetch data function
    const fetchData = async (page = 1, perPage = 15, search = "") => {
        setLoading(true);
        try {
            const response = await getAllUsers({ 
                page, 
                perPage, 
                search, 
                filters: currentFilters 
            });
            
            if (response && response.data) {
                setData(response.data);
                if (response.meta) {
                    setPaginationInfo({
                        totalRows: response.meta.total,
                        totalPages: response.meta.last_page,
                        currentPage: response.meta.current_page,
                        perPage: response.meta.per_page
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch users data');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchData();
    }, []);

    // Handle page change
    const handlePageChange = (page: number) => {
        fetchData(page, paginationInfo.perPage, searchTerm);
    };

    // Handle per page change
    const handlePerPageChange = (perPage: number) => {
        fetchData(1, perPage, searchTerm);
    };

    // Handle search
    const handleSearch = (search: string) => {
        setSearchTerm(search);
        fetchData(1, paginationInfo.perPage, search);
    };

    // Handle row click
    const handleRowClick = (row: any) => {
       // console.log('Row clicked:', row);
        // You can navigate to user detail page here
        // router.push(`/controlhub/users/${row.id}`);
    };

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/users-with-export" subTitle="Users with Export" />
            
            <Row className="mb-3">
                <Col md={12}>
                    <div className="page-header-title">
                        <h2 className="mb-0">Users with DataTable Export</h2>
                        <p className="text-muted">
                            This page demonstrates how to use DataTable with built-in PDF and Excel export functionality.
                            The export buttons are located in the top-right corner of the table.
                        </p>
                    </div>
                </Col>
            </Row>

            <DataTableWithExport
                columns={columns}
                data={data}
                title="Users"
                loading={loading}
                defaultPageSize={15}
                pageSizeOptions={[10, 15, 25, 50]}
                searchPlaceholder="Search users by name, email, or company..."
                onRowClick={handleRowClick}
                // Server-side pagination props
                serverSide={true}
                paginationInfo={paginationInfo}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                onSearch={handleSearch}
            />

            {/* Additional Information */}
            <Row className="mt-4">
                <Col md={12}>
                    <div className="card">
                        <div className="card-header">
                            <h5>Export Features</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <Col md={6}>
                                    <h6>Excel Export</h6>
                                    <ul className="mb-0">
                                        <li>Exports all visible data (excluding action columns)</li>
                                        <li>Maintains column headers and data formatting</li>
                                        <li>Downloads as .xlsx file</li>
                                        <li>Compatible with Microsoft Excel and Google Sheets</li>
                                    </ul>
                                </Col>
                                <Col md={6}>
                                    <h6>PDF Export</h6>
                                    <ul className="mb-0">
                                        <li>Creates a professional PDF document</li>
                                        <li>Includes table title and export date</li>
                                        <li>Formatted table with alternating row colors</li>
                                        <li>Optimized for printing and sharing</li>
                                    </ul>
                                </Col>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>
        </React.Fragment>
    );
};

UsersWithExport.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default UsersWithExport; 