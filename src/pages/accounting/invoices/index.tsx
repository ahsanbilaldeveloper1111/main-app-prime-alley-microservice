import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoice,
  getActiveProducts,
  getPaymentMethods,
  payInvoice,
  InvoiceData,
  InvoiceCreateUpdatePayload,
  InvoiceItemCreateUpdatePayload,
  InvoiceItemData,
  CompanyData,
  ProductData,
  PaymentMethodData,
  InvoicePaymentPayload,
} from "@utils/accounting";
import { getCompanies } from "@utils/accounting";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import moment from "moment";

import "@assets/scss/common.scss";

import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import PageSummaryGrid from "@components/PageSummaryGrid";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";

import { motion } from "framer-motion";
import { FiEdit, FiTrash2, FiPrinter, FiDownload, FiCreditCard, FiDollarSign } from "react-icons/fi";
import TableAction from "@components/TableAction";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Spinner } from "react-bootstrap";

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface SelectOption {
  value: number;
  label: string;
}

interface InvoiceFormData extends Omit<InvoiceData, 'items'> {
  items: InvoiceItemCreateUpdatePayload[];
}

// Payment Cards Component for Display
const PaymentCardsDisplay = ({ 
  paymentMethods, 
  isLoadingPaymentMethods 
}: { 
  paymentMethods: PaymentMethodData[]; 
  isLoadingPaymentMethods: boolean; 
}) => {
  console.log("PaymentCardsDisplay - paymentMethods:", paymentMethods);
  console.log("PaymentCardsDisplay - isLoadingPaymentMethods:", isLoadingPaymentMethods);

  if (isLoadingPaymentMethods) {
    return (
      <div className="text-center py-3">
        <Spinner animation="border" size="sm" className="me-2" />
        <span>Loading payment methods...</span>
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="text-center py-3 text-muted">
        <FiCreditCard size={24} className="mb-2" />
        <div>No payment methods available</div>
      </div>
    );
  }

  return (
    <div className="row">
      {paymentMethods.map((method) => (
        <div key={method.id} className="col-md-6 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center">
                  <FiCreditCard className="me-2 text-primary" />
                  <span className="badge bg-primary">
                    {method.type === "card" ? "Card" : "Bank Account"}
                  </span>
                  {method.is_default && (
                    <span className="badge bg-success ms-2">Default</span>
                  )}
                </div>
              </div>
              
              {method.type === "card" && method.card ? (
                <div>
                  <div className="fw-bold mb-1">
                    {method.card.brand.toUpperCase()} •••• {method.card.last4}
                  </div>
                  <div className="text-muted small mb-2">
                    Expires {method.card.exp_month}/{method.card.exp_year}
                  </div>
                  {method.billing_details?.name && (
                    <div className="text-info small">
                      <i className="fas fa-user me-1"></i>
                      {method.billing_details.name}
                    </div>
                  )}
                </div>
              ) : method.type === "bank_account" && method.bank_account ? (
                <div>
                  <div className="fw-bold mb-1">
                    {method.bank_account.bank_name} •••• {method.bank_account.last4}
                  </div>
                  <div className="text-muted small mb-2">
                    Routing: {method.bank_account.routing_number}
                  </div>
                  {method.billing_details?.name && (
                    <div className="text-info small">
                      <i className="fas fa-user me-1"></i>
                      {method.billing_details.name}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Payment Selection Component for Payment Modal
const PaymentMethodSelector = ({ 
  paymentMethods, 
  selectedPaymentMethod,
  onPaymentMethodSelect,
  isLoadingPaymentMethods 
}: { 
  paymentMethods: PaymentMethodData[]; 
  selectedPaymentMethod: string;
  onPaymentMethodSelect: (methodId: string) => void;
  isLoadingPaymentMethods: boolean; 
}) => {
  if (isLoadingPaymentMethods) {
    return (
      <div className="text-center py-3">
        <Spinner animation="border" size="sm" className="me-2" />
        <span>Loading payment methods...</span>
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="text-center py-3 text-muted">
        <FiCreditCard size={24} className="mb-2" />
        <div>No payment methods available for this company</div>
      </div>
    );
  }

  return (
    <div className="row">
      {paymentMethods.map((method) => (
        <div key={method.id} className="col-md-6 mb-3">
          <div 
            className={`card h-100 cursor-pointer ${selectedPaymentMethod === method.id ? 'border-primary bg-light' : ''}`}
            onClick={() => onPaymentMethodSelect(method.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center">
                  <FiCreditCard className="me-2 text-primary" />
                  <span className="badge bg-primary">
                    {method.type === "card" ? "Card" : "Bank Account"}
                  </span>
                  {method.is_default && (
                    <span className="badge bg-success ms-2">Default</span>
                  )}
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    checked={selectedPaymentMethod === method.id}
                    onChange={() => onPaymentMethodSelect(method.id)}
                  />
                </div>
              </div>
              
              {method.type === "card" && method.card ? (
                <div>
                  <div className="fw-bold mb-1">
                    {method.card.brand.toUpperCase()} •••• {method.card.last4}
                  </div>
                  <div className="text-muted small mb-2">
                    Expires {method.card.exp_month}/{method.card.exp_year}
                  </div>
                  {method.billing_details?.name && (
                    <div className="text-info small">
                      <i className="fas fa-user me-1"></i>
                      {method.billing_details.name}
                    </div>
                  )}
                </div>
              ) : method.type === "bank_account" && method.bank_account ? (
                <div>
                  <div className="fw-bold mb-1">
                    {method.bank_account.bank_name} •••• {method.bank_account.last4}
                  </div>
                  <div className="text-muted small mb-2">
                    Routing: {method.bank_account.routing_number}
                  </div>
                  {method.billing_details?.name && (
                    <div className="text-info small">
                      <i className="fas fa-user me-1"></i>
                      {method.billing_details.name}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const InvoiceList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<{search?: string}>({});

  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState<boolean>(false);
  
  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceData | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  const columns: Column[] = useMemo(
    () => [
      {
        key: "invoice_number",
        name: "Invoice Number",
        selector: (row: InvoiceData) => row.invoice_number,
        sortable: true,
        cell: (props: InvoiceData) => (
          <div>
            <div className="fw-bold text-primary">#{props.invoice_number}</div>
          </div>
        ),
      },
      {
        key: "company",
        name: "Company",
        selector: (row: InvoiceData) => row.company?.name,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span className="status-badge primary">
            {props.company?.name || "Unknown Company"}
          </span>
        ),
      },
      {
        key: "subtotal",
        name: "Subtotal",
        selector: (row: InvoiceData) => row.subtotal,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span className="fw-bold text-success">
            {props.currency_code} {parseFloat(props.subtotal || "0").toFixed(2)}
          </span>
        ),
      },
      {
        key: "tax_amount",
        name: "Tax Amount",
        selector: (row: InvoiceData) => row.tax_amount,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span className="text-warning">
            {props.currency_code}{" "}
            {parseFloat(props.tax_amount || "0").toFixed(2)}
          </span>
        ),
      },
      {
        key: "total_amount",
        name: "Total Amount",
        selector: (row: InvoiceData) => row.total_amount,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span className="fw-bold text-primary">
            {props.currency_code}{" "}
            {parseFloat(props.total_amount || "0").toFixed(2)}
          </span>
        ),
      },
      {
        key: "status",
        name: "Status",
        selector: (row: InvoiceData) => row.status,
        sortable: true,
        cell: (props: InvoiceData) => {
          const statusColors = {
            draft: "info",
            sent: "primary",
            paid: "success",
            overdue: "warning",
            cancelled: "danger",
          };
          return (
            <span
              className={`status-badge ${
                statusColors[props.status as keyof typeof statusColors] ||
                "bg-secondary"
              } text-uppercase`}
            >
              {props.status}
            </span>
          );
        },
      },
      {
        key: "due_date",
        name: "Due Date",
        selector: (row: InvoiceData) => row.due_date,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span className="text-muted">
            {props.due_date
              ? moment(props.due_date).format("DD/MM/YYYY")
              : "No due date"}
          </span>
        ),
      },
      {
        key: "invoice_date",
        name: "Invoice Date",
        selector: (row: InvoiceData) => row.invoice_date,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span className="text-muted">
            {moment(props.invoice_date).format("DD/MM/YYYY")}
          </span>
        ),
      },
      {
        key: "Action",
        name: "ACTION",
        selector: (row: InvoiceData) => row.id,
        sortable: false,
        cell: (props: InvoiceData) => {
          const isUnpaid = props.status === 'draft' || props.status === 'sent' || props.status === 'overdue';
          const actions = [
            {
              label: 'Edit',
              icon: FiEdit,
              onClick: () => handleEditInvoice(props),
              variant: 'edit'
            },
            {
              label: 'Download PDF',
              icon: FiDownload,
              onClick: () => handleDownloadPDF(props),
              variant: 'default'
            }
          ];

          // Add Pay action for unpaid invoices
          if (isUnpaid) {
            actions.push({
              label: 'Pay',
              icon: FiDollarSign,
              onClick: () => handlePayInvoice(props),
              variant: 'success'
            });
          }

          // Add Delete action
          actions.push({
            label: 'Delete',
            icon: FiTrash2,
            onClick: () => handleDeleteInvoice(props),
            variant: 'delete'
          });

          return (
            <TableAction actions={actions} />
          );
        },
      },
    ],
    [session?.user?.permissions]
  );

  // Load payment methods for a company
  const loadPaymentMethods = useCallback(async (companyId: number) => {
    if (!companyId) {
      console.log("No company ID provided to loadPaymentMethods");
      return;
    }

    console.log("Loading payment methods for company ID:", companyId);
    setIsLoadingPaymentMethods(true);
    try {
      const methods = await getPaymentMethods(companyId);
      console.log("Payment methods loaded:", methods);
      setPaymentMethods(methods);
    } catch (error) {
      console.error("Error loading payment methods:", error);
      setPaymentMethods([]);
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesData = await getCompanies();
        setCompanies(companiesData.data || []);
        console.log("Companies:", companiesData);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    const fetchProducts = async () => {
      try {
        const productsData = await getActiveProducts();
        setProducts(productsData || []);
        console.log("Products:", productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchCompanies();
    fetchProducts();
  }, []);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchInvoices = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        const response = await getInvoices({
          page,
          per_page: perPage,
          search,
          ...memoizedFilters,
        });

        // The getInvoices function returns PaginationWrapper<InvoiceData>
        // which has the structure: { data: InvoiceData[], pagination: {...} }
        return {
          data: response.data, // The actual invoice array
          total: response.pagination.total,
          page: response.pagination.current_page,
          per_page: response.pagination.per_page,
          last_page: response.pagination.last_page,
        };
      } catch (error) {
        console.error("Error fetching invoices:", error);
        throw error;
      }
    },
    [memoizedFilters]
  );

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

  // Edit Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceFormData | null>(
    null
  );
  const [showEditInvoiceModal, setShowEditInvoiceModal] =
    useState<boolean>(false);
  const [editingInvoice, setEditingInvoice] = useState<boolean>(false);

  // Delete Invoice Modal
  const [showDeleteInvoiceModal, setShowDeleteInvoiceModal] = useState<boolean>(false);
  const [confirmDeleteInvoice, setConfirmDeleteInvoice] = useState<string>("");

  const handleEditInvoice = useCallback((props: InvoiceData) => {
    // Convert API response items to form format
    const convertedItems: InvoiceItemCreateUpdatePayload[] = props.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
    }));
    
    setSelectedInvoice({
      ...props,
      items: convertedItems
    });
    setShowEditInvoiceModal(true);
    
    // Load payment methods for the company when editing
    if (props.company_id) {
      console.log("Loading payment methods for edit invoice company:", props.company_id);
      loadPaymentMethods(parseInt(props.company_id));
    }
  }, [loadPaymentMethods]);

  const handleSubmitEditInvoice = useCallback(async () => {
    if (!selectedInvoice) return;

    if (!selectedInvoice.company_id) {
      toast.error("Please select a company");
      return;
    }
    if (!selectedInvoice.items || selectedInvoice.items.length === 0) {
      toast.error("Please add at least one item to the invoice");
      return;
    }
    
    if (selectedInvoice.items.some(item => !item.product_id)) {
      toast.error("Please select a product for all items");
      return;
    }
    if (!selectedInvoice.due_date) {
      toast.error("Please select a due date");
      return;
    }

    setEditingInvoice(true);
    try {
      const totals = calculateTotals(selectedInvoice.items);
      const invoiceData: InvoiceCreateUpdatePayload = {
        company_id: selectedInvoice.company_id,
        invoice_date: selectedInvoice.invoice_date,
        due_date: selectedInvoice.due_date,
        payment_mode: selectedInvoice.payment_mode,
        currency_code: selectedInvoice.currency_code,
        exchange_rate: selectedInvoice.exchange_rate,
        tax_amount: totals.tax_amount,
        notes: selectedInvoice.notes || "",
        terms_conditions: selectedInvoice.terms_conditions || "",
        items: selectedInvoice.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
        })),
        subtotal: totals.subtotal,
        total_amount: totals.total_amount,
      };

      const response = await updateInvoice(selectedInvoice.id, invoiceData);

      if (response) {
        setSelectedInvoice(null);
        setShowEditInvoiceModal(false);
        setRefreshKey((prev) => prev + 1);
        toast.success("Invoice updated successfully");
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice");
    } finally {
      setEditingInvoice(false);
    }
  }, [selectedInvoice]);

  // Create Invoice Modal
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] =
    useState<boolean>(false);
  const [creatingInvoice, setCreatingInvoice] = useState<boolean>(false);
  const [newInvoice, setNewInvoice] = useState<InvoiceCreateUpdatePayload>({
    company_id: "",
    invoice_date: moment().format("YYYY-MM-DD"),
    due_date: "",
    payment_mode: "one_time",
    currency_code: "USD",
    exchange_rate: "1.000000",
    tax_amount: 0,
    notes: "",
    terms_conditions: "",
    items: [],
    subtotal: 0,
    total_amount: 0,
  });

  // Helper function to calculate totals
  const calculateTotals = (items: InvoiceItemCreateUpdatePayload[]) => {
    const subtotal = items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
    
    const taxAmount = items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      return sum + (quantity * unitPrice * taxRate / 100);
    }, 0);
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      total_amount: parseFloat((subtotal + taxAmount).toFixed(2))
    };
  };

  const handleSubmitCreateInvoice = useCallback(async () => {
    if (!newInvoice.company_id) {
      toast.error("Please select a company");
      return;
    }
    if (!newInvoice.items || newInvoice.items.length === 0) {
      toast.error("Please add at least one item to the invoice");
      return;
    }
    
    if (newInvoice.items.some(item => !item.product_id)) {
      toast.error("Please select a product for all items");
      return;
    }
    if (!newInvoice.due_date) {
      toast.error("Please select a due date");
      return;
    }

    setCreatingInvoice(true);
    try {
      const totals = calculateTotals(newInvoice.items);
      const invoiceData: InvoiceCreateUpdatePayload = {
        ...newInvoice,
        ...totals
      };
      const response = await createInvoice(invoiceData);

      if (response) {
        setNewInvoice({
          company_id: "",
          invoice_date: moment().format("YYYY-MM-DD"),
          due_date: "",
          payment_mode: "one_time",
          currency_code: "USD",
          exchange_rate: "1.000000",
          tax_amount: 0,
          notes: "",
          terms_conditions: "",
          items: [],
          subtotal: 0,
          total_amount: 0,
        });
        setShowCreateInvoiceModal(false);
        setRefreshKey((prev) => prev + 1);
        toast.success("Invoice created successfully");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setCreatingInvoice(false);
    }
  }, [newInvoice]);

  // Modal handlers
  const openCreateInvoiceModal = useCallback(
    () => setShowCreateInvoiceModal(true),
    []
  );
  const closeCreateInvoiceModal = useCallback(() => {
    setShowCreateInvoiceModal(false);
    setNewInvoice({
      company_id: "",
      invoice_date: moment().format("YYYY-MM-DD"),
      due_date: "",
      payment_mode: "one_time",
      currency_code: "USD",
      exchange_rate: "1.000000",
      tax_amount: 0,
      notes: "",
      terms_conditions: "",
      items: [],
      subtotal: 0,
      total_amount: 0,
    });
    setPaymentMethods([]);
  }, []);

  const closeEditInvoiceModal = useCallback(() => {
    setShowEditInvoiceModal(false);
    setSelectedInvoice(null);
    setPaymentMethods([]);
  }, []);

  // Delete Invoice Handlers
  const handleDeleteInvoice = useCallback((props: InvoiceData) => {
    setSelectedInvoice(props);
    setShowDeleteInvoiceModal(true);
  }, []);

  // Payment handlers
  const handlePayInvoice = useCallback(async (invoice: InvoiceData) => {
    setSelectedInvoiceForPayment(invoice);
    setShowPaymentModal(true);
    
    // Load payment methods for the company
    if (invoice.company_id) {
      console.log("Loading payment methods for payment:", invoice.company_id);
      await loadPaymentMethods(parseInt(invoice.company_id));
    }
  }, [loadPaymentMethods]);

  const handleProcessPayment = useCallback(async () => {
    if (!selectedInvoiceForPayment || !selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessingPayment(true);
    try {
      const paymentPayload: InvoicePaymentPayload = {
        invoice_id: selectedInvoiceForPayment.id,
        payment_method: "stripe",
        payment_mode: "one_time",
        amount: parseFloat(selectedInvoiceForPayment.total_amount),
        payment_method_id: selectedPaymentMethod,
        notes: paymentNotes || `Payment for invoice ${selectedInvoiceForPayment.invoice_number}`
      };

      await payInvoice(paymentPayload);
      toast.success("Payment processed successfully");
      
      // Close modal and reset state
      setShowPaymentModal(false);
      setSelectedInvoiceForPayment(null);
      setSelectedPaymentMethod("");
      setPaymentNotes("");
      setPaymentMethods([]);
      
      // Refresh the invoice list
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    } finally {
      setIsProcessingPayment(false);
    }
  }, [selectedInvoiceForPayment, selectedPaymentMethod, paymentNotes]);

  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setSelectedInvoiceForPayment(null);
    setSelectedPaymentMethod("");
    setPaymentNotes("");
    setPaymentMethods([]);
  }, []);

  const handleSubmitDeleteInvoice = useCallback(async () => {
    if (!selectedInvoice) return;

    const confirmDeleteValue = confirmDeleteInvoice.trim();
    if (confirmDeleteValue === "DELETE") {
      try {
        await deleteInvoice(selectedInvoice.id);
        setSelectedInvoice(null);
        setShowDeleteInvoiceModal(false);
        setConfirmDeleteInvoice("");
        setRefreshKey((prev) => prev + 1);
        toast.success("Invoice deleted successfully");
      } catch (error) {
        console.error("Error deleting invoice:", error);
        toast.error("Failed to delete invoice");
      }
    } else {
      toast.error("Please type the word DELETE to confirm");
    }
  }, [confirmDeleteInvoice, selectedInvoice]);

  // Invoice item management functions
  const addNewInvoiceItem = useCallback(() => {
    const newItem: InvoiceItemCreateUpdatePayload = {
      product_id: "",
      quantity: "1",
      unit_price: "0.00",
      tax_rate: "0.00",
    };
    
    const updatedItems = [...newInvoice.items, newItem];
    const totals = calculateTotals(updatedItems);
    
    setNewInvoice(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  }, [newInvoice.items]);

  const updateNewInvoiceItem = useCallback((index: number, field: keyof InvoiceItemCreateUpdatePayload, value: string) => {
    const updatedItems = [...newInvoice.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    
    // Auto-populate unit price when product is selected
    if (field === 'product_id' && value) {
      const selectedProduct = products.find(p => p.id.toString() === value);
      if (selectedProduct) {
        updatedItems[index].unit_price = selectedProduct.base_price;
      }
    }
    
    const totals = calculateTotals(updatedItems);
    
    setNewInvoice(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  }, [newInvoice.items, products]);

  const removeNewInvoiceItem = useCallback((index: number) => {
    const updatedItems = newInvoice.items.filter((_, i) => i !== index);
    const totals = calculateTotals(updatedItems);
    
    setNewInvoice(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  }, [newInvoice.items]);

  const addEditInvoiceItem = useCallback(() => {
    if (!selectedInvoice) return;
    
    const newItem: InvoiceItemCreateUpdatePayload = {
      product_id: "",
      quantity: "1",
      unit_price: "0.00",
      tax_rate: "0.00",
    };
    
    const updatedItems = [...selectedInvoice.items, newItem];
    const totals = calculateTotals(updatedItems);
    
    setSelectedInvoice(prev => ({
      ...prev!,
      items: updatedItems,
      subtotal: totals.subtotal.toString(),
      tax_amount: totals.tax_amount.toString(),
      total_amount: totals.total_amount.toString(),
    }));
  }, [selectedInvoice]);

  const updateEditInvoiceItem = useCallback((index: number, field: keyof InvoiceItemCreateUpdatePayload, value: string) => {
    if (!selectedInvoice) return;
    
    const updatedItems = [...selectedInvoice.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    
    // Auto-populate unit price when product is selected
    if (field === 'product_id' && value) {
      const selectedProduct = products.find(p => p.id.toString() === value);
      if (selectedProduct) {
        updatedItems[index].unit_price = selectedProduct.base_price;
      }
    }
    
    const totals = calculateTotals(updatedItems);
    
    setSelectedInvoice(prev => ({
      ...prev!,
      items: updatedItems,
      subtotal: totals.subtotal.toString(),
      tax_amount: totals.tax_amount.toString(),
      total_amount: totals.total_amount.toString(),
    }));
  }, [selectedInvoice, products]);

  const removeEditInvoiceItem = useCallback((index: number) => {
    if (!selectedInvoice) return;
    
    const updatedItems = selectedInvoice.items.filter((_, i) => i !== index);
    const totals = calculateTotals(updatedItems);
    
    setSelectedInvoice(prev => ({
      ...prev!,
      items: updatedItems,
      subtotal: totals.subtotal.toString(),
      tax_amount: totals.tax_amount.toString(),
      total_amount: totals.total_amount.toString(),
    }));
  }, [selectedInvoice]);

  // Input handlers
  const handleNewInvoiceChange = useCallback(
    (field: keyof InvoiceCreateUpdatePayload, value: any) => {
      setNewInvoice((prev: InvoiceCreateUpdatePayload) => ({
        ...prev,
        [field]: value,
      }));
      
      // Load payment methods when company is selected
      if (field === 'company_id' && value) {
        console.log("Company selected in create modal:", value);
        loadPaymentMethods(parseInt(value));
      }
    },
    [loadPaymentMethods]
  );

  const handleEditInvoiceChange = useCallback(
    (field: keyof InvoiceFormData, value: any) => {
      setSelectedInvoice((prev: InvoiceFormData | null) => ({
        ...prev!,
        [field]: value,
      }));
      
      // Load payment methods when company is selected
      if (field === 'company_id' && value) {
        console.log("Company selected in edit modal:", value);
        loadPaymentMethods(parseInt(value));
      }
    },
    [loadPaymentMethods]
  );


  const generateInvoiceHTML = useCallback((invoice: InvoiceData) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .invoice-title { font-size: 24px; font-weight: bold; color: #2c3e50; }
          .invoice-details { text-align: right; }
          .invoice-details div { margin-bottom: 5px; }
          .company-info { margin-bottom: 30px; }
          .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .invoice-table th { background-color: #4285f4; color: white; font-weight: bold; }
          .invoice-table tr:nth-child(even) { background-color: #f9f9f9; }
          .totals { text-align: right; margin-top: 20px; }
          .totals div { margin-bottom: 5px; }
          .total-amount { font-size: 18px; font-weight: bold; color: #2c3e50; }
          .notes-section { margin-top: 30px; }
          .notes-section h4 { margin-bottom: 10px; color: #2c3e50; }
          @media print {
            body { margin: 0; padding: 15px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-details">
            <div><strong>Invoice #:</strong> ${invoice.invoice_number}</div>
            <div><strong>Date:</strong> ${moment(invoice.invoice_date).format('DD/MM/YYYY')}</div>
            <div><strong>Due Date:</strong> ${invoice.due_date ? moment(invoice.due_date).format('DD/MM/YYYY') : 'N/A'}</div>
            <div><strong>Status:</strong> ${invoice.status.toUpperCase()}</div>
          </div>
        </div>

        <div class="company-info">
          <h3>Bill To:</h3>
          <div><strong>${invoice.company?.name || 'N/A'}</strong></div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Tax Rate</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => {
              const product = products.find(p => p.id.toString() === item.product_id.toString());
              const lineTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
              return `
                <tr>
                  <td>${product?.name || 'Unknown Product'}</td>
                  <td>${item.quantity}</td>
                  <td>${invoice.currency_code} ${parseFloat(item.unit_price).toFixed(2)}</td>
                  <td>${item.tax_rate}%</td>
                  <td>${invoice.currency_code} ${lineTotal.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div><strong>Subtotal:</strong> ${invoice.currency_code} ${parseFloat(invoice.subtotal || '0').toFixed(2)}</div>
          <div><strong>Tax Amount:</strong> ${invoice.currency_code} ${parseFloat(invoice.tax_amount || '0').toFixed(2)}</div>
          <div class="total-amount"><strong>Total Amount:</strong> ${invoice.currency_code} ${parseFloat(invoice.total_amount || '0').toFixed(2)}</div>
        </div>

        ${invoice.notes ? `
          <div class="notes-section">
            <h4>Notes:</h4>
            <p>${invoice.notes}</p>
          </div>
        ` : ''}

        ${invoice.terms_conditions ? `
          <div class="notes-section">
            <h4>Terms & Conditions:</h4>
            <p>${invoice.terms_conditions}</p>
          </div>
        ` : ''}
      </body>
      </html>
    `;
  }, [products]);

  // Print and PDF functions
  const handlePrintInvoice = useCallback((invoice: InvoiceData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoiceContent = generateInvoiceHTML(invoice);
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [generateInvoiceHTML]);

  const handleDownloadPDF = useCallback((invoice: InvoiceData) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Add company header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', pageWidth - 60, yPosition);
      yPosition += 10;

      // Invoice details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice #: ${invoice.invoice_number}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Date: ${moment(invoice.invoice_date).format('DD/MM/YYYY')}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Due Date: ${invoice.due_date ? moment(invoice.due_date).format('DD/MM/YYYY') : 'N/A'}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Status: ${(invoice.status || '').toUpperCase()}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Company: ${invoice.company?.name || 'N/A'}`, 20, yPosition);
      yPosition += 15;

      // Invoice items table
      const tableData = invoice.items.map(item => {
        const product = products.find(p => p.id.toString() === item.product_id.toString());
        return [
          product?.name || 'Unknown Product',
          item.quantity,
          `${invoice.currency_code} ${parseFloat(item.unit_price).toFixed(2)}`,
          `${item.tax_rate}%`,
          `${invoice.currency_code} ${(parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2)}`
        ];
      });

      autoTable(doc, {
        head: [['Product', 'Quantity', 'Unit Price', 'Tax Rate', 'Line Total']],
        body: tableData,
        startY: yPosition,
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 30, halign: 'right' },
        },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || yPosition + (tableData.length * 10) + 50;

      // Totals
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Subtotal: ${invoice.currency_code} ${parseFloat(invoice.subtotal || '0').toFixed(2)}`, pageWidth - 60, finalY + 10);
      doc.text(`Tax Amount: ${invoice.currency_code} ${parseFloat(invoice.tax_amount || '0').toFixed(2)}`, pageWidth - 60, finalY + 20);
      doc.text(`Total Amount: ${invoice.currency_code} ${parseFloat(invoice.total_amount || '0').toFixed(2)}`, pageWidth - 60, finalY + 30);

      // Notes and terms
      if (invoice.notes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Notes:', 20, finalY + 50);
        const splitNotes = doc.splitTextToSize(invoice.notes || '', pageWidth - 40);
        doc.text(splitNotes, 20, finalY + 60);
      }

      if (invoice.terms_conditions) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Terms & Conditions:', 20, finalY + 80);
        const splitTerms = doc.splitTextToSize(invoice.terms_conditions || '', pageWidth - 40);
        doc.text(splitTerms, 20, finalY + 90);
      }

      // Save PDF
      doc.save(`invoice-${invoice.invoice_number}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  }, [products]);




  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Logs" />

      <PageHeader
        title="Invoices"
        showSearch={true}
        searchPlaceholder="Search invoices..."
        searchValue={currentFilters.search || ""}
        onSearchChange={(value) => handleFiltersChange({...currentFilters, search: value})}
        buttons={
          <Button variant="primary" size="sm" onClick={openCreateInvoiceModal}>New Invoice</Button>
        }
      />

      
     

      <GenericListPage
        columns={columns}
        fetchData={fetchInvoices}
        title="Invoices"
        searchPlaceholder="Search invoices..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
        search={false}
        tableStyle="table-style-2"
      />

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && (
        <Modal
          show={showCreateInvoiceModal}
          onHide={closeCreateInvoiceModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Create New Invoice</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceCompany">Company</label>
                  <select
                    className="form-control"
                    id="newInvoiceCompany"
                    value={newInvoice.company_id}
                    onChange={(e) =>
                      handleNewInvoiceChange("company_id", e.target.value)
                    }
                  >
                    <option value="">Select Company</option>
                    {companies.map((company: CompanyData) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceDate">Invoice Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="newInvoiceDate"
                    value={newInvoice.invoice_date}
                    onChange={(e) =>
                      handleNewInvoiceChange("invoice_date", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceDueDate">Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="newInvoiceDueDate"
                    value={newInvoice.due_date}
                    onChange={(e) =>
                      handleNewInvoiceChange("due_date", e.target.value)
                    }
                    min={moment().format("YYYY-MM-DD")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoicePaymentMode">Payment Mode</label>
                  <select
                    className="form-control"
                    id="newInvoicePaymentMode"
                    value={newInvoice.payment_mode}
                    onChange={(e) =>
                      handleNewInvoiceChange("payment_mode", e.target.value)
                    }
                  >
                    <option value="one_time">One Time</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Invoice Items Section */}
            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label>Invoice Items</label>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={addNewInvoiceItem}
                    >
                      Add Item
                    </Button>
                  </div>
                  
                  {newInvoice.items.length === 0 ? (
                    <div className="text-muted text-center py-3">
                      No items added yet. Click "Add Item" to start.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table style={{tableLayout: "fixed"}} className="table table-bordered">
                        <thead>
                          <tr>
                            <th colSpan={2}>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Tax Rate (%)</th>
                            <th>Line Total</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newInvoice.items.map((item, index) => {
                            const product = products.find(p => p.id.toString() === item.product_id);
                            const quantity = parseFloat(item.quantity) || 0;
                            const unitPrice = parseFloat(item.unit_price) || 0;
                            const taxRate = parseFloat(item.tax_rate) || 0;
                            const lineTotal = quantity * unitPrice;
                            const lineTax = lineTotal * taxRate / 100;
                            const lineTotalWithTax = lineTotal + lineTax;
                            
                            return (
                              <tr key={index}>
                                <td colSpan={2}>
                                  <select
                                    className="form-control form-control-sm"
                                    value={item.product_id}
                                    onChange={(e) => updateNewInvoiceItem(index, "product_id", e.target.value)}
                                  >
                                    <option value="">Select Product</option>
                                    {products.map((product) => (
                                      <option key={product.id} value={product.id.toString()}>
                                        {product.name} - {product.currency_code} {product.base_price}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    value={item.quantity}
                                    onChange={(e) => updateNewInvoiceItem(index, "quantity", e.target.value)}
                                    placeholder="0.00"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    value={item.unit_price}
                                    onChange={(e) => updateNewInvoiceItem(index, "unit_price", e.target.value)}
                                    placeholder="0.00"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    value={item.tax_rate}
                                    onChange={(e) => updateNewInvoiceItem(index, "tax_rate", e.target.value)}
                                    placeholder="0.00"
                                  />
                                </td>
                                <td>
                                  <span className="fw-bold">
                                    {newInvoice.currency_code} {lineTotalWithTax.toFixed(2)}
                                  </span>
                                </td>
                                <td>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => removeNewInvoiceItem(index)}
                                  >
                                    Remove
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceSubtotal">Subtotal</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="newInvoiceSubtotal"
                    value={newInvoice.subtotal}
                    readOnly
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceTaxAmount">Tax Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="newInvoiceTaxAmount"
                    value={newInvoice.tax_amount}
                    readOnly
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceTotalAmount">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="newInvoiceTotalAmount"
                    value={newInvoice.total_amount}
                    readOnly
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceCurrency">Currency</label>
                  <select
                    className="form-control"
                    id="newInvoiceCurrency"
                    value={newInvoice.currency_code}
                    onChange={(e) =>
                      handleNewInvoiceChange("currency_code", e.target.value)
                    }
                  >
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                    <option value="PKR">PKR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Methods Section */}
            {newInvoice.company_id && (
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label>Payment Methods</label>
                    <PaymentCardsDisplay 
                      paymentMethods={paymentMethods}
                      isLoadingPaymentMethods={isLoadingPaymentMethods}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceExchangeRate">Exchange Rate</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="form-control"
                    id="newInvoiceExchangeRate"
                    value={newInvoice.exchange_rate}
                    onChange={(e) =>
                      handleNewInvoiceChange("exchange_rate", e.target.value)
                    }
                    placeholder="1.000000"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceNotes">Notes</label>
                  <textarea
                    className="form-control"
                    id="newInvoiceNotes"
                    value={newInvoice.notes}
                    onChange={(e) =>
                      handleNewInvoiceChange("notes", e.target.value)
                    }
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceTerms">Terms & Conditions</label>
                  <textarea
                    className="form-control"
                    id="newInvoiceTerms"
                    value={newInvoice.terms_conditions}
                    onChange={(e) =>
                      handleNewInvoiceChange("terms_conditions", e.target.value)
                    }
                    rows={3}
                    placeholder="Terms and conditions..."
                  />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeCreateInvoiceModal}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitCreateInvoice}
              disabled={creatingInvoice}
            >
              {creatingInvoice ? "Creating..." : "Create Invoice"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Edit Invoice Modal */}
      {showEditInvoiceModal && selectedInvoice && (
        <Modal
          show={showEditInvoiceModal}
          onHide={closeEditInvoiceModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Edit Invoice #{selectedInvoice.invoice_number}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceCompany">Company</label>
                  <select
                    className="form-control"
                    id="editInvoiceCompany"
                    value={selectedInvoice.company_id || ""}
                    onChange={(e) =>
                      handleEditInvoiceChange("company_id", e.target.value)
                    }
                  >
                    <option value="">Select Company</option>
                    {companies.map((company: CompanyData) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceDate">Invoice Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="editInvoiceDate"
                    value={
                      selectedInvoice.invoice_date
                        ? moment(selectedInvoice.invoice_date).format(
                            "YYYY-MM-DD"
                          )
                        : ""
                    }
                    onChange={(e) =>
                      handleEditInvoiceChange("invoice_date", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceDueDate">Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="editInvoiceDueDate"
                    value={
                      selectedInvoice.due_date
                        ? moment(selectedInvoice.due_date).format("YYYY-MM-DD")
                        : ""
                    }
                    onChange={(e) =>
                      handleEditInvoiceChange("due_date", e.target.value)
                    }
                    min={moment().format("YYYY-MM-DD")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoicePaymentMode">Payment Mode</label>
                  <select
                    className="form-control"
                    id="editInvoicePaymentMode"
                    value={selectedInvoice.payment_mode || "one_time"}
                    onChange={(e) =>
                      handleEditInvoiceChange("payment_mode", e.target.value)
                    }
                  >
                    <option value="one_time">One Time</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Invoice Items Section */}
            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label>Invoice Items</label>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={addEditInvoiceItem}
                    >
                      Add Item
                    </Button>
                  </div>
                  
                  {selectedInvoice.items.length === 0 ? (
                    <div className="text-muted text-center py-3">
                      No items added yet. Click "Add Item" to start.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table style={{tableLayout: "fixed"}} className="table table-bordered">
                        <thead>
                          <tr>
                            <th colSpan={2}>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Tax Rate (%)</th>
                            <th>Line Total</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvoice.items.map((item, index) => {
                            const product = products.find(p => p.id.toString() === item.product_id);
                            const quantity = parseFloat(item.quantity) || 0;
                            const unitPrice = parseFloat(item.unit_price) || 0;
                            const taxRate = parseFloat(item.tax_rate) || 0;
                            const lineTotal = quantity * unitPrice;
                            const lineTax = lineTotal * taxRate / 100;
                            const lineTotalWithTax = lineTotal + lineTax;
                            
                            return (
                              <tr key={index}>
                                <td colSpan={2}>
                                  <select
                                    className="form-control form-control-sm"
                                    value={item.product_id}
                                    onChange={(e) => updateEditInvoiceItem(index, "product_id", e.target.value)}
                                  >
                                    <option value="">Select Product</option>
                                    {products.map((product) => (
                                      <option key={product.id} value={product.id.toString()}>
                                        {product.name} - {product.currency_code} {product.base_price}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    value={item.quantity}
                                    onChange={(e) => updateEditInvoiceItem(index, "quantity", e.target.value)}
                                    placeholder="0.00"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    value={item.unit_price}
                                    onChange={(e) => updateEditInvoiceItem(index, "unit_price", e.target.value)}
                                    placeholder="0.00"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    value={item.tax_rate}
                                    onChange={(e) => updateEditInvoiceItem(index, "tax_rate", e.target.value)}
                                    placeholder="0.00"
                                  />
                                </td>
                                <td>
                                  <span className="fw-bold">
                                    {selectedInvoice.currency_code} {lineTotalWithTax.toFixed(2)}
                                  </span>
                                </td>
                                <td>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => removeEditInvoiceItem(index)}
                                  >
                                    Remove
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceSubtotal">Subtotal</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="editInvoiceSubtotal"
                    value={selectedInvoice.subtotal || ""}
                    readOnly
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceTaxAmount">Tax Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="editInvoiceTaxAmount"
                    value={selectedInvoice.tax_amount || ""}
                    readOnly
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceTotalAmount">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="editInvoiceTotalAmount"
                    value={selectedInvoice.total_amount || ""}
                    readOnly
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceCurrency">Currency</label>
                  <select
                    className="form-control"
                    id="editInvoiceCurrency"
                    value={selectedInvoice.currency_code || "USD"}
                    onChange={(e) =>
                      handleEditInvoiceChange("currency_code", e.target.value)
                    }
                  >
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                    <option value="PKR">PKR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Methods Section */}
            {selectedInvoice.company_id && (
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label>Payment Methods</label>
                    <PaymentCardsDisplay 
                      paymentMethods={paymentMethods}
                      isLoadingPaymentMethods={isLoadingPaymentMethods}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceExchangeRate">Exchange Rate</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="form-control"
                    id="editInvoiceExchangeRate"
                    value={selectedInvoice.exchange_rate || "1.000000"}
                    onChange={(e) =>
                      handleEditInvoiceChange("exchange_rate", e.target.value)
                    }
                    placeholder="1.000000"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceNotes">Notes</label>
                  <textarea
                    className="form-control"
                    id="editInvoiceNotes"
                    value={selectedInvoice.notes || ""}
                    onChange={(e) =>
                      handleEditInvoiceChange("notes", e.target.value)
                    }
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceTerms">Terms & Conditions</label>
                  <textarea
                    className="form-control"
                    id="editInvoiceTerms"
                    value={selectedInvoice.terms_conditions || ""}
                    onChange={(e) =>
                      handleEditInvoiceChange(
                        "terms_conditions",
                        e.target.value
                      )
                    }
                    rows={3}
                    placeholder="Terms and conditions..."
                  />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeEditInvoiceModal}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitEditInvoice}
              disabled={editingInvoice}
            >
              {editingInvoice ? "Updating..." : "Update Invoice"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Delete Invoice Modal */}
      {showDeleteInvoiceModal && selectedInvoice && (
        <Modal
          show={showDeleteInvoiceModal}
          onHide={() => setShowDeleteInvoiceModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Delete Invoice?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to delete invoice{" "}
              <b className="text-danger">#{selectedInvoice.invoice_number}</b>?
            </p>
            <p>
              This action cannot be undone.
            </p>
            <p>
              Type the word <b className="text-danger">DELETE</b> to confirm
            </p>
            <input
              type="text"
              className="form-control"
              id="confirmDeleteInvoice"
              value={confirmDeleteInvoice}
              onChange={(e) => setConfirmDeleteInvoice(e.target.value)}
              placeholder="Type the word DELETE to confirm"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteInvoiceModal(false)}
            >
              Close
            </Button>
            <Button variant="danger" onClick={handleSubmitDeleteInvoice}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoiceForPayment && (
        <Modal
          show={showPaymentModal}
          onHide={closePaymentModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <FiDollarSign className="me-2" />
              Process Payment - Invoice #{selectedInvoiceForPayment.invoice_number}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Invoice Summary */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Invoice Summary</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Company:</strong> {selectedInvoiceForPayment.company?.name}</p>
                    <p><strong>Invoice Date:</strong> {moment(selectedInvoiceForPayment.invoice_date).format('DD/MM/YYYY')}</p>
                    <p><strong>Due Date:</strong> {selectedInvoiceForPayment.due_date ? moment(selectedInvoiceForPayment.due_date).format('DD/MM/YYYY') : 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Subtotal:</strong> {selectedInvoiceForPayment.currency_code} {parseFloat(selectedInvoiceForPayment.subtotal || '0').toFixed(2)}</p>
                    <p><strong>Tax Amount:</strong> {selectedInvoiceForPayment.currency_code} {parseFloat(selectedInvoiceForPayment.tax_amount || '0').toFixed(2)}</p>
                    <p><strong className="text-primary">Total Amount:</strong> {selectedInvoiceForPayment.currency_code} {parseFloat(selectedInvoiceForPayment.total_amount || '0').toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-4">
              <h6 className="mb-3">Select Payment Method</h6>
              <PaymentMethodSelector
                paymentMethods={paymentMethods}
                selectedPaymentMethod={selectedPaymentMethod}
                onPaymentMethodSelect={setSelectedPaymentMethod}
                isLoadingPaymentMethods={isLoadingPaymentMethods}
              />
            </div>

            {/* Payment Notes */}
            <div className="mb-3">
              <label htmlFor="paymentNotes" className="form-label">Payment Notes (Optional)</label>
              <textarea
                className="form-control"
                id="paymentNotes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes about this payment..."
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closePaymentModal}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleProcessPayment}
              disabled={!selectedPaymentMethod || isProcessingPayment}
            >
              {isProcessingPayment ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Processing...
                </>
              ) : (
                <>
                  <FiDollarSign className="me-2" />
                  Process Payment
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </React.Fragment>
  );
};

InvoiceList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default InvoiceList;
