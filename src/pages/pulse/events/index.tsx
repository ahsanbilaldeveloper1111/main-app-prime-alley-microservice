import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableAction, TableColumn, ToolbarConfig, TabConfig } from '@components/GenericTable';
import { acknowledgeEvents, getEvents, ZabbixEventRow } from '@utils/zabbix';
import { Button, Modal, Form, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';
import AppSelect from '@components/AppSelect';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

type ValueOption = { value: number; label: string };
const VALUE_OPTIONS: ValueOption[] = [
  { value: 1, label: 'Problems' },
  { value: 0, label: 'Recovery' },
];

type AckActionOption = { value: 1 | 2 | 4 | 6; label: string };
const ACK_ACTION_OPTIONS: AckActionOption[] = [
  { value: 1, label: 'Close' },
  { value: 2, label: 'Acknowledge' },
  { value: 4, label: 'Message' },
  { value: 6, label: 'Acknowledge + Message' },
];

const NetopsEvents = () => {
  const [events, setEvents] = useState<ZabbixEventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedValue, setSelectedValue] = useState<ValueOption>(VALUE_OPTIONS[0]);
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [ackTarget, setAckTarget] = useState<ZabbixEventRow | null>(null);
  const [ackAction, setAckAction] = useState<AckActionOption>(ACK_ACTION_OPTIONS[3]);
  const [ackMessage, setAckMessage] = useState('');
  const [ackSaving, setAckSaving] = useState(false);
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 25,
    returned: 0,
    has_more: false,
    pageSizeOptions: [10, 15, 25, 50, 100] as number[],
  });

  const fetchEvents = useCallback(async (offset: number, limit: number, value: number, searchTerm?: string) => {
    setLoading(true);
    try {
      const response = await getEvents({
        offset,
        limit,
        value,
        ...(searchTerm?.trim() ? { search: searchTerm.trim() } : {}),
      });
      setEvents(response.events ?? []);
      setPagination((prev) => ({
        ...prev,
        offset: response.offset,
        limit: response.limit,
        returned: response.returned,
        has_more: response.has_more,
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch events');
      setEvents([]);
      setPagination((prev) => ({ ...prev, offset: 0, returned: 0, has_more: false }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(0, pagination.limit, selectedValue.value, search);
  }, [fetchEvents, pagination.limit, search, selectedValue.value]);

  const handleSearch = () => fetchEvents(0, pagination.limit, selectedValue.value, search);
  const handleRefresh = () => fetchEvents(0, pagination.limit, selectedValue.value, search);

  const handleValueChangeRaw = useCallback((opt: any) => {
    const next = (opt ?? VALUE_OPTIONS[0]) as ValueOption;
    setSelectedValue(next);
    fetchEvents(0, pagination.limit, next.value, search);
  }, [fetchEvents, pagination.limit, search]);

  const handleAckActionChangeRaw = useCallback((opt: any) => {
    setAckAction((opt ?? ACK_ACTION_OPTIONS[3]) as AckActionOption);
  }, []);

  const computedTotalRows =
    pagination.has_more ? pagination.offset + pagination.limit + 1 : pagination.offset + events.length;

  const badgeVariantForSeverityClass = (severityClass?: string) => {
    const s = (severityClass ?? '').toLowerCase();
    if (s === 'danger' || s === 'error' || s === 'critical') return 'danger';
    if (s === 'warning') return 'warning';
    if (s === 'success' || s === 'ok') return 'success';
    if (s === 'info') return 'info';
    if (s === 'primary') return 'primary';
    return 'secondary';
  };

  const tableColumns: TableColumn<ZabbixEventRow>[] = [
    {
      key: 'time',
      label: 'Time',
      sortable: true,
      render: (row) => <span>{row.time ?? '-'}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (row) => <span>{row.customer ?? '-'}</span>,
    },
    {
      key: 'device',
      label: 'Device',
      sortable: true,
      render: (row) => {
        const host = row.hosts?.[0];
        if (host?.hostid) {
          return (
            <Link href={`/pulse/hosts/${host.hostid}`} className="badge bg-warning text-dark">
              {host.host ?? host.hostid}
            </Link>
          );
        }
        return <span>{host?.host ?? row.host_names?.[0] ?? '-'}</span>;
      },
    },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (row) => (
        <Badge
          bg={badgeVariantForSeverityClass(row.severity_class)}
          text={row.severity_class?.toLowerCase() === 'warning' ? 'dark' : undefined}
          className="text-capitalize"
        >
          {row.severity ?? '-'}
        </Badge>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (row) => <span className="text-capitalize">{row.type ?? '-'}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (row) => <span>{row.description ?? '-'}</span>,
    },
    {
      key: 'acknowledged',
      label: 'Acknowledged',
      sortable: true,
      render: (row) =>
        row.acknowledged ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>,
    },
  ];

  const tableActions: TableAction<ZabbixEventRow>[] = [
    {
      label: 'Acknowledge',
      icon: <CheckCircle2 size={16} />,
      onClick: (row) => {
        setAckTarget(row);
        setAckAction(ACK_ACTION_OPTIONS[3]); // 6 = ack + message
        setAckMessage('');
        setAckModalOpen(true);
      },
    },
  ];

  const eventTabs: TabConfig[] = useMemo(
    () => [
      {
        id: 'events',
        label: 'Events',
        count: computedTotalRows,
        removable: false,
      },
    ],
    [computedTotalRows]
  );

  const eventsToolbarConfig: ToolbarConfig = useMemo(
    () => ({
      showSearch: true,
      searchValue: search,
      searchPlaceholder: 'Search events...',
      onSearchChange: setSearch,
      onSearch: handleSearch,
      showTabs: true,
      tabs: eventTabs,
      activeTab: 'events',
      onTabChange: () => {},
      showTableViewDropdown: false,
      customActions: (
        <div className="d-flex align-items-center gap-2 flex-wrap events-toolbar-buttons">
          
          <button className="events-btn" onClick={handleRefresh} disabled={loading}>
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      ),
      rightActions: (
        <div className="events-filter-select" style={{ minWidth: '220px', maxWidth: '260px' }}>
          <AppSelect<ValueOption>
            instanceId="pulse-events-value"
            classNamePrefix="events-select"
            options={VALUE_OPTIONS}
            value={selectedValue}
            onChange={handleValueChangeRaw}
          />
        </div>
      ),
    }),
    [eventTabs, handleRefresh, handleSearch, handleValueChangeRaw, loading, search, selectedValue]
  );

  const submitAcknowledge = async () => {
    if (!ackTarget?.eventid) return;
    const action = ackAction.value;
    const messageRequired = action === 4 || action === 6;
    const message = ackMessage.trim();
    if (messageRequired && !message) {
      toast.error('Message is required for the selected action');
      return;
    }
    setAckSaving(true);
    try {
      await acknowledgeEvents({
        eventids: [ackTarget.eventid],
        action,
        ...(message ? { message } : {}),
      });
      toast.success('Event updated');
      setAckModalOpen(false);
      setAckTarget(null);
      fetchEvents(pagination.offset, pagination.limit, selectedValue.value, search);
    } catch (error) {
      console.error('Error acknowledging event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to acknowledge event');
    } finally {
      setAckSaving(false);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Events" />

      <div
        className="pulse-events-page"
        style={{
          display: 'flex',
          gap: '0',
          height: 'calc(100vh)',
          overflow: 'hidden',
        }}
      >
        <div className="events-table-pane" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <GenericTable<ZabbixEventRow>
            data={events}
            columns={tableColumns}
            actions={tableActions}
            showActions
            actionsLabel="Actions"
            loading={loading}
            emptyMessage="No events found."
            loadingMessage="Loading events..."
            pagination={{
              currentPage: pagination.limit > 0 ? Math.floor(pagination.offset / pagination.limit) + 1 : 1,
              rowsPerPage: pagination.limit,
              totalRows: computedTotalRows,
              pageSizeOptions: pagination.pageSizeOptions,
            }}
            onPaginationChange={(page, rowsPerPage) => {
              fetchEvents((page - 1) * rowsPerPage, rowsPerPage, selectedValue.value, search);
            }}
            sortable={true}
            hover={true}
            striped={false}
            uniqueKey="eventid"
            showToolbar={true}
            showToolbarActions={false}
            toolbar={eventsToolbarConfig}
            fixedHeight={true}
            maxHeight="calc(100vh - 295px)"
          />
        </div>
      </div>

      <Modal
        show={ackModalOpen}
        onHide={() => {
          if (ackSaving) return;
          setAckModalOpen(false);
          setAckTarget(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Acknowledge Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2">
            <div className="text-muted" style={{ fontSize: 13 }}>
              Event ID: <strong>{ackTarget?.eventid ?? '-'}</strong>
            </div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              Customer: <strong>{ackTarget?.customer ?? '-'}</strong>
            </div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              Description: <strong>{ackTarget?.description ?? '-'}</strong>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Action</Form.Label>
            <AppSelect<AckActionOption>
              instanceId="events-ack-action"
              options={ACK_ACTION_OPTIONS}
              value={ackAction}
              isSearchable={false}
              onChange={handleAckActionChangeRaw}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={ackMessage}
              onChange={(e) => setAckMessage(e.target.value)}
              placeholder="Acknowledged and investigating"
              disabled={ackSaving}
            />
            <small className="text-muted">
              Required for actions: <strong>Message</strong> and <strong>Acknowledge + Message</strong>.
            </small>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setAckModalOpen(false);
              setAckTarget(null);
            }}
            disabled={ackSaving}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={submitAcknowledge} disabled={ackSaving}>
            {ackSaving ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner size="sm" animation="border" /> Saving...
              </span>
            ) : (
              'Submit'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx global>{`
        .pulse-events-page .events-btn {
          padding: 9px 13px;
          background-color: rgb(0, 0, 0);
          color: rgb(255, 255, 255);
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          line-height: 1;
        }

        .pulse-events-page .events-btn:hover,
        .pulse-events-page .events-btn:focus {
          background-color: rgb(0, 0, 0);
          color: rgb(255, 255, 255);
          opacity: 0.92;
        }

        .pulse-events-page .events-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pulse-events-page .events-filter-select {
          min-height: 40px;
        }

        .pulse-events-page .events-select__control {
          min-height: 40px;
          height: 40px;
          border-radius: 4px;
        }

        .pulse-events-page .events-select__value-container {
          min-height: 40px;
          padding: 0 10px;
          font-size: 12px;
        }

        .pulse-events-page .events-select__indicators {
          min-height: 40px;
        }

        .pulse-events-page .generic-table-container,
        .pulse-events-page .generic-table-card,
        .pulse-events-page .gt-toolbar-container,
        .pulse-events-page .gt-toolbar-main,
        .pulse-events-page .gt-toolbar-tabs-section {
          overflow: visible;
        }

        .pulse-events-page .gt-toolbar-container {
          position: relative;
          z-index: 20;
        }

        .pulse-events-page .events-select__menu {
          z-index: 30;
        }

        .pulse-events-page .events-table-pane {
          min-height: 0;
        }

        .pulse-events-page .events-table-pane .generic-table-responsive.fixed-height-table {
          min-height: 0;
        }
      `}</style>
    </React.Fragment>
  );
};

NetopsEvents.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default NetopsEvents;
