import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import Layout from '@layout/index';
import '@assets/scss/datatable-style.scss';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Row, Col } from 'react-bootstrap';
import { Column } from '@components/CustomDataTable';
import { ListGsmInbox,MarkAsRead } from '@utils/GsmManagement';
import GsmInboxFilter from '@components/filters/GsmInboxFilter';
import moment from 'moment';
import '@assets/scss/common.scss';
import { useSession } from 'next-auth/react';

import '@assets/scss/gsm-inbox.scss';
import { toast } from 'react-toastify';
import { GlobalDateTimeFormat } from '@utils/Helper';

const GsmInbox = () => {
  const { data: session, status } = useSession();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<{[key: string]: any}>({});
  const [readItems, setReadItems] = useState<Set<number>>(new Set());

  const columns: Column[] = useMemo(
    () => [
      ...(session?.user?.is_admin === "1" ? [
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
      ] : []),
      
      {
        key: "mobile_number",
        name: "Receiver Number",
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


...(session?.user?.is_admin === "1" ? [
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
] : []),
      
      {
        key: "text",
        name: "Message Body",
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
    fetchGsmInbox(currentPage, perPage, "");
  }, [memoizedFilters, currentPage, perPage, refreshKey]);

  const fetchGsmInbox = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      const response = await ListGsmInbox({
        page,
        perPage,
        search: "",
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
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const handleCopyMessage = useCallback((text: string) => {
    console.log('Copy message', text);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        //toast.success('Message copied to clipboard');
      }).catch(() => {
        //toast.error('Failed to copy message');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Message copied to clipboard');
    }
  }, []);

  const handleMarkAsRead = useCallback(async (id: number) => {
    console.log('Mark as read:', id);
    const ids = [id.toString()];
    const response = await MarkAsRead(ids);
    if(response){
      setReadItems(prev => new Set(prev).add(id));
      toast.success('Message marked as read');
      setRefreshKey(prev => prev + 1);
    }else{
      toast.error('Failed to mark message as read');
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (gsmInbox?.last_page && currentPage < gsmInbox.last_page) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, gsmInbox?.last_page]);


  return (
    <>
      <BreadcrumbItem
        mainTitle="Text Messages"
        mainLink="/communications/text-messages"
        subTitle="Text Messages"
      />
      
      <Row className="mb-3 align-items-center justify-content-center">
        <Col md={10}>
        <Row className="mb-3 page-header-title style-2">
        <Col md={4}>
          
            <h2 className="mb-0">
              Text Messages
            </h2>
          
        </Col>
        <Col md={8} className="d-flex justify-content-end">
                      
                    <div className="action-buttons">
                      <>
                      {session?.user?.permissions?.includes('filters-gsm-inbox') && (
                        <GsmInboxFilter onFiltersChange={handleFiltersChange} showExport={false} />
                      )}
                      </>
                        
                        
                        
                         
                    </div>



                    </Col>
      </Row>

      <Row>
        <Col md={12}>
        <div className="inbox-analytics">
            <div className="analytics-grid">
                <div className="analytics-item">
                    <div className="analytics-item-value" id="total-messages-count">{gsmInbox?.total || 0}</div>
                    <div className="analytics-item-label">Total Messages</div>
                </div>
            </div>
            <div className="analytics-note">
                Total messages in the system.
            </div>
        </div>
        </Col>
      </Row>

{session?.user?.permissions?.includes('list-gsm-inbox') && (
     <>
      {gsmInbox?.data?.length > 0 ? (
        <Row>
          <Col md={12}>
          
          {session?.user?.is_admin === "1" ? (
            <div className="inbox-list">
            {gsmInbox?.data?.map((item: any) => (
              <div className="message-card new" data-sender={item.sender} data-receiver={item.receiver} data-smsc={item.smsc} data-imsi={item.imsi} data-full-message={item.full_message} data-timestamp={item.timestamp} data-status={item.status} style={{display: 'flex'}}>
              {item.is_read === "0" && !readItems.has(item.id) && (
                <div className="new-indicator-wrapper" onClick={() => handleMarkAsRead(item.id)} style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'absolute', top: '10px', right: '15px', zIndex: 10}}>
                  <span className="new-indicator" title="Mark as read" style={{position: 'relative', top: 'auto', right: 'auto', width: '10px', height: '10px', backgroundColor: '#0d6efd', borderRadius: '50%', boxShadow: '0 0 0 3px rgba(13, 110, 253, 0.2)'}}></span>
                  <span className="new-indicator-text" style={{fontSize: '12px', color: '#0d6efd', fontWeight: '500'}}>Mark as read</span>
                </div>
              )}
              <div className="message-content" onClick={() => {
                setSelectedMessage(item);
                setShowDetailsModal(true);
              }}>
                  
                  <div className="message-card-header">
                      <div className="sender-info">
                          <span className="sender-name">Message from {item?.number}</span>
                          <span className="label-chip">
                              <span className="port-status-dot active"></span> Port {item?.port?.port_number}
                          </span>
                      </div>
                      <div className="meta-info">
                          <span className="meta-item"><i className="fas fa-mobile-alt"></i> GSM: {item?.gsm?.name}</span>
                          <span className="meta-item timestamp"><i className="fas fa-clock"></i> {moment(item?.received_at).fromNow()}</span>
                      </div>
                  </div>
                  <p className="message-body">
                      <span className="message-preview">{item?.text}</span>
                  </p>
                  <div className="details-grid">
                      <div className="detail-item">
                          <strong>Receiver Number</strong>
                          <span>{item?.port?.mobile_number?.length > 0 ? item?.port?.mobile_number : 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                          <strong>SMSC</strong>
                          <span>{item?.smsc?.length > 0 ? item?.smsc : 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                          <strong>IMSI</strong>
                          <span>{item?.imsi || 'N/A'}</span>
                      </div>
                  </div>
              </div>
          </div>
            ))}
          </div>
          ) : (
            <div className="inbox-list">
            {gsmInbox?.data?.map((item: any) => (
              <div className="message-card new" data-sender={item.sender} data-receiver={item.receiver} data-smsc={item.smsc} data-imsi={item.imsi} data-full-message={item.full_message} data-timestamp={item.timestamp} data-status={item.status} style={{display: 'flex'}}>
              {item.is_read === "0" && !readItems.has(item.id) && (
                <div className="new-indicator-wrapper" onClick={() => handleMarkAsRead(item.id)} style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'absolute', top: '10px', right: '15px', zIndex: 10}}>
                  <span className="new-indicator" title="Mark as read" style={{position: 'relative', top: 'auto', right: 'auto', width: '10px', height: '10px', backgroundColor: '#0d6efd', borderRadius: '50%', boxShadow: '0 0 0 3px rgba(13, 110, 253, 0.2)'}}></span>
                  <span className="new-indicator-text" style={{fontSize: '12px', color: '#0d6efd', fontWeight: '500'}}>Mark as read</span>
                </div>
              )}
              <div className="message-content" onClick={() => {
                setSelectedMessage(item);
                setShowDetailsModal(true);
              }}>
                  
                  <div className="message-card-header">
                      <div className="sender-info">
                          <span className="sender-name">Sender Number: {item?.number}</span>
                          {/* <span className="label-chip">
                              <span className="port-status-dot active"></span> Receiver Number: {item?.port?.mobile_number}
                          </span> */}
                      </div>
                      <div className="meta-info">
                          <span className="meta-item timestamp text-uppercase"><i className="fas fa-clock"></i> Date Time : {item?.received_at ? moment(item?.received_at).format(GlobalDateTimeFormat) : 'N/A'}</span>
                      </div>
                  </div>
                  <p className="message-body">
                      <span className="message-preview">{item?.text}</span>
                  </p>
                  <div className="details-grid">
                      <div className="detail-item">
                          <strong>Receiver Number</strong>
                          <span>{item?.port?.mobile_number?.length > 0 ? item?.port?.mobile_number : 'N/A'}</span>
                      </div>
                      
                  </div>
              </div>
          </div>
            ))}
          </div>
          )}
          
          </Col>
        </Row>
      ) : (
        <div className="text-center p-4 border rounded">
          <p className="mb-0">No data found</p>
        </div>
      )}
     </>
      )}


        </Col>
      </Row>
      {session?.user?.permissions?.includes('list-gsm-inbox') && (
      <>
     
      {showDetailsModal && selectedMessage && (
        <div id="detail-modal" className="modal" style={{display: 'flex'}}>
        <div className="modal-content">
            <span className="close-btn" id="detail-close-btn" onClick={() => setShowDetailsModal(false)}><i className="fas fa-times"></i></span>
            <h2 id="detail-sender">Message from {selectedMessage?.number || 'N/A'}</h2>
            <div id="detail-meta" className="meta-info">
                    <span className="meta-item"><i className="fas fa-clock"></i> {selectedMessage?.received_at ? moment(selectedMessage.received_at).fromNow() : 'N/A'}</span>

                    {/* <span className="meta-item"><i className="fas fa-mobile-alt"></i> GSM: {selectedMessage?.gsm?.name || 'N/A'}</span>
                    <span className="label-chip">Port {selectedMessage?.port?.port_number || 'N/A'}</span> */}
                </div>
            <div id="detail-body" className="modal-message-body">{selectedMessage?.text || 'N/A'}</div>
            <button className="copy-message-btn" style={{marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: 'none', borderRadius: '8px', backgroundColor: 'var(--primary-accent)', color: 'white', cursor: 'pointer', transition: 'background-color 0.2s'}} onClick={() => handleCopyMessage(selectedMessage?.text || '')}>
                <i className="fas fa-copy"></i> Copy Message
            </button>
            <div id="detail-grid" className="details-grid">
                    <div className="detail-item">
                        <strong>Sender Number</strong>
                        <span>{selectedMessage?.number || 'N/A'}</span>
                        <button className="copy-btn" data-text-to-copy={selectedMessage?.number || ''}><i className="fas fa-copy" onClick={() => handleCopyMessage(selectedMessage?.number || '')}></i></button>
                    </div>
                    <div className="detail-item">
                        <strong>Receiver Number</strong>
                        <span>{selectedMessage?.port?.mobile_number || 'N/A'}</span>
                        <button className="copy-btn" data-text-to-copy={selectedMessage?.port?.mobile_number || ''}><i className="fas fa-copy" onClick={() => handleCopyMessage(selectedMessage?.port?.mobile_number || '')}></i></button>
                    </div>
                    {/* <div className="detail-item">
                        <strong>SMSC</strong>
                        <span>{selectedMessage?.smsc || 'N/A'}</span>
                    </div> */}
                    {/* <div className="detail-item">
                        <strong>IMSI</strong>
                        <span>{selectedMessage?.imsi || 'N/A'}</span>
                    </div> */}
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
      )}

      

    </>
  );
};

GsmInbox.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmInbox;