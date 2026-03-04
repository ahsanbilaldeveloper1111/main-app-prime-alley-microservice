import React, { useState, useEffect } from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import UsersList from './UsersList';
import UserGrowthChart from './UserGrowthChart';
import DepartmentDistributionChart from './DepartmentDistributionChart';
import RecentActivities from './RecentActivities';
import { Column } from '@components/CustomDataTable';
import BarFilters from '@components/BarFilters';

interface OverviewTabProps {
    
    summaryCards: SummaryCard[];
    columns: Column[];
    fetchUsers: (page?: number, perPage?: number, search?: string) => Promise<any>;
    customFieldColumns: Column[];
    currentFilters: any;
    handleFiltersChange: (filters: any) => void;
    hasListPermission: boolean;
    showFilters?: boolean;
    growthChart: {
        series: Array<{ name: string; data: number[] }>;
        options: any;
    };
    departmentChart: {
        series: number[];
        options: any;
    };
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    summaryCards,
    columns,
    fetchUsers,
    customFieldColumns,
    currentFilters,
    handleFiltersChange,
    hasListPermission,
    showFilters = true,
    growthChart,
    departmentChart
}) => {
    const { data: session } = useSession();
    const [searchValue, setSearchValue] = useState('');
    const [pendingFilters, setPendingFilters] = useState<Record<string, any>>(currentFilters || {});

    // Sync pendingFilters with currentFilters when they change externally
    useEffect(() => {
        setPendingFilters(currentFilters || {});
        // Extract search value from currentFilters if it exists
        if (currentFilters?.search) {
            setSearchValue(currentFilters.search);
        }
    }, [currentFilters]);

    return (
        <>
            {/* <PageSummaryGrid cards={summaryCards} /> */}
            
           
            <BarFilters
                searchValue={searchValue}
                showFilters={session?.user?.permissions?.includes('filters-users') || false}
                leftContent={
                    <>
                    {/* <h5 className="mb-0">Users Directory</h5> */}
                    </>
                }
                onSearchChange={(value) => {
                    setSearchValue(value);
                    handleFiltersChange({ ...currentFilters, search: value || undefined });
                }}
                onSearch={() => {
                    const filtersWithSearch = { ...pendingFilters, search: searchValue };
                    setPendingFilters(filtersWithSearch);
                    handleFiltersChange(filtersWithSearch);
                }}
                searchPlaceholder="Type ( Extension, User Name, Display Name )"
                showSearch={true}
                filters={pendingFilters}
                // onSubmit={() => {
                //     handleFiltersChange(pendingFilters);
                // }}
                onReset={() => {
                    setPendingFilters({});
                    setSearchValue('');
                    handleFiltersChange({});
                }}
                filterContent={
                    <>
                        {/* Name */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Search by name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Type Name"
                                    value={(pendingFilters as any)?.name || ''}
                                    onChange={(e) => {
                                        setPendingFilters({ ...pendingFilters, name: e.target.value || undefined });
                                        handleFiltersChange({ ...pendingFilters, name: e.target.value || undefined });
                                    }}
                                />
                            </Form.Group>
                        </Col>

                        {/* Extension */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Search by extension</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Type Extension"
                                    value={(pendingFilters as any)?.extension || ''}
                                    onChange={(e) => {
                                        setPendingFilters({ ...pendingFilters, extension: e.target.value || undefined });
                                        handleFiltersChange({ ...pendingFilters, extension: e.target.value || undefined });
                                    }}
                                />
                            </Form.Group>
                        </Col>

                        {/* Role */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Search by rank</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Type Role"
                                    value={(pendingFilters as any)?.role || ''}
                                    onChange={(e) => {
                                        setPendingFilters({ ...pendingFilters, role: e.target.value || undefined });
                                        handleFiltersChange({ ...pendingFilters, role: e.target.value || undefined });
                                    }}
                                />
                            </Form.Group>
                        </Col>

                        {/* Group */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Search by group</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Type Group"
                                    value={(pendingFilters as any)?.group || ''}
                                    onChange={(e) => {
                                        setPendingFilters({ ...pendingFilters, group: e.target.value || undefined });
                                        handleFiltersChange({ ...pendingFilters, group: e.target.value || undefined });
                                    }}
                                />
                            </Form.Group>
                        </Col>

                        {/* Department */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Search by department</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Type Department"
                                    value={(pendingFilters as any)?.department || ''}
                                    onChange={(e) => {
                                        setPendingFilters({ ...pendingFilters, department: e.target.value || undefined });
                                        handleFiltersChange({ ...pendingFilters, department: e.target.value || undefined });
                                    }}
                                />
                            </Form.Group>
                        </Col>

                        {/* Company */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Search by company</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Type Company"
                                    value={(pendingFilters as any)?.company || ''}
                                    onChange={(e) => {
                                        setPendingFilters({ ...pendingFilters, company: e.target.value || undefined });
                                        handleFiltersChange({ ...pendingFilters, company: e.target.value || undefined });
                                    }}
                                />
                            </Form.Group>
                        </Col>
                    </>
                }
            />
            
            
            <UsersList
                columns={columns}
                fetchData={fetchUsers}
                customFieldColumns={customFieldColumns}
                currentFilters={currentFilters}
                hasPermission={hasListPermission}
            />

            <Row className="mt-3">
                {/* <UserGrowthChart chartData={growthChart} />
                <DepartmentDistributionChart chartData={departmentChart} /> */}
                <RecentActivities />
            </Row>
        </>
    );
};

export default OverviewTab;

