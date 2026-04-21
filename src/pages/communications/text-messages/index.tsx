import React, { ReactElement, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Layout from '@layout/index';
import '@assets/scss/datatable-style.scss';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Modal, Button } from 'react-bootstrap';
import GenericTable, { TableColumn, TableAction } from '@components/GenericTable';
import { ListGsmInbox, MarkAsRead } from '@utils/GsmManagement';
import moment from 'moment';
import '@assets/scss/common.scss';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { GlobalDateTimeFormat } from '@utils/Helper';

interface GsmInboxRow {
  id: number;
  number: string;
  text: string;
  received_at: string;
  created_at: string;
  is_read: string;
  smsc?: string;
  imsi?: string;
  gsm?: { name: string };
  port?: { port_number: string; mobile_number: string };
  [key: string]: any;
}

const GsmInbox = () => {
  const { data: session } = useSession();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const currentFiltersRef = useRef<Record<string, any>>({});
  const [readItems, setReadItems] = useState<Set<number>>(new Set());
  const [tableData, setTableData] = useState<GsmInboxRow[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tablePagination, setTablePagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    totalRows: 0,
    pageSizeOptions: [10, 15, 25, 50] as number[],
  });
  const rowsPerPageRef = useRef(15);
  const isFetchingRef = useRef(false);
  const lastFetchParamsRef = useRef('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<GsmInboxRow | null>(null);

  const fetchGsmInbox = useCallback(async (page = 1, perPage = 15, search = '') => {
    const paramsKey = `${page}-${perPage}-${search}-${JSON.stringify(currentFiltersRef.current)}`;
    if (isFetchingRef.current && lastFetchParamsRef.current === paramsKey) return;
    isFetchingRef.current = true;
    lastFetchParamsRef.current = paramsKey;
    setTableLoading(true);
    try {
      const response = await ListGsmInbox({ page, perPage, search, filters: currentFiltersRef.current });
      const data: GsmInboxRow[] = Array.isArray(response?.data) ? response.data : [];
      setTableData(data);
      const total = response?.total ?? data.length;
      setTablePagination(prev => ({
        ...prev,
        currentPage: response?.current_page ?? page,
        rowsPerPage: response?.per_page ?? perPage,
        totalRows: Number(total) || 0,
      }));
    } finally {
      setTableLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  rowsPerPageRef.current = tablePagination.rowsPerPage;

  useEffect(() => {
    setTablePagination(prev => ({ ...prev, currentPage: 1 }));
    fetchGsmInbox(1, rowsPerPageRef.current, '');
  }, [refreshKey, fetchGsmInbox]);

  const handleCopyMessage = useCallback((text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => toast.success('Copied to clipboard'))
        .catch(() => toast.error('Failed to copy message'));
    } else {
      globalThis.prompt('Copy message:', text);
    }
  }, []);

  const handleMarkAsRead = useCallback(async (id: number) => {
    const response = await MarkAsRead([id.toString()]);
    if (response) {
      setReadItems(prev => new Set(prev).add(id));
      toast.success('Message marked as read');
      setRefreshKey(prev => prev + 1);
    } else {
      toast.error('Failed to mark message as read');
    }
  }, []);

  const isUnread = useCallback((row: GsmInboxRow) => {
    return row.is_read === '0' && !readItems.has(row.id);
  }, [readItems]);

  const tableColumns = useMemo((): TableColumn<GsmInboxRow>[] => {
    const isAdmin = session?.user?.is_admin === '1';

    const adminLeadingCols: TableColumn<GsmInboxRow>[] = isAdmin ? [
      {
        key: 'id',
        label: 'ID',
        sortable: true,
        render: (row) => <span style={{ color: '#141414', fontWeight: 100 }}>#{row.id}</span>,
      },
      {
        key: 'gsm_name',
        label: 'GSM Name',
        sortable: false,
        render: (row) => (
          <span className="badge bg-info bg-opacity-10 text-info fw-normal px-3">
            {row.gsm?.name || 'Unknown'}
          </span>
        ),
      },
      {
        key: 'port',
        label: 'Port',
        sortable: false,
        render: (row) => (
          <span className="badge bg-secondary bg-opacity-10 text-secondary fw-normal px-3">
            Port {row.port?.port_number || 'N/A'}
          </span>
        ),
      },
    ] : [];

    const adminTrailingCols: TableColumn<GsmInboxRow>[] = isAdmin ? [
      {
        key: 'smsc',
        label: 'SMSC',
        sortable: false,
        render: (row) => <span className="text-muted small">{row.smsc || 'N/A'}</span>,
      },
      {
        key: 'imsi',
        label: 'IMSI',
        sortable: false,
        render: (row) => <span className="font-monospace small text-info">{row.imsi || 'N/A'}</span>,
      },
    ] : [];

    return [
      ...adminLeadingCols,
      {
        key: 'number',
        label: 'Sender',
        sortable: true,
        render: (row) => (
          <div className="d-flex align-items-center gap-2">
            {isUnread(row) && (
              <span
                aria-label="Unread"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#0d6efd',
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
            )}
            <span style={{ color: '#141414', fontWeight: 100 }}>
              {row.number || 'N/A'}
            </span>
          </div>
        ),
      },
      {
        key: 'receiver',
        label: 'Receiver',
        sortable: false,
        render: (row) => (
          <span style={{ color: '#141414', fontWeight: 100 }}>{row.port?.mobile_number || 'N/A'}</span>
        ),
      },
      ...adminTrailingCols,
      {
        key: 'text',
        label: 'Message',
        sortable: false,
        render: (row) => {
          const message = row.text || '';
          return (
            <div
              className="gsm-message-cell"
              title={message}
              style={{
                width: '100%',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: '1.5',
                color: '#141414',
                fontWeight: 100,
              }}
            >
              {isUnread(row) && (
                <span className="badge bg-primary bg-opacity-10 text-primary fw-normal me-2 small">New</span>
              )}
              {message || 'N/A'}
            </div>
          );
        },
      },
      {
        key: 'received_at',
        label: 'Received',
        sortable: true,
        render: (row) => (
          <div>
            <div className="small">{row.received_at ? moment(row.received_at).format('DD/MM/YYYY HH:mm') : 'N/A'}</div>
            {row.received_at && <small className="text-muted">{moment(row.received_at).fromNow()}</small>}
          </div>
        ),
      },
    ];
  }, [session?.user?.is_admin, isUnread]);

  const rowActions = useMemo((): TableAction<GsmInboxRow>[] => [
    {
      label: 'Actions',
      render: (row) => (
        <div className="d-flex gap-2 action-box">
          <button
            type="button"
            className="btn btn-link p-0 text-secondary border-0"
            onClick={(e) => { e.stopPropagation(); handleCopyMessage(row.text || ''); }}
            aria-label="Copy message"
            title="Copy message"
          >
            <i className="ph-duotone ph-copy" style={{ fontSize: '1rem' }} aria-hidden="true" />
          </button>
          {isUnread(row) && (
            <button
              type="button"
              className="btn btn-link p-0 text-success border-0"
              onClick={(e) => { e.stopPropagation(); handleMarkAsRead(row.id); }}
              aria-label="Mark as read"
              title="Mark as read"
            >
              <i className="ph-duotone ph-check-circle" style={{ fontSize: '1rem' }} aria-hidden="true" />
            </button>
          )}
        </div>
      ),
    },
  ], [handleCopyMessage, handleMarkAsRead, isUnread]);

  const applyFilters = useCallback((nextFilters: Record<string, any>) => {
    setCurrentFilters(nextFilters);
    currentFiltersRef.current = nextFilters;
    setRefreshKey(prev => prev + 1);
  }, []);

  const getReadStatusActiveLabel = (readStatus: unknown): string | undefined => {
    if (readStatus === '0') return 'Unread';
    if (readStatus === '1') return 'Read';
    return undefined;
  };

  const tableToolbar = useMemo(() => ({
    showTabs: true,
    tabs: [
      {
        id: 'text-messages-title',
        label: 'Text Messages',
        removable: false,
      },
    ],
    activeTab: 'text-messages-title',
    onTabChange: () => {},
    showSearch: false,
    showFiltersButton: false,
    showFilterPills: true,
    showMoreFiltersButton: false,
    filterPills: [
      {
        id: 'is_read',
        label: 'Status',
        showDropdown: true,
        active: currentFilters.is_read !== undefined && currentFilters.is_read !== '',
        activeLabel: getReadStatusActiveLabel(currentFilters.is_read),
        onClear: () => applyFilters({ ...currentFilters, is_read: '' }),
        dropdownOptions: [
          { label: 'Unread', value: '0', onClick: () => applyFilters({ ...currentFilters, is_read: '0' }) },
          { label: 'Read', value: '1', onClick: () => applyFilters({ ...currentFilters, is_read: '1' }) },
          { label: 'All', value: '', onClick: () => applyFilters({ ...currentFilters, is_read: '' }) },
        ],
      },
    ],
  }), [currentFilters, applyFilters]);

  return (
    <React.Fragment>
      <style jsx global>{`
        .text-messages-page,
        .text-messages-page .generic-table-th,
        .text-messages-page .generic-table-td,
        .text-messages-page .page-header-title h2,
        .text-messages-page .modal-title,
        .text-messages-page .btn,
        .text-messages-page small,
        .text-messages-page .small,
        .text-messages-page .badge {
          color: #141414 !important;
          font-weight: 100 !important;
        }
          div.pagination-buttons .btn.btn-primary {
            color: #ffffff !important;
          }
            .btn.show {
            color: #ffffff !important;
            }
        .text-messages-page .generic-table-responsive { border: none !important; }
        .text-messages-page thead,
        .text-messages-page tbody,
        .text-messages-page tfoot,
        .text-messages-page tr,
        .text-messages-page td,
        .text-messages-page th { border: 1px solid #DBE0E5 !important; }
        .text-messages-page .gt-toolbar-tabs-section .gt-tab-button { margin-left: 12px; }

        /* Keep readable column widths and allow horizontal scroll instead of squeezing text */
        .text-messages-page .generic-table { min-width: 1080px; }
        .text-messages-page .gsm-message-cell { min-width: 420px; max-width: 720px; }

        @media (max-width: 1200px) {
          .text-messages-page .generic-table { min-width: 980px; }
          .text-messages-page .gsm-message-cell { min-width: 360px; }
        }

        @media (max-width: 992px) {
          .text-messages-page .generic-table { min-width: 900px; }
          .text-messages-page .gsm-message-cell { min-width: 320px; }
        }
      `}</style>

      <div className="text-messages-page">
      <BreadcrumbItem
        mainTitle=""
        mainLink=""
        subTitle="Text Messages"
      />

      {session?.user?.permissions?.includes('list-gsm-inbox') && (
        <GenericTable<GsmInboxRow>
          data={tableData}
          columns={tableColumns}
          actions={rowActions}
          actionsLabel="Actions"
          loading={tableLoading}
          emptyMessage="No text messages found."
          loadingMessage="Loading messages..."
          showToolbar={true}
          toolbar={tableToolbar}
          showToolbarActions={false}
          pagination={{
            currentPage: tablePagination.currentPage,
            rowsPerPage: tablePagination.rowsPerPage,
            totalRows: tablePagination.totalRows,
            pageSizeOptions: tablePagination.pageSizeOptions,
          }}
          onPaginationChange={(page, rowsPerPage) => {
            setTablePagination(prev => ({ ...prev, currentPage: page, rowsPerPage }));
            fetchGsmInbox(page, rowsPerPage, '');
          }}
          rowClassName={() => ''}
          onRowClick={(row) => {
            setSelectedMessage(row);
            setShowDetailsModal(true);
          }}
          sortable={true}
          hover={true}
          striped={false}
          fixedHeight={true}
          maxHeight="calc(100vh - 320px)"
          uniqueKey="id"
        />
      )}

      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Message from {selectedMessage?.number || 'N/A'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMessage && (
            <>
              <div className="mb-3">
                <small className="text-muted">
                  <i className="ph-duotone ph-clock me-1" aria-hidden="true" />
                  {selectedMessage.received_at ? moment(selectedMessage.received_at).fromNow() : ''}
                </small>
              </div>
              <div
                className="p-3 bg-light rounded mb-4"
                style={{ lineHeight: '1.7', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
              >
                {selectedMessage.text || 'N/A'}
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <small className="text-muted d-block mb-1">Sender Number</small>
                  <div style={{ color: '#141414', fontWeight: 100 }}>{selectedMessage.number || 'N/A'}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block mb-1">Receiver Number</small>
                  <div style={{ color: '#141414', fontWeight: 100 }}>{selectedMessage.port?.mobile_number || 'N/A'}</div>
                </div>
                {selectedMessage.received_at && (
                  <div className="col-12">
                    <small className="text-muted d-block mb-1">Received At</small>
                    <div style={{ color: '#141414', fontWeight: 100 }}>{moment(selectedMessage.received_at).format(GlobalDateTimeFormat)}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => handleCopyMessage(selectedMessage?.text || '')}>
            <i className="ph-duotone ph-copy me-1" aria-hidden="true" />
            {' '}Copy Message
          </Button>
          {selectedMessage && isUnread(selectedMessage) && (
            <Button
              variant="success"
              onClick={() => {
                handleMarkAsRead(selectedMessage.id);
                setShowDetailsModal(false);
              }}
            >
              Mark as Read
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      </div>
    </React.Fragment>
  );
};

GsmInbox.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmInbox;