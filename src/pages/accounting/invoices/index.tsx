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
  createDirectPayment,
  InvoiceData,
  InvoiceCreateUpdatePayload,
  InvoiceItemCreateUpdatePayload,
  InvoiceItemData,
  CompanyData,
  ProductData,
  PaymentMethodData,
  InvoicePaymentPayload,
  CreateDirectPaymentData,
  PaymentIntentResponse,
} from "@utils/accounting";
import { getCompanies } from "@utils/accounting";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row, Form, Alert } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import moment from "moment";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { FaShieldAlt, FaCreditCard, FaPlus } from "react-icons/fa";

import "@assets/scss/common.scss";

import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import PageSummaryGrid from "@components/PageSummaryGrid";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";

import { motion } from "framer-motion";
import { FiEdit, FiTrash2, FiPrinter, FiDownload, FiCreditCard, FiDollarSign } from "react-icons/fi";
import TableAction, { Action } from "@components/TableAction";
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


// Payment Hook Return Type
interface UseCreateInvoicePaymentReturn {
  createInvoicePayment: (data: CreateDirectPaymentData, callbacks?: {
    onSuccess?: (response: PaymentIntentResponse) => void;
    onError?: (error: any) => void;
  }) => Promise<void>;
  isCreateInvoicePaymentPending: boolean;
  isCreateInvoicePaymentError: boolean;
  createInvoicePaymentError: any;
}

// Utility function to format currency
const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
};

// Exchange rate interface
interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

// Function to fetch exchange rates from Stripe
const fetchExchangeRates = async (fromCurrency: string, toCurrency: string): Promise<ExchangeRate | null> => {
  try {
    // Using a free exchange rate API as Stripe doesn't provide public exchange rate API
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const data = await response.json();
    
    if (data.rates && data.rates[toCurrency]) {
      return {
        from: fromCurrency,
        to: toCurrency,
        rate: data.rates[toCurrency],
        timestamp: Date.now()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return null;
  }
};


// Custom hook for creating invoice payments
const useCreateInvoicePayment = (): UseCreateInvoicePaymentReturn => {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<any>(null);

  const createInvoicePayment = useCallback(async (
    data: CreateDirectPaymentData,
    callbacks?: {
      onSuccess?: (response: PaymentIntentResponse) => void;
      onError?: (error: any) => void;
    }
  ) => {
    setIsPending(true);
    setIsError(false);
    setError(null);

    try {
      const response = await createDirectPayment(data);
      callbacks?.onSuccess?.(response);
    } catch (err) {
      setIsError(true);
      setError(err);
      callbacks?.onError?.(err);
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    createInvoicePayment,
    isCreateInvoicePaymentPending: isPending,
    isCreateInvoicePaymentError: isError,
    createInvoicePaymentError: error,
  };
};

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

// Direct Card Payment Form Component
const DirectCardPaymentForm: React.FC<{
  amount: number;
  currency: string;
  invoiceId: number;
  customerId: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  onSwitchToAddCard: () => void;
}> = ({ amount, currency, invoiceId, customerId, onPaymentSuccess, onPaymentError, onSwitchToAddCard }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Use the invoice payment hook
  const { 
    createInvoicePayment, 
    isCreateInvoicePaymentPending, 
    isCreateInvoicePaymentError, 
    createInvoicePaymentError 
  } = useCreateInvoicePayment();
  const [cardComplete, setCardComplete] = useState(false);

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onPaymentError('Stripe has not loaded yet');
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
      });

      if (error) {
        setCardError(error.message || 'Failed to create payment method');
        setIsProcessing(false);
        return;
      }

      // Create payment intent using the hook
      createInvoicePayment({
        amount: amount, // Send amount in original currency units (not cents)
        currency: currency.toLowerCase(),
        payment_method_id: paymentMethod.id,
        invoice_id: invoiceId,
        customer_id: customerId,
      }, {
        onSuccess: (paymentResult) => {
          // Handle payment result based on status
          console.log(paymentResult, "RARARA");
          if ((paymentResult as any).success) {
              toast.success('Payment successful!');
              onPaymentSuccess();}
            else{
              onPaymentError('Payment was not successful. Status: ' + paymentResult.status);
          }
          setIsProcessing(false);
        },
        onError: (error) => {
          onPaymentError(error.message || 'Payment processing failed');
          setIsProcessing(false);
        }
      });
    } catch (error: any) {
      onPaymentError(error.message || 'Payment processing failed');
      setIsProcessing(false);
    }
  };

  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Card Information <span className="text-danger">*</span>
            </Form.Label>
            <div className="p-3 border rounded bg-light">
              <CardElement
                options={CARD_ELEMENT_OPTIONS}
                onChange={handleCardChange}
              />
            </div>
            {cardError && (
              <Alert variant="danger" className="mt-2 py-2">
                <small>{cardError}</small>
              </Alert>
            )}
            <Form.Text className="text-muted d-flex align-items-center mt-2">
              <FaShieldAlt className="me-1" />
              <small>Your card information is securely processed by Stripe</small>
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <div className="d-flex align-items-center h-100">
            <div className="text-muted">
              <small>
                <FaShieldAlt className="me-1" />
                Secure SSL encryption
              </small>
            </div>
          </div>
        </Col>
        <Col md={6}>
          <div className="text-end">
            <div className="h5 mb-0 text-success">
              {formatCurrency(amount, currency)}
            </div>
            <small className="text-muted">Payment Amount</small>
          </div>
        </Col>
      </Row>

      <div className="d-flex gap-2 mt-3">
        <Button
          type="submit"
          variant="success"
          disabled={!cardComplete || isProcessing || isCreateInvoicePaymentPending}
          className="flex-fill"
        >
          {isProcessing || isCreateInvoicePaymentPending ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing Payment...
            </>
          ) : (
            <>
              <FaCreditCard className="me-2" />
              Pay Now
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline-primary"
          onClick={onSwitchToAddCard}
          disabled={isProcessing}
        >
          <FaPlus className="me-1" />
          Add Card
        </Button>
      </div>

      {isCreateInvoicePaymentError && (
        <Alert variant="danger" className="mt-3">
          {createInvoicePaymentError?.message || 'Payment processing failed'}
        </Alert>
      )}
    </Form>
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
  const [paymentMode, setPaymentMode] = useState<'saved' | 'direct'>('saved');
  const [stripePublishableKey, setStripePublishableKey] = useState<string>("");
  
  // Exchange rate states
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [isLoadingExchangeRates, setIsLoadingExchangeRates] = useState<boolean>(false);
  const [baseCurrency, setBaseCurrency] = useState<string>("USD");

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
            <TableAction actions={actions as Action[]} />
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

  // Load Stripe publishable key
  const loadStripePublishableKey = useCallback(async () => {
    try {
      // You'll need to implement getPublishableKey in your accounting utils
      // For now, we'll use a placeholder or get it from environment
      const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
      setStripePublishableKey(key);
    } catch (error) {
      console.error("Error loading Stripe publishable key:", error);
    }
  }, []);

  // Load exchange rates
  const loadExchangeRates = useCallback(async (fromCurrency: string) => {
    const currencies = ['USD', 'EUR', 'GBP', 'AED', 'PKR'];
    setIsLoadingExchangeRates(true);
    
    try {
      const rates: ExchangeRate[] = [];
      
      for (const toCurrency of currencies) {
        if (toCurrency !== fromCurrency) {
          const rate = await fetchExchangeRates(fromCurrency, toCurrency);
          if (rate) {
            rates.push(rate);
          }
        }
      }
      
      setExchangeRates(rates);
      setBaseCurrency(fromCurrency);
    } catch (error) {
      console.error("Error loading exchange rates:", error);
    } finally {
      setIsLoadingExchangeRates(false);
    }
  }, []);

  // Get exchange rate for a specific currency pair
  const getExchangeRate = useCallback((fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return 1;
    
    const rate = exchangeRates.find(r => r.from === fromCurrency && r.to === toCurrency);
    if (rate) return rate.rate;
    
    // If no rate found and we're loading, return 1 to avoid showing wrong amounts
    if (isLoadingExchangeRates) return 1;
    
    // If no rate found and not loading, try to fetch it immediately
    if (exchangeRates.length === 0) {
      console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      return 1;
    }
    
    return 1;
  }, [exchangeRates, isLoadingExchangeRates]);

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
    loadStripePublishableKey();
    loadExchangeRates('USD'); // Load exchange rates with USD as base
  }, [loadStripePublishableKey, loadExchangeRates]);


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
      // Get company VAT rate and exemption status
      const selectedCompany = companies.find(c => c.id.toString() === selectedInvoice.company_id);
      const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
      const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
      
      const totals = calculateTotals(selectedInvoice.items, companyVatRate, isVatExempt, 'USD', selectedInvoice.currency_code || 'USD');
      const invoiceData: InvoiceCreateUpdatePayload = {
        company_id: selectedInvoice.company_id,
        invoice_date: selectedInvoice.invoice_date,
        due_date: selectedInvoice.due_date,
        payment_mode: selectedInvoice.payment_mode,
        currency_code: selectedInvoice.currency_code,
        tax_amount: totals.tax_amount,
        notes: selectedInvoice.notes || "",
        terms_conditions: selectedInvoice.terms_conditions || "",
        items: selectedInvoice.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: companyVatRate.toString(), // Use company VAT rate for all items
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
    tax_amount: 0,
    notes: "",
    terms_conditions: "",
    items: [],
    subtotal: 0,
    total_amount: 0,
  });

  // Recalculate totals when exchange rates change
  useEffect(() => {
    if (exchangeRates.length > 0 && !isLoadingExchangeRates) {
      // Recalculate new invoice totals if currency is not USD
      if (newInvoice.currency_code && newInvoice.currency_code !== 'USD' && newInvoice.items.length > 0) {
        const selectedCompany = companies.find(c => c.id.toString() === newInvoice.company_id);
        const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
        const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
        const totals = calculateTotals(newInvoice.items, companyVatRate, isVatExempt, 'USD', newInvoice.currency_code);
        
        setNewInvoice(prev => ({
          ...prev,
          ...totals
        }));
      }
      
      // Recalculate selected invoice totals if currency is not USD
      if (selectedInvoice?.currency_code && selectedInvoice.currency_code !== 'USD' && selectedInvoice.items.length > 0) {
        const selectedCompany = companies.find(c => c.id.toString() === selectedInvoice.company_id);
        const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
        const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
        const totals = calculateTotals(selectedInvoice.items, companyVatRate, isVatExempt, 'USD', selectedInvoice.currency_code);
        
        setSelectedInvoice(prev => ({
          ...prev!,
          subtotal: totals.subtotal.toString(),
          tax_amount: totals.tax_amount.toString(),
          total_amount: totals.total_amount.toString(),
        }));
      }
    }
  }, [exchangeRates, isLoadingExchangeRates, newInvoice.currency_code, newInvoice.company_id, newInvoice.items, selectedInvoice?.currency_code, selectedInvoice?.company_id, selectedInvoice?.items, companies]);

  // Helper function to calculate totals using company VAT rate, exemption status, and exchange rate
  const calculateTotals = (items: InvoiceItemCreateUpdatePayload[], companyVatRate: number = 0, isVatExempt: boolean = false, fromCurrency: string = 'USD', toCurrency: string = 'USD') => {
    const subtotal = items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
    
    // Calculate tax amount based on VAT exemption status
    const taxAmount = isVatExempt ? 0 : subtotal * (companyVatRate / 100);
    const totalBeforeConversion = subtotal + taxAmount;
    
    // Apply exchange rate conversion if currency is different from USD
    const exchangeRate = getExchangeRate(fromCurrency, toCurrency);
    const convertedSubtotal = subtotal * exchangeRate;
    const convertedTaxAmount = taxAmount * exchangeRate;
    const convertedTotal = totalBeforeConversion * exchangeRate;
    
    return {
      subtotal: parseFloat(convertedSubtotal.toFixed(2)),
      tax_amount: parseFloat(convertedTaxAmount.toFixed(2)),
      total_amount: parseFloat(convertedTotal.toFixed(2))
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
      // Get company VAT rate and exemption status
      const selectedCompany = companies.find(c => c.id.toString() === newInvoice.company_id);
      const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
      const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
      
      const totals = calculateTotals(newInvoice.items, companyVatRate, isVatExempt, 'USD', newInvoice.currency_code);
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
    setPaymentMode('saved');
  }, []);

  // Payment mode handlers
  const handleSwitchToDirectPayment = useCallback(() => {
    setPaymentMode('direct');
  }, []);

  const handleSwitchToSavedPayment = useCallback(() => {
    setPaymentMode('saved');
  }, []);

  // Direct payment handlers
  const handleDirectPaymentSuccess = useCallback(() => {
    toast.success("Payment processed successfully");
    
    // Close modal and reset state
    setShowPaymentModal(false);
    setSelectedInvoiceForPayment(null);
    setSelectedPaymentMethod("");
    setPaymentNotes("");
    setPaymentMethods([]);
    setPaymentMode('saved');
    
    // Refresh the invoice list
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleDirectPaymentError = useCallback((error: string) => {
    toast.error(error);
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
      tax_rate: "0.00", // This will be overridden by company VAT rate
    };
    
    const updatedItems = [...newInvoice.items, newItem];
    // Get company VAT rate and exemption status
    const selectedCompany = companies.find(c => c.id.toString() === newInvoice.company_id);
    const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
    const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
    const totals = calculateTotals(updatedItems, companyVatRate, isVatExempt, 'USD', newInvoice.currency_code);
    
    setNewInvoice(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  }, [newInvoice.items, newInvoice.company_id, companies]);

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
    
    // Get company VAT rate and exemption status
    const selectedCompany = companies.find(c => c.id.toString() === newInvoice.company_id);
    const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
    const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
    const totals = calculateTotals(updatedItems, companyVatRate, isVatExempt, 'USD', newInvoice.currency_code);
    
    setNewInvoice(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  }, [newInvoice.items, newInvoice.company_id, products, companies]);

  const removeNewInvoiceItem = useCallback((index: number) => {
    const updatedItems = newInvoice.items.filter((_, i) => i !== index);
    // Get company VAT rate and exemption status
    const selectedCompany = companies.find(c => c.id.toString() === newInvoice.company_id);
    const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
    const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
    const totals = calculateTotals(updatedItems, companyVatRate, isVatExempt, 'USD', newInvoice.currency_code);
    
    setNewInvoice(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  }, [newInvoice.items, newInvoice.company_id, companies]);

  const addEditInvoiceItem = useCallback(() => {
    if (!selectedInvoice) return;
    
    const newItem: InvoiceItemCreateUpdatePayload = {
      product_id: "",
      quantity: "1",
      unit_price: "0.00",
      tax_rate: "0.00", // This will be overridden by company VAT rate
    };
    
    const updatedItems = [...selectedInvoice.items, newItem];
    // Get company VAT rate and exemption status
    const selectedCompany = companies.find(c => c.id.toString() === selectedInvoice.company_id);
    const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
    const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
    const totals = calculateTotals(updatedItems, companyVatRate, isVatExempt, 'USD', selectedInvoice.currency_code || 'USD');
    
    setSelectedInvoice(prev => ({
      ...prev!,
      items: updatedItems,
      subtotal: totals.subtotal.toString(),
      tax_amount: totals.tax_amount.toString(),
      total_amount: totals.total_amount.toString(),
    }));
  }, [selectedInvoice, companies]);

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
    
    // Get company VAT rate and exemption status
    const selectedCompany = companies.find(c => c.id.toString() === selectedInvoice.company_id);
    const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
    const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
    const totals = calculateTotals(updatedItems, companyVatRate, isVatExempt, 'USD', selectedInvoice.currency_code || 'USD');
    
    setSelectedInvoice(prev => ({
      ...prev!,
      items: updatedItems,
      subtotal: totals.subtotal.toString(),
      tax_amount: totals.tax_amount.toString(),
      total_amount: totals.total_amount.toString(),
    }));
  }, [selectedInvoice, products, companies]);

  const removeEditInvoiceItem = useCallback((index: number) => {
    if (!selectedInvoice) return;
    
    const updatedItems = selectedInvoice.items.filter((_, i) => i !== index);
    // Get company VAT rate and exemption status
    const selectedCompany = companies.find(c => c.id.toString() === selectedInvoice.company_id);
    const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
    const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
    const totals = calculateTotals(updatedItems, companyVatRate, isVatExempt, 'USD', selectedInvoice.currency_code || 'USD');
    
    setSelectedInvoice(prev => ({
      ...prev!,
      items: updatedItems,
      subtotal: totals.subtotal.toString(),
      tax_amount: totals.tax_amount.toString(),
      total_amount: totals.total_amount.toString(),
    }));
  }, [selectedInvoice, companies]);

  // Input handlers
  const handleNewInvoiceChange = useCallback(
    (field: keyof InvoiceCreateUpdatePayload, value: any) => {
      setNewInvoice((prev: InvoiceCreateUpdatePayload) => {
        const updatedInvoice = {
          ...prev,
          [field]: value,
        };
        
        // Recalculate totals when company changes
        if (field === 'company_id' && value) {
          const selectedCompany = companies.find(c => c.id.toString() === value);
          const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
          const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
          const totals = calculateTotals(updatedInvoice.items, companyVatRate, isVatExempt, 'USD', updatedInvoice.currency_code || 'USD');
          return {
            ...updatedInvoice,
            ...totals
          };
        }
        
        // Recalculate totals when currency changes
        if (field === 'currency_code' && value) {
          const selectedCompany = companies.find(c => c.id.toString() === updatedInvoice.company_id);
          const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
          const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
          const totals = calculateTotals(updatedInvoice.items, companyVatRate, isVatExempt, 'USD', value);
          return {
            ...updatedInvoice,
            ...totals
          };
        }
        
        return updatedInvoice;
      });
      
      // Load payment methods when company is selected
      if (field === 'company_id' && value) {
        console.log("Company selected in create modal:", value);
        loadPaymentMethods(parseInt(value));
      }
      
      // Load exchange rates when currency changes
      if (field === 'currency_code' && value) {
        console.log("Currency changed in create modal:", value);
        loadExchangeRates(value);
        setBaseCurrency(value);
      }
    },
    [loadPaymentMethods, loadExchangeRates, companies]
  );

  const handleEditInvoiceChange = useCallback(
    (field: keyof InvoiceFormData, value: any) => {
      setSelectedInvoice((prev: InvoiceFormData | null) => {
        const updatedInvoice = {
          ...prev!,
          [field]: value,
        };
        
        // Recalculate totals when company changes
        if (field === 'company_id' && value) {
          const selectedCompany = companies.find(c => c.id.toString() === value);
          const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
          const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
          const totals = calculateTotals(updatedInvoice.items, companyVatRate, isVatExempt, 'USD', updatedInvoice.currency_code || 'USD');
          return {
            ...updatedInvoice,
            subtotal: totals.subtotal.toString(),
            tax_amount: totals.tax_amount.toString(),
            total_amount: totals.total_amount.toString(),
          };
        }
        
        // Recalculate totals when currency changes
        if (field === 'currency_code' && value) {
          const selectedCompany = companies.find(c => c.id.toString() === updatedInvoice.company_id);
          const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
          const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
          const totals = calculateTotals(updatedInvoice.items, companyVatRate, isVatExempt, 'USD', value);
          return {
            ...updatedInvoice,
            subtotal: totals.subtotal.toString(),
            tax_amount: totals.tax_amount.toString(),
            total_amount: totals.total_amount.toString(),
          };
        }
        
        return updatedInvoice;
      });
      
      // Load payment methods when company is selected
      if (field === 'company_id' && value) {
        console.log("Company selected in edit modal:", value);
        loadPaymentMethods(parseInt(value));
      }
      
      // Load exchange rates when currency changes
      if (field === 'currency_code' && value) {
        console.log("Currency changed in edit modal:", value);
        loadExchangeRates(value);
        setBaseCurrency(value);
      }
    },
    [loadPaymentMethods, loadExchangeRates, companies]
  );


  const generateInvoiceHTML = useCallback((invoice: InvoiceData) => {
    // Get company VAT rate
    const companyVatRate = invoice.company?.profile?.vat_rate ? parseFloat(invoice.company.profile.vat_rate) : 0;
    const isVatExempt = invoice.company?.profile?.vat_exemption;
    
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
          .vat-info { margin-bottom: 20px; padding: 10px; background-color: #f8f9fa; border-left: 4px solid #007bff; }
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
          ${invoice.company?.profile?.tax_id ? `<div><strong>Tax ID:</strong> ${invoice.company.profile.tax_id}</div>` : ''}
        </div>

        <div class="vat-info">
          <strong>VAT Information:</strong> ${isVatExempt ? 'VAT Exempt' : `VAT Rate: ${companyVatRate}%`}
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => {
              const product = products.find(p => p.id.toString() === item.product_id.toString());
              const lineTotalUSD = parseFloat(item.quantity) * parseFloat(item.unit_price);
              const exchangeRate = getExchangeRate('USD', invoice.currency_code || 'USD');
              const lineTotal = lineTotalUSD * exchangeRate;
              return `
                <tr>
                  <td>${product?.name || 'Unknown Product'}</td>
                  <td>${item.quantity}</td>
                  <td>${invoice.currency_code} ${(parseFloat(item.unit_price) * exchangeRate).toFixed(2)}</td>
                  <td>${invoice.currency_code} ${lineTotal.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div><strong>Subtotal:</strong> ${invoice.currency_code} ${parseFloat(invoice.subtotal || '0').toFixed(2)}</div>
          <div><strong>VAT Amount (${isVatExempt ? 'Exempt' : companyVatRate + '%'}):</strong> ${invoice.currency_code} ${parseFloat(invoice.tax_amount || '0').toFixed(2)}</div>
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

      // Get company VAT rate
      const companyVatRate = invoice.company?.profile?.vat_rate ? parseFloat(invoice.company.profile.vat_rate) : 0;
      const isVatExempt = invoice.company?.profile?.vat_exemption;

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
      yPosition += 8;
      if (invoice.company?.profile?.tax_id) {
        doc.text(`Tax ID: ${invoice.company.profile.tax_id}`, 20, yPosition);
        yPosition += 8;
      }
      yPosition += 7;

      // VAT Information
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`VAT Information: ${isVatExempt ? 'VAT Exempt' : `VAT Rate: ${companyVatRate}%`}`, 20, yPosition);
      yPosition += 15;

      // Invoice items table
      const tableData = invoice.items.map(item => {
        const product = products.find(p => p.id.toString() === item.product_id.toString());
        const lineTotalUSD = parseFloat(item.quantity) * parseFloat(item.unit_price);
        const exchangeRate = getExchangeRate('USD', invoice.currency_code || 'USD');
        const lineTotal = lineTotalUSD * exchangeRate;
        return [
          product?.name || 'Unknown Product',
          item.quantity,
          `${invoice.currency_code} ${(parseFloat(item.unit_price) * exchangeRate).toFixed(2)}`,
          `${invoice.currency_code} ${lineTotal.toFixed(2)}`
        ];
      });

      autoTable(doc, {
        head: [['Product', 'Quantity', 'Unit Price', 'Line Total']],
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
          0: { cellWidth: 70 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' },
        },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || yPosition + (tableData.length * 10) + 50;

      // Totals
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Subtotal: ${invoice.currency_code} ${parseFloat(invoice.subtotal || '0').toFixed(2)}`, pageWidth - 60, finalY + 10);
      doc.text(`VAT Amount (${isVatExempt ? 'Exempt' : companyVatRate + '%'}): ${invoice.currency_code} ${parseFloat(invoice.tax_amount || '0').toFixed(2)}`, pageWidth - 60, finalY + 20);
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
                            <th>Line Total</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newInvoice.items.map((item, index) => {
                            const product = products.find(p => p.id.toString() === item.product_id);
                            const quantity = parseFloat(item.quantity) || 0;
                            const unitPrice = parseFloat(item.unit_price) || 0;
                            const lineTotalUSD = quantity * unitPrice;
                            const exchangeRate = getExchangeRate('USD', newInvoice.currency_code);
                            const lineTotal = lineTotalUSD * exchangeRate;
                            
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
                                  <span className="fw-bold">
                                    {isLoadingExchangeRates && newInvoice.currency_code !== 'USD' ? (
                                      <span className="text-muted">
                                        <Spinner animation="border" size="sm" className="me-1" />
                                        Loading...
                                      </span>
                                    ) : (
                                      `${newInvoice.currency_code} ${lineTotal.toFixed(2)}`
                                    )}
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
                    value={isLoadingExchangeRates && newInvoice.currency_code !== 'USD' ? 'Loading...' : newInvoice.subtotal}
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
                    value={isLoadingExchangeRates && newInvoice.currency_code !== 'USD' ? 'Loading...' : newInvoice.tax_amount}
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
                    value={isLoadingExchangeRates && newInvoice.currency_code !== 'USD' ? 'Loading...' : newInvoice.total_amount}
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

            {/* Exchange Rates Display */}
            {exchangeRates.length > 0 && (
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label>Exchange Rates (Base: {newInvoice.currency_code})</label>
                    <div className="card">
                      <div className="card-body">
                        {isLoadingExchangeRates ? (
                          <div className="text-center py-2">
                            <Spinner animation="border" size="sm" className="me-2" />
                            <span>Loading exchange rates...</span>
                          </div>
                        ) : (
                          <div className="row">
                            {exchangeRates.map((rate) => (
                              <div key={`${rate.from}-${rate.to}`} className="col-md-2 mb-2">
                                <div className="text-center p-2 border rounded">
                                  <div className="fw-bold text-primary">{rate.to}</div>
                                  <div className="text-muted small">
                                    {rate.rate.toFixed(4)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-2">
                          <small className="text-muted">
                            <i className="fas fa-info-circle me-1"></i>
                            Exchange rates are updated in real-time. Last updated: {new Date().toLocaleTimeString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Company VAT Information */}
            {newInvoice.company_id && (
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label>Company VAT Information</label>
                    <div className="card">
                      <div className="card-body">
                        {(() => {
                          const selectedCompany = companies.find(c => c.id.toString() === newInvoice.company_id);
                          const vatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
                          const isVatExempt = selectedCompany?.profile?.vat_exemption;
                          
                          return (
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>VAT Rate:</strong> {isVatExempt ? 'Exempt' : `${vatRate}%`}
                                {selectedCompany?.profile?.tax_id && (
                                  <div className="text-muted small">
                                    <strong>Tax ID:</strong> {selectedCompany.profile.tax_id}
                                  </div>
                                )}
                              </div>
                              <div className="text-muted small">
                                Tax will be calculated automatically based on company VAT rate
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                            <th>Line Total</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvoice.items.map((item, index) => {
                            const product = products.find(p => p.id.toString() === item.product_id);
                            const quantity = parseFloat(item.quantity) || 0;
                            const unitPrice = parseFloat(item.unit_price) || 0;
                            const lineTotalUSD = quantity * unitPrice;
                            const exchangeRate = getExchangeRate('USD', selectedInvoice?.currency_code || 'USD');
                            const lineTotal = lineTotalUSD * exchangeRate;
                            
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
                                  <span className="fw-bold">
                                    {isLoadingExchangeRates && selectedInvoice?.currency_code !== 'USD' ? (
                                      <span className="text-muted">
                                        <Spinner animation="border" size="sm" className="me-1" />
                                        Loading...
                                      </span>
                                    ) : (
                                      `${selectedInvoice.currency_code} ${lineTotal.toFixed(2)}`
                                    )}
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
                    value={isLoadingExchangeRates && selectedInvoice?.currency_code !== 'USD' ? 'Loading...' : (selectedInvoice.subtotal || "")}
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
                    value={isLoadingExchangeRates && selectedInvoice?.currency_code !== 'USD' ? 'Loading...' : (selectedInvoice.tax_amount || "")}
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
                    value={isLoadingExchangeRates && selectedInvoice?.currency_code !== 'USD' ? 'Loading...' : (selectedInvoice.total_amount || "")}
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

            {/* Exchange Rates Display */}
            {exchangeRates.length > 0 && (
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label>Exchange Rates (Base: {newInvoice.currency_code})</label>
                    <div className="card">
                      <div className="card-body">
                        {isLoadingExchangeRates ? (
                          <div className="text-center py-2">
                            <Spinner animation="border" size="sm" className="me-2" />
                            <span>Loading exchange rates...</span>
                          </div>
                        ) : (
                          <div className="row">
                            {exchangeRates.map((rate) => (
                              <div key={`${rate.from}-${rate.to}`} className="col-md-2 mb-2">
                                <div className="text-center p-2 border rounded">
                                  <div className="fw-bold text-primary">{rate.to}</div>
                                  <div className="text-muted small">
                                    {rate.rate.toFixed(4)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-2">
                          <small className="text-muted">
                            <i className="fas fa-info-circle me-1"></i>
                            Exchange rates are updated in real-time. Last updated: {new Date().toLocaleTimeString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Company VAT Information */}
            {selectedInvoice.company_id && (
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label>Company VAT Information</label>
                    <div className="card">
                      <div className="card-body">
                        {(() => {
                          const selectedCompany = companies.find(c => c.id.toString() === selectedInvoice.company_id);
                          const vatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
                          const isVatExempt = selectedCompany?.profile?.vat_exemption;
                          
                          return (
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>VAT Rate:</strong> {isVatExempt ? 'Exempt' : `${vatRate}%`}
                                {selectedCompany?.profile?.tax_id && (
                                  <div className="text-muted small">
                                    <strong>Tax ID:</strong> {selectedCompany.profile.tax_id}
                                  </div>
                                )}
                              </div>
                              <div className="text-muted small">
                                Tax will be calculated automatically based on company VAT rate
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                    
                    {/* Currency Conversion Display */}
                    {exchangeRates.length > 0 && baseCurrency !== selectedInvoiceForPayment.currency_code && (
                      <div className="mt-3 p-2 bg-light rounded">
                        <small className="text-muted">Converted to {baseCurrency}:</small>
                        <div className="mt-1">
                          <div><strong>Subtotal:</strong> {baseCurrency} {(parseFloat(selectedInvoiceForPayment.subtotal || '0') * getExchangeRate(selectedInvoiceForPayment.currency_code || 'USD', baseCurrency)).toFixed(2)}</div>
                          <div><strong>Tax Amount:</strong> {baseCurrency} {(parseFloat(selectedInvoiceForPayment.tax_amount || '0') * getExchangeRate(selectedInvoiceForPayment.currency_code || 'USD', baseCurrency)).toFixed(2)}</div>
                          <div><strong className="text-primary">Total Amount:</strong> {baseCurrency} {(parseFloat(selectedInvoiceForPayment.total_amount || '0') * getExchangeRate(selectedInvoiceForPayment.currency_code || 'USD', baseCurrency)).toFixed(2)}</div>
                        </div>
                        <small className="text-muted">
                          Exchange Rate: 1 {selectedInvoiceForPayment.currency_code} = {getExchangeRate(selectedInvoiceForPayment.currency_code || 'USD', baseCurrency).toFixed(4)} {baseCurrency}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Payment Method</h6>
                <div className="btn-group" role="group">
                  <Button
                    variant={paymentMode === 'saved' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={handleSwitchToSavedPayment}
                  >
                    <FiCreditCard className="me-1" />
                    Saved Cards
                  </Button>
                  <Button
                    variant={paymentMode === 'direct' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={handleSwitchToDirectPayment}
                  >
                    <FaCreditCard className="me-1" />
                    Enter Card
                  </Button>
                </div>
              </div>

              {paymentMode === 'saved' ? (
                <PaymentMethodSelector
                  paymentMethods={paymentMethods}
                  selectedPaymentMethod={selectedPaymentMethod}
                  onPaymentMethodSelect={setSelectedPaymentMethod}
                  isLoadingPaymentMethods={isLoadingPaymentMethods}
                />
              ) : (
                stripePublishableKey ? (
                  <Elements stripe={loadStripe(stripePublishableKey)}>
                    <DirectCardPaymentForm
                      amount={parseFloat(selectedInvoiceForPayment.total_amount || '0')}
                      currency={selectedInvoiceForPayment.currency_code || 'USD'}
                      invoiceId={selectedInvoiceForPayment.id}
                      customerId={parseInt(selectedInvoiceForPayment.company_id || '0')}
                      onPaymentSuccess={handleDirectPaymentSuccess}
                      onPaymentError={handleDirectPaymentError}
                      onSwitchToAddCard={handleSwitchToSavedPayment}
                    />
                  </Elements>
                ) : (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Loading Stripe...</span>
                  </div>
                )
              )}
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
            {paymentMode === 'saved' && (
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
            )}
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
