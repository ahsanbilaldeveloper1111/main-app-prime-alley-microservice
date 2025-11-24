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
import { Card, Row, Col, Button, Badge, Form, Table, Modal, Dropdown, ProgressBar } from 'react-bootstrap';
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
import { GetProducts, GetProductCategories } from "@utils/accounting";
import GenericListPage from '@components/GenericListPage';
import { useSession } from 'next-auth/react';
import { Column } from "@components/CustomDataTable";
import moment from "moment";
import FormModal from "@pages/partial/FormModal";
import { toast } from "react-toastify";
import {currenciesData} from "@common/JsonData/currencies";
import ThemeSelect from "@components/ThemeSelect";
import { formatNumber } from "@utils/Helper";

interface Product {
      id: number;
      name: string;
      category: string;
      price: string;
      type: string;
      totalAmount: string;
      status: string;
      created: string;
    }
    
    interface Invoice {
      id: number;
      invoice: string;
      date: string;
      dueDate: string;
      amount: string;
      status: string;
      paymentMethod: string;
      items: { name: string; quantity: number; price: string }[];
      subtotal: string;
      tax: string;
      total: string;
    }

const ProductDetails = () => {


  const { data:session, status } = useSession();
   
    const columns: Column[] = [
        { key: 'name', name: 'Product Name', selector: (row: any) => row.product?.name, sortable: true,
          cell: (row: any) => {
            return <div>
              <p className="fw-semibold">{row?.product?.name}</p>
            </div>
          }
         },
        { key: 'category', name: 'Category', selector: (row: any) => row.product?.category?.name, sortable: true,
          cell: (row: any) => {
            return <div>
              <p>{row?.product?.category?.name}</p>
            </div>
          }
         },
         { key: 'base_price', name: 'Base Price', selector: (row: any) => row.product?.base_price, sortable: true,
          cell: (row: any) => {
            return <div>
              <p className="text-primary fw-semibold">{row?.product?.currency} {formatNumber(row?.product?.base_price)}</p>
            </div>
          }
         },
       
        
        { key: 'is_active', name: 'Status', selector: (row: any) => row.product?.is_active, sortable: true,
          cell: (row: any) => {
            return <div>
              <p className={`bg-opacity-10 text-dark badge bg-${row?.product?.is_active ? 'success' : 'danger'}`}>{row?.product?.is_active ? 'Active' : 'Inactive'}</p>
            </div>
          }
         },
        { key: 'created_at', name: 'Created', selector: (row: any) => row.product?.created_at, sortable: true,
          cell: (row: any) => {
            return <div>
              <p className="text-muted">{moment(row?.product?.created_at).format('DD-MMM-YYYY')}</p>
            </div>
          }
         },

        // ...(session?.user?.permissions?.includes('edit-groups') || session?.user?.permissions?.includes('delete-groups') ? [
        //     {
        //         key: 'Action',
        //         name: 'Actions',
        //         selector: (row: any) => row.id,
        //         sortable: false,
        //         cell: (props: any) => (
        //             <div className="d-flex gap-2">
        //                {/* <Button variant="light" className="btn-action-style-2 p-1 text-primary" title="View" onClick={() => handleViewProduct(props)}>
        //                     <Eye size={16} />
        //                 </Button> */}
                        
        //             </div>
        //         )
        //     }
        // ] : [])
    ];

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({});

    const fetchProducts = useCallback(async (page = 1, perPage = 15, search = "") => {
        const response = await GetProducts({ page, perPage, search, filters: currentFilters });
        console.log('response', response);
        return response;
    }, [currentFilters]);

    const [selectedProductView, setSelectedProductView] = useState<any | null>(null);
    const [showViewProductModal, setShowViewProductModal] = useState(false);
    const handleViewProduct = (props: any) => {
      setSelectedProductView(props);
      setShowViewProductModal(true);
    };

    const [selectedProductDelete, setSelectedProductDelete] = useState<any | null>(null);
    const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
    const handleDeleteProduct = (props: any) => {
      setSelectedProductDelete(props?.id);
      setShowDeleteProductModal(true);
    };

    const [productCategories, setProductCategories] = useState<any[]>([]);
    const fetchProductCategories = async () => {
      const response = await GetProductCategories();
      setProductCategories(response);
    };
    useEffect(() => {
      fetchProductCategories();
    }, []);

  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />

      <PageHeader
        title="My Products"
        description="Manage your subscriptions and services"
        showSearch={false}
        buttons={
          <>
          
          </>
        }
      />

   

            <GenericListPage
                 columns={columns}
                 fetchData={fetchProducts}
                 title="Products"
                 searchPlaceholder="Search products..."
                 defaultPageSize={15}
                 filters={currentFilters}
                 refreshKey={refreshKey}
                 search={true}
                 tableStyle="table-style-2"
             />


             <FormModal
              show={showViewProductModal}
              size="lg"
              onHide={() => setShowViewProductModal(false)}
              title="Product Details"
              desc="View the product details"
              onSubmit={() => setShowViewProductModal(false)}
              submitButtonText="Close"
              cancelButtonText="Cancel"
              onCancel={() => setShowViewProductModal(false)}
              formHtml={
                <>
                <div className="mb-4 pb-4 border-bottom">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h4 className="mb-2">{selectedProductView?.name}</h4>
                    <p className="text-muted mb-0">Product ID: #{selectedProductView?.id}</p>
                  </div>
                  <Badge bg={selectedProductView?.is_active ? 'success' : 'danger'} className="px-3 py-2">
                    {selectedProductView?.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
  
              <Row>
                <Col md={6} className="mb-3">
                  <div className="p-3 bg-light rounded">
                    <p className="text-muted mb-1 small">Category</p>
                    <p className="mb-0 fw-semibold">{selectedProductView?.category?.name}</p>
                  </div>
                </Col>
                
                

                <Col md={6} className="mb-3">
                  <div className="p-3 bg-light rounded">
                    <p className="text-muted mb-1 small">Base Price</p>
                    <p className="mb-0 fw-semibold text-primary">{selectedProductView?.currency} {selectedProductView?.base_price}</p>
                  </div>
                </Col>
                
                
              </Row>
                </>
              }
              submitButtonVariant="primary"
              cancelButtonVariant="secondary"
              ShowSubmitButton={false}
            />
            
      

    </React.Fragment>
  );
};

ProductDetails.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ProductDetails;
