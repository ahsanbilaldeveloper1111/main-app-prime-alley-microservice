import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useEffect,
  useCallback,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import CompanyLogo2 from "@assets/images/Prime3.png";
import { useState } from 'react';
import { Card, Row, Col, Button, Badge, Form, Table, Modal, Dropdown, ProgressBar, Nav } from 'react-bootstrap';
import { 
  Eye, CreditCard, Clock, Wallet, ChevronRight, ChevronLeft,
  Edit, Trash2, Filter, Plus, Settings, Download, LayoutDashboard,
  Package, FileText, Bell, Check, DollarSign, TrendingUp, AlertCircle,
  Users, ArrowUp, ArrowDown,
  Info
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

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
import {currenciesData} from "@common/JsonData/currencies";
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
              <p className="fw-semibold text-primary">{row?.currency_code} {row?.amount}</p>
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
            return <div>
              <p className={`bg-opacity-10 text-dark badge bg-${row?.status   ? 'success' : 'danger'}`}>{row?.status}</p>
            </div>
          }
         },
        { key: 'payment_date', name: 'Date', selector: (row: any) => row.payment_date, sortable: true,
          cell: (row: any) => {
            return <div>
              <p className="text-muted">{moment(row?.payment_date).format('DD-MMM-YYYY')}</p>
            </div>
          }
         },

        
            {
                key: 'Action',
                name: 'Actions',
                selector: (row: any) => row.id,
                sortable: false,
                cell: (props: any) => (
                    <div className="d-flex gap-2">
                       <Button variant="light" className="btn-action-style-2 p-1 text-info" title="View" onClick={() => handleViewPayment(props)}>
                            <Eye size={16} />
                        </Button>
                        
                    </div>
                )
            }
      
    ];

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState<{ status?: string }>({});
    const [activeStatusTab, setActiveStatusTab] = useState<string | null>(null);

    const fetchPayments = useCallback(async (page = 1, perPage = 15, search = "") => {
        const params: any = {
            page,
            per_page: perPage,
            search
        };
        
        if (currentFilters.status) {
            params.status = currentFilters.status;
        }
        
        const response = await GetPayments(params);
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

        showSearch={false}
        
      />

      <Row className="mb-3">
        <Col md={12}>
          <ul id="system-tabs" className="mb-3 nav nav-tabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeStatusTab === null ? 'active' : ''}`}
                onClick={() => {
                  setActiveStatusTab(null);
                  setCurrentFilters({});
                  setRefreshKey(prev => prev + 1);
                }}
                type="button"
                role="tab"
              >
                All
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeStatusTab === 'completed' ? 'active' : ''}`}
                onClick={() => {
                  setActiveStatusTab('completed');
                  setCurrentFilters({ status: 'completed' });
                  setRefreshKey(prev => prev + 1);
                }}
                type="button"
                role="tab"
              >
                Completed
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeStatusTab === 'pending' ? 'active' : ''}`}
                onClick={() => {
                  setActiveStatusTab('pending');
                  setCurrentFilters({ status: 'pending' });
                  setRefreshKey(prev => prev + 1);
                }}
                type="button"
                role="tab"
              >
                Pending
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeStatusTab === 'refunded' ? 'active' : ''}`}
                onClick={() => {
                  setActiveStatusTab('refunded');
                  setCurrentFilters({ status: 'refunded' });
                  setRefreshKey(prev => prev + 1);
                }}
                type="button"
                role="tab"
              >
                Refunded
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeStatusTab === 'partially_paid' ? 'active' : ''}`}
                onClick={() => {
                  setActiveStatusTab('partially_paid');
                  setCurrentFilters({ status: 'partially_paid' });
                  setRefreshKey(prev => prev + 1);
                }}
                type="button"
                role="tab"
              >
                Partially Paid
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeStatusTab === 'cancelled' ? 'active' : ''}`}
                onClick={() => {
                  setActiveStatusTab('cancelled');
                  setCurrentFilters({ status: 'cancelled' });
                  setRefreshKey(prev => prev + 1);
                }}
                type="button"
                role="tab"
              >
                Cancelled
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeStatusTab === 'failed' ? 'active' : ''}`}
                onClick={() => {
                  setActiveStatusTab('failed');
                  setCurrentFilters({ status: 'failed' });
                  setRefreshKey(prev => prev + 1);
                }}
                type="button"
                role="tab"
              >
                Failed
              </button>
            </li>
          </ul>
        </Col>
      </Row>

            <GenericListPage
                 columns={columns}
                 fetchData={fetchPayments}
                 title="Payments"
                 searchPlaceholder="Search payments..."
                 defaultPageSize={15}
                 filters={currentFilters}
                 refreshKey={refreshKey}
                 search={true}
                 tableStyle="table-style-2"
             />

             <FormModal
              show={showViewPaymentModal}
              size="lg"
              onHide={() => setShowViewPaymentModal(false)}
              title="Payment Details"
              desc="View the payment details"
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
                          <td className="text-end fw-semibold">{selectedPaymentView?.currency_code} {item.unit_price}</td>
                          <td className="text-end fw-semibold">{selectedPaymentView?.currency_code} {item.line_total}</td>
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
                    <p className="mb-0 fw-semibold">{selectedPaymentView?.currency_code} {selectedPaymentView?.invoice?.subtotal}</p>
                  </div>
                </div>
                <div className="mb-2 row">
                  <div className="col-6">
                    <p className="mb-0 text-muted">Tax:</p>
                  </div>
                  <div className="text-end col-6">
                    <p className="mb-0 fw-semibold">{selectedPaymentView?.currency_code} {selectedPaymentView?.invoice?.tax_amount}</p>
                  </div>
                </div>
                <hr />
                <div className="row">
                  <div className="col-6">
                    <p className="mb-0 fw-bold">Total:</p>
                  </div>
                  <div className="text-end col-6">
                    <p className="mb-0 fw-bold text-primary fs-5">{selectedPaymentView?.currency_code} {selectedPaymentView?.invoice?.total_amount}</p>
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
