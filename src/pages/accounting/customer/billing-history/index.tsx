import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useEffect,
  useCallback,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { formatNumber } from "@utils/Helper";
import { useState } from 'react';
import { Row, Col, Button, Badge, Card, Form} from 'react-bootstrap';
import { 
  Check,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';

import "@assets/scss/billing.scss";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

import '@assets/scss/datatable-style.scss';
import { GetPayments } from "@utils/accounting";
import GenericListPage from '@components/GenericListPage';
import { useSession } from 'next-auth/react';
import { Column } from "@components/CustomDataTable";
import moment from "moment";
import FormModal from "@pages/partial/FormModal";
import { toast } from "react-toastify";
import ThemeSelect from "@components/ThemeSelect";

const BillingHistory = () => {


  const { data:session, status } = useSession();
   
    const columns: Column[] = [
        { key: 'id', name: 'Payment ID', selector: (row: any) => row.id, sortable: true,
          cell: (row: any) => {
            return <div>
              <p className="">#{row?.id}</p>
            </div>
          }
         },
         { key: 'invoice', name: 'Invoice', selector: (row: any) => row.invoice?.invoice_number, sortable: true,
          cell: (row: any) => {
            return <div>
              <p className="">{row?.invoice?.invoice_number}</p>
            </div>
          }
         },
         { key: 'amount', name: 'Amount', selector: (row: any) => row.amount, sortable: true,
          cell: (row: any) => {
            return <div>
              <p>{row?.currency_code} {formatNumber(row?.amount)}</p>
            </div>
          }
         },
         { key: 'payment_method', name: 'Payment Method', selector: (row: any) => row.payment_method, sortable: true,
          cell: (row: any) => {
            return <div>
              <p className="text-uppercase">{row?.payment_method}</p>
            </div>
          }
         },
        
        { key: 'status', name: 'Status', selector: (row: any) => row.status, sortable: true,
          cell: (row: any) => {
            return <Badge className={`badge text-uppercase bg-${row?.status === 'completed' ? 'success' : row?.status === 'cancelled' ? 'danger' : row?.status === 'failed' ? 'danger' : 'warning'}`}>{row?.status}</Badge>
          }
         },
        { key: 'payment_date', name: 'Date', selector: (row: any) => row.payment_date, sortable: true,
          cell: (row: any) => {
            return <div>
              <p className="text-muted">{moment(row?.payment_date).format('DD-MMM-YYYY')}</p>
            </div>
          }
         },

        
//             {
//                 key: 'Action',
//                 name: 'Actions',
//                 selector: (row: any) => row.id,
//                 sortable: false,
//                 cell: (props: any) => (
                  
// <Button 
// variant="link" 
// size="sm" 
// className="p-2 view-receipt-btn "
// style={{ color: '#0d6efd', fontSize: '0.85rem', textDecoration: 'none' }}

//   onClick={() => { handleViewPayment(props);
  
// }}
// >
// View Receipt
// </Button>
//                 )
//             }
      
    ];

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState<{ status?: string; search?: string }>({});
    const [activeStatusTab, setActiveStatusTab] = useState<string | null>(null);
    const [summary, setSummary] = useState<any | null>(null);

    const fetchPayments = useCallback(async (page = 1, perPage = 15, search = "") => {
        const params: any = {
            page,
            per_page: perPage,
            search:search,
            ...currentFilters
        };
        
        if (currentFilters.status) {
            params.status = currentFilters.status;
        }
        
        const response = await GetPayments(params);
        console.log('response ss', response);
        const summary = response?.summary;
        setSummary(summary);
        console.log('response', response);
        return response;
    }, [currentFilters]);

    const [selectedPaymentView, setSelectedPaymentView] = useState<any | null>(null);
    const [showViewPaymentModal, setShowViewPaymentModal] = useState(false);

    const handleViewPayment = (props: any) => {
      console.log('props', props);
      setSelectedPaymentView(props);
      setShowViewPaymentModal(true);
    };

    
  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Billing History" />

      <PageHeader
        title="Billing History"
        description="View your billing history and manage your payments."
        showSearch={false}
        
      />


      {/* Filter Tabs & Search */}
      <Card className="mb-4" style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Card.Body className="p-3">
          <Row className="align-items-center">
            <Col lg={9} className="mb-3 mb-lg-0">
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant={activeStatusTab === null ? 'light' : 'link'}
                  className={` text-decoration-none ${activeStatusTab === null ? 'bg-light' : ''}`}
                  onClick={() => {
                    setActiveStatusTab(null);
                    setCurrentFilters({});
                    setRefreshKey(prev => prev + 1);
                  }}
                  style={{ 
                    fontWeight: activeStatusTab === null ? '600' : '400',
                    color: activeStatusTab === null ? '#212529' : '#6c757d'
                  }}
                >
                  All 
                  <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    {summary?.total || 0}
                  </Badge>
                </Button>
                

                <Button
                  variant={activeStatusTab === 'completed' ? 'light' : 'link'}
                  className={` text-decoration-none ${activeStatusTab === 'completed' ? 'bg-light' : ''}`}
                  onClick={() => {
                    setActiveStatusTab('completed');
                    setCurrentFilters({ status: 'completed' });
                    setRefreshKey(prev => prev + 1);
                  }}
                  style={{ 
                    fontWeight: activeStatusTab === 'completed' ? '600' : '400',
                    color: activeStatusTab === 'completed' ? '#212529' : '#6c757d'
                  }}
                >
                  <Check size={16} className="me-1" />
                  Completed <Badge bg="success" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    {summary?.status_counts?.completed || 0}
                  </Badge>
                  {/* <ChevronRight size={14} className="ms-1" /> */}
                </Button>

                <Button
                  variant={activeStatusTab === 'cancelled' ? 'light' : 'link'}
                  className={` text-decoration-none ${activeStatusTab === 'cancelled' ? 'bg-light' : ''}`}
                  onClick={() => {
                    setActiveStatusTab('cancelled');
                    setCurrentFilters({ status: 'cancelled' });
                    setRefreshKey(prev => prev + 1);
                  }}
                  style={{ 
                    fontWeight: activeStatusTab === 'cancelled' ? '600' : '400',
                    color: activeStatusTab === 'cancelled' ? '#212529' : '#6c757d'
                  }}
                >
                  <X size={16} className="me-1" />
                  Cancelled
                  <Badge bg="danger" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    {summary?.status_counts?.cancelled || 0}
                  </Badge>
                </Button>

                <Button
                  variant={activeStatusTab === 'failed' ? 'light' : 'link'}
                  className={` text-decoration-none ${activeStatusTab === 'failed' ? 'bg-light' : ''}`}
                  onClick={() => {
                    setActiveStatusTab('failed');
                    setCurrentFilters({ status: 'failed' });
                    setRefreshKey(prev => prev + 1);
                  }}
                  style={{ 
                    fontWeight: activeStatusTab === 'failed' ? '600' : '400',
                    color: activeStatusTab === 'failed' ? '#212529' : '#6c757d'
                  }}
                >
                  <X size={16} className="me-1" />
                  Failed
                  <Badge bg="danger" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    {summary?.status_counts?.failed || 0}
                  </Badge>
                </Button>




              </div>


            </Col>
            <Col lg={3}>
              <Form.Control 
                type="search" 
                placeholder="Search Invoices..." 
                onChange={(e) => setCurrentFilters({ ...currentFilters, search: e.target.value })}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

            <GenericListPage
                 columns={columns}
                 fetchData={fetchPayments}
                 title="Payments"
                 searchPlaceholder="Search payments..."
                 defaultPageSize={15}
                 filters={currentFilters}
                 refreshKey={refreshKey}
                 search={false}
                 tableStyle="table-style-2"
             />

             <FormModal
              show={showViewPaymentModal}
              size="lg"
              onHide={() => setShowViewPaymentModal(false)}
              title="Invoice Details "
              desc={`Invoice: ${selectedPaymentView?.invoice?.invoice_number}`}
              onSubmit={() => setShowViewPaymentModal(false)}
              submitButtonText="Close"
              cancelButtonText="Cancel"
              onCancel={() => setShowViewPaymentModal(false)}
              formHtml={
                <>
                <div className="mb-4 pb-4 border-bottom"><div className="mb-4 pb-4 border-bottom">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-muted mb-2">From</h6>
                    <h6 className="mb-1">{selectedPaymentView?.invoice?.reseller?.name}</h6>
                    {/* <img alt="logo" className="img-fluid" src={CompanyLogo2.src} /> */}
                    <p className="text-muted mb-0 small">123 Business Street
                      <br/>London, UK SW1A 1AA</p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted mb-2">Bill To</h6>
                    <h6 className="mb-1">{selectedPaymentView?.invoice?.company?.name}</h6>
                    <p className="text-muted mb-0 small">123 Business Street
                      <br />London, SW1A 1AA</p>
                  </div>
                </div>
              </div>
              <div className="mb-4 pb-4 border-bottom">
                <div className="row">
                  <div className="col-md-3 col-6">
                    <p className="text-muted mb-1 small">Invoice Date</p>
                    <p className="fw-semibold mb-0">{moment(selectedPaymentView?.invoice?.invoice_date).format('DD-MMM-YYYY')}</p>
                  </div>
                  <div className="col-md-3 col-6">
                    <p className="text-muted mb-1 small">Due Date</p>
                    <p className="fw-semibold mb-0">{moment(selectedPaymentView?.invoice?.due_date).format('DD-MMM-YYYY')}</p>
                  </div>
                  <div className="col-md-3 col-6">
                    <p className="text-muted mb-1 small">Payment Method</p>
                    <p className="fw-semibold mb-0">{selectedPaymentView?.payment_method}</p>
                  </div>
                  <div className="col-md-3 col-6">
                    <p className="text-muted mb-1 small">Invoice ID</p>
                    <p className="fw-semibold mb-0">{selectedPaymentView?.invoice?.invoice_number}</p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <h6 className="text-muted mb-3">Items</h6>
                <div className="table-responsive">
                  <table className="table">
                    <thead className="bg-light">
                      <tr>
                        <th>Description</th>
                        <th className="text-center">Quantity</th>
                        <th className="text-end">Unit Price</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPaymentView?.invoice?.items?.map((item: any) => (
                        <tr key={item.id}>
                          <td>{item?.product?.name}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-end fw-semibold">{selectedPaymentView?.currency_code} {formatNumber(item.unit_price)}</td>
                          <td className="text-end fw-semibold">{selectedPaymentView?.currency_code} {formatNumber(item.line_total)}</td>
                        </tr>
                      ))}
                      
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-light rounded p-3">
                <div className="mb-2 row">
                  <div className="col-6">
                    <p className="mb-0 text-muted">Subtotal:</p>
                  </div>
                  <div className="text-end col-6">
                    <p className="mb-0 fw-semibold">{selectedPaymentView?.currency_code} {formatNumber(selectedPaymentView?.invoice?.subtotal)}</p>
                  </div>
                </div>
                <div className="mb-2 row">
                  <div className="col-6">
                    <p className="mb-0 text-muted">Tax:</p>
                  </div>
                  <div className="text-end col-6">
                    <p className="mb-0 fw-semibold">{selectedPaymentView?.currency_code} {formatNumber(selectedPaymentView?.invoice?.tax_amount)}</p>
                  </div>
                </div>
                <hr />
                <div className="row">
                  <div className="col-6">
                    <p className="mb-0 fw-bold">Total:</p>
                  </div>
                  <div className="text-end col-6">
                    <p className="mb-0 fw-bold text-primary fs-5">{selectedPaymentView?.currency_code} {formatNumber(selectedPaymentView?.invoice?.total_amount)}</p>
                  </div>
                </div>
              </div></div>
                </>
              }
              ShowSubmitButton={false}
              />

            
      

    </React.Fragment>
  );
};

BillingHistory.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default BillingHistory;
