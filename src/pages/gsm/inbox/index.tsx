import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import Layout from '@layout/index';
import '@assets/scss/datatable-style.scss';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Row, Col } from 'react-bootstrap';
import GenericListPage from '@components/GenericListPage';
import { Column } from '@components/CustomDataTable';
import { ListGsmInbox } from '@utils/GsmManagement';
import GsmInboxFilter from '@components/filters/GsmInboxFilter';
import moment from 'moment';
import '@assets/scss/common.scss';
import '@assets/scss/dashboard-card.scss';
import '@assets/scss/gsm-assign.scss';
import '@assets/scss/gsm-inbox.scss';
import { toast } from 'react-toastify';

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
  const [gsmInbox, setGsmInbox] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(15);

  useEffect(() => {
    fetchGsmInbox(currentPage, perPage);
  }, [memoizedFilters, currentPage, perPage]);

  const fetchGsmInbox = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      const response = await ListGsmInbox({
        page,
        perPage,
        search,
        filters: memoizedFilters,
      });
      console.log('response gsm inbox:', response);
      setGsmInbox(response);
      return response;
    },
    [memoizedFilters]
  );

  const handleFiltersChange = useCallback((filters: any) => {
    console.log('Filters changed:', filters);
    setCurrentFilters(filters);
    // Trigger refresh when filters change
    setRefreshKey(prev => prev + 1);
  }, []);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const handleCopyMessage = useCallback(() => {
    console.log('Copy message');
    const message = 'This is a test message';
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).then(() => {
        toast.success('Message copied to clipboard');
      }).catch(() => {
        toast.error('Failed to copy message');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Message copied to clipboard');
    }
  }, []);

  const handleMarkAsRead = useCallback((id: number) => {
    console.log('Mark as read:', id);
    toast.success('Message marked as read');
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (gsmInbox?.last_page && currentPage < gsmInbox.last_page) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, gsmInbox?.last_page]);

  const [selectedMessageId, setSelectedMessageId] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleDeleteSelected = useCallback(() => {
    console.log('Delete selected messages:', selectedMessageId);
    toast.success(`${selectedMessageId.length} messages deleted`);
    setSelectedMessageId([]);
    setSelectAll(false);
  }, [selectedMessageId]);

  const handleMessageSelect = useCallback((messageId: number, isSelected: boolean) => {
    console.log('Message selected:', messageId, isSelected);
    setSelectedMessageId(prev => {
      if (isSelected) {
        return [...prev, messageId];
      } else {
        return prev.filter(id => id !== messageId);
      }
    });
  }, []);

  const handleSelectAll = useCallback((isSelected: boolean) => {
    console.log('Select all:', isSelected);
    setSelectAll(isSelected);
    if (isSelected) {
      const allIds = gsmInbox?.data?.map((item: any) => item.id) || [];
      setSelectedMessageId(allIds);
    } else {
      setSelectedMessageId([]);
    }
  }, [gsmInbox?.data]);

  // Update select all checkbox when individual selections change
  useEffect(() => {
    if (gsmInbox?.data?.length > 0) {
      const allSelected = gsmInbox.data.every((item: any) => selectedMessageId.includes(item.id));
      setSelectAll(allSelected);
    }
  }, [selectedMessageId, gsmInbox?.data]);

  return (
    <>
      <BreadcrumbItem
        mainTitle="GSM"
        mainLink="/gsm/inbox"
        subTitle="GSM Inbox"
      />
      
      <Row className="mb-3 align-items-center justify-content-center">
        <Col md={10}>
        <Row className="mb-3 page-header-title style-2">
        <Col md={4}>
          
            <h2 className="mb-0">
              GSM Inbox
            </h2>
          
        </Col>
        <Col md={8} className="d-flex justify-content-end">
                      
                    <div className="action-buttons">
                        <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search by number or keyword..."/>
                        </div>
                        <GsmInboxFilter onFiltersChange={handleFiltersChange} showExport={false} />
                        
                        
                         
                    </div>



                    </Col>
      </Row>

      {/* <GenericListPage
        columns={columns}
        fetchData={fetchGsmInbox}
        title="GSM Inbox"
        searchPlaceholder="Search SMS messages..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
        search={true}
        noTableHead={true}
      /> */}


      <Row>
        <Col md={12}>
        <div className="inbox-analytics">
            <div className="analytics-grid">
                <div className="analytics-item">
                    <div className="analytics-item-value" id="total-messages-count">10</div>
                    <div className="analytics-item-label">Total Messages</div>
                </div>
                <div className="analytics-item">
                    <div className="analytics-item-value" id="unread-messages-count">3</div>
                    <div className="analytics-item-label">Unread</div>
                </div>
            </div>
            <div className="analytics-note">
                Statistics shown are for the last 24 hours. Use the `Filters` option for older data.
            </div>
        </div>
        </Col>
      </Row>


      {gsmInbox?.data?.length > 0 ? (
        <Row>
          <Col md={12}>
          {selectedMessageId.length > 0 && (
                           <div className="mb-1 row">
                             <div className="col-md-12">
                               <div className="alert alert-info d-flex align-items-center justify-content-between selectionRowBox">
                                 <div className="selected-rows d-flex align-items-center gap-3">
                                   <label className="d-flex align-items-center mb-0">
                                     <input 
                                       type="checkbox" 
                                       checked={selectAll}
                                       onChange={(e) => handleSelectAll(e.target.checked)}
                                       className="me-2"
                                     />
                                     Select All
                                   </label>
                                   <strong>{selectedMessageId.length}</strong> Selected
                                 </div>
                                 <div className="btn-group">
                                   <button 
                                     type="button" 
                                     className="btn btn-outline-danger btn-sm"
                                     onClick={handleDeleteSelected}
                                   >
                                     Bulk Delete
                                   </button>
                                 </div>
                               </div>
                             </div>
                           </div>
                         )}
          </Col>
          <Col md={12}>
          <div className="inbox-list">
            {gsmInbox?.data?.map((item: any) => (
              <div className="message-card new" data-sender={item.sender} data-receiver={item.receiver} data-smsc={item.smsc} data-imsi={item.imsi} data-full-message={item.full_message} data-timestamp={item.timestamp} data-status={item.status} style={{display: 'flex'}}>
              <label>
                  <input 
                    type="checkbox" 
                    className="message-checkbox" 
                    checked={selectedMessageId.includes(item.id)}
                    onChange={(e) => handleMessageSelect(item.id, e.target.checked)}
                  />
                  <div className="message-checkbox-container">
                      <i className="fas fa-check"></i>
                  </div>
              </label>
              <span className="new-indicator" onClick={() => handleMarkAsRead(item.id)}></span>
              <div className="message-content" onClick={() => setShowDetailsModal(true)}>
                  
                  <div className="message-card-header">
                      <div className="sender-info">
                          <span className="sender-name">SMS from +97165066400</span>
                          <span className="label-chip">
                              <span className="port-status-dot active"></span> Port 6
                          </span>
                      </div>
                      <div className="meta-info">
                          <span className="meta-item"><i className="fas fa-mobile-alt"></i> GSM: Test</span>
                          <span className="meta-item timestamp"><i className="fas fa-clock"></i> 30 minutes ago</span>
                      </div>
                  </div>
                  <p className="message-body">
                      <span className="message-preview">You MISSED 1 Call(s) from +97165066400, last call: 22/09/2025 11:46:35</span>
                  </p>
                  <div className="details-grid">
                      <div className="detail-item">
                          <strong>Receiver Number</strong>
                          <span>+971547141001</span>
                      </div>
                      <div className="detail-item">
                          <strong>SMSC</strong>
                          <span>+971500186533</span>
                      </div>
                      <div className="detail-item">
                          <strong>IMSI</strong>
                          <span>424821819785925</span>
                      </div>
                  </div>
              </div>
          </div>
            ))}
          </div>
          
          </Col>
        </Row>
      ) : (
        <div className="text-center p-4 border rounded">
          <p className="mb-0">No data found</p>
        </div>
      )}
        </Col>
      </Row>

      {showDetailsModal && (
        <div id="detail-modal" className="modal" style={{display: 'flex'}}>
        <div className="modal-content">
            <span className="close-btn" id="detail-close-btn" onClick={() => setShowDetailsModal(false)}><i className="fas fa-times"></i></span>
            <h2 id="detail-sender">SMS from +1234567890</h2>
            <div id="detail-meta" className="meta-info">
                    <span className="meta-item"><i className="fas fa-clock"></i> 14 hours ago</span>
                    <span className="meta-item"><i className="fas fa-mobile-alt"></i> GSM: Test</span>
                    <span className="label-chip">Port 6</span>
                </div>
            <div id="detail-body" className="modal-message-body">This is a failed test message. It was not sent properly.</div>
            <button className="copy-message-btn" style={{marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: 'none', borderRadius: '8px', backgroundColor: 'var(--primary-accent)', color: 'white', cursor: 'pointer', transition: 'background-color 0.2s'}} onClick={() => handleCopyMessage()}>
                <i className="fas fa-copy"></i> Copy Message
            </button>
            <div id="detail-grid" className="details-grid">
                    <div className="detail-item">
                        <strong>Sender Number</strong>
                        <span>+1234567890</span>
                        <button className="copy-btn" data-text-to-copy="+1234567890"><i className="fas fa-copy" onClick={() => handleCopyMessage()}></i></button>
                    </div>
                    <div className="detail-item">
                        <strong>Receiver Number</strong>
                        <span>+1987654321</span>
                        <button className="copy-btn" data-text-to-copy="+1987654321"><i className="fas fa-copy" onClick={() => handleCopyMessage()}></i></button>
                    </div>
                    <div className="detail-item">
                        <strong>SMSC</strong>
                        <span>+1000000000</span>
                    </div>
                    <div className="detail-item">
                        <strong>IMSI</strong>
                        <span>123456789012345</span>
                    </div>
                </div>
        </div>
    </div>
      )}

      {/* Pagination */}
      {gsmInbox?.data?.length > 0 && gsmInbox?.last_page > 1 && (
        <div className="pagination pb-5">
          <button 
            id="prev-btn" 
            className={currentPage === 1 ? 'disabled' : ''}
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          <span id="page-info">
            Page {currentPage} of {gsmInbox?.last_page}
          </span>
          <button 
            id="next-btn" 
            className={currentPage === gsmInbox?.last_page ? 'disabled' : ''}
            onClick={handleNextPage}
            disabled={currentPage === gsmInbox?.last_page}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

    </>
  );
};

GsmInbox.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmInbox;