import React, { ReactElement, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import '@assets/scss/datatable-style.scss';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Row, Col } from 'react-bootstrap';
import GenericListPage from '@components/GenericListPage';
import { Column } from '@components/CustomDataTable';
import { ListGsmInbox } from '@utils/GsmManagement';
import GsmInboxFilter from '@components/filters/GsmInboxFilter';
import moment from 'moment';

const GsmInbox = () => {
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const columns: Column[] = useMemo(
    () => [
      {
        key: "id",
        name: "ID",
        selector: (row: any) => row.id,
        sortable: true,
        cell: (props: any) => (
          <span className="fw-bold text-primary">#{props.id}</span>
        ),
      },
      {
        key: "gsm_name",
        name: "GSM Name",
        selector: (row: any) => row.gsm?.name,
        sortable: true,
        cell: (props: any) => (
          <span className="badge bg-info">
            {props.gsm?.name || 'Unknown'}
          </span>
        ),
      },
      {
        key: "port",
        name: "Port",
        selector: (row: any) => row.port?.port_number,
        sortable: true,
        cell: (props: any) => (
          <span className="badge bg-secondary">
            Port {props.port?.port_number || 'N/A'}
          </span>
        ),
      },
      {
        key: "mobile_number",
        name: "Mobile Number",
        selector: (row: any) => row.port?.mobile_number,
        sortable: true,
        cell: (props: any) => (
          <span className="text-primary fw-bold">
            {props.port?.mobile_number || 'N/A'}
          </span>
        ),
      },
      {
        key: "sender_number",
        name: "Sender Number",
        selector: (row: any) => row.number,
        sortable: true,
        cell: (props: any) => (
          <span className="text-success fw-bold">
            {props.number || 'N/A'}
          </span>
        ),
      },
      {
        key: "smsc",
        name: "SMSC",
        selector: (row: any) => row.smsc,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">
            {props.smsc || 'N/A'}
          </span>
        ),
      },
      {
        key: "imsi",
        name: "IMSI",
        selector: (row: any) => row.imsi,
        sortable: true,
        cell: (props: any) => (
          <span className="text-info font-monospace">
            {props.imsi || 'N/A'}
          </span>
        ),
      },
      {
        key: "text",
        name: "Message",
        selector: (row: any) => row.text,
        sortable: true,
        cell: (props: any) => {
          const message = props.text || "";
          const truncatedMessage = message.length > 50 
            ? message.substring(0, 50) + "..." 
            : message;
          
          return (
            <div 
              title={message} 
              style={{ 
                maxWidth: '300px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {truncatedMessage}
            </div>
          );
        },
      },
      {
        key: "received_at",
        name: "Received At",
        selector: (row: any) => row.received_at,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div className="text-muted">
              {props.received_at 
                ? moment(props.received_at).format("DD/MM/YYYY HH:mm:ss")
                : 'N/A'
              }
            </div>
            {props.received_at && (
              <small className="text-info">
                {moment(props.received_at).fromNow()}
              </small>
            )}
          </div>
        ),
      },
      {
        key: "created_at",
        name: "Created At",
        selector: (row: any) => row.created_at,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div className="text-muted">
              {moment(props.created_at).format("DD/MM/YYYY HH:mm:ss")}
            </div>
            <small className="text-info">
              {moment(props.created_at).fromNow()}
            </small>
          </div>
        ),
      },
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchGsmInbox = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await ListGsmInbox({
        page,
        perPage,
        search,
        filters: memoizedFilters,
      });
    },
    [memoizedFilters]
  );

  const handleFiltersChange = useCallback((filters: any) => {
    console.log('Filters changed:', filters);
    setCurrentFilters(filters);
    // Trigger refresh when filters change
    setRefreshKey(prev => prev + 1);
  }, []);


  return (
    <>
      <BreadcrumbItem
        mainTitle="GSM"
        mainLink="/gsm/inbox"
        subTitle="GSM Inbox"
      />
      
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              GSM Inbox
              <GsmInboxFilter onFiltersChange={handleFiltersChange} />
            </h2>
          </div>
        </Col>
      </Row>

      <GenericListPage
        columns={columns}
        fetchData={fetchGsmInbox}
        title="GSM Inbox"
        searchPlaceholder="Search SMS messages..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
        search={true}
      />
    </>
  );
};

GsmInbox.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmInbox;