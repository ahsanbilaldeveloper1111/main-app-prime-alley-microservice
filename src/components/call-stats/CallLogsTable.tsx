import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import GenericListPage from '@components/GenericListPage';
import { Column } from '@components/CustomDataTable';

interface Summary {
  total_calls: number;
  answered_calls: number;
  unanswered_calls: number;
  total_cost: number;
  total_duration: number;
  avg_duration: number;
  avg_ring_time: number;
}

interface CallLogsTableProps {
  columns: Column[];
  fetchCallLogs: (page?: number, perPage?: number, search?: string) => Promise<any>;
  currentFilters: Record<string, any>;
  refreshKey: number;
  summary: Summary;
  dataLoaded: boolean;
}

const CallLogsTable: React.FC<CallLogsTableProps> = ({
  columns,
  fetchCallLogs,
  currentFilters,
  refreshKey,
  summary,
  dataLoaded
}) => {
  const { data: session } = useSession();

  if (!session?.user?.permissions?.includes('list-call-logs')) {
    return null;
  }

  if (!dataLoaded) {
    // Loading state for the list
    return (
      <Row>
        <Col md={12}>
          <div className="card report-shadow">
            <div className="card-body">
              <h5 className="card-title">Call Logs</h5>
              <div className="d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span className="ms-2">Loading call logs...</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    );
  }

  if (dataLoaded && summary.total_calls === 0) {
    // Empty state when no data is available
    return (
      <Row>
        <Col md={12}>
          <div className="card report-shadow">
            <div className="card-body">
              <h5 className="card-title">Call Logs</h5>
              <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '200px' }}>
                <i className="fa fa-list fa-3x text-muted mb-3"></i>
                <h6 className="text-muted mb-2">No Call Logs Available</h6>
                <p className="text-muted mb-0">No call logs found for the selected filters and date range.</p>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    );
  }

  // Normal GenericListPage when data is available
  return (
    <GenericListPage
      columns={columns}
      fetchData={fetchCallLogs}
      title="Call Logs"
      searchPlaceholder="Search call stats..."
      defaultPageSize={15}
      filters={currentFilters}
      refreshKey={refreshKey}
      key={refreshKey} 
      search={false}
      tableStyle='table-style-2'
    />
  );
};

export default CallLogsTable;
