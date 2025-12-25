import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";

// Invoice Status Constants
const STATUS_DRAFT = 'draft';
const STATUS_SENT = 'sent';
const STATUS_PAID = 'paid';
const STATUS_OVERDUE = 'overdue';
const STATUS_CANCELLED = 'cancelled';
const STATUS_PARTIALLY_PAID = 'partially_paid';
const STATUS_FAILED = 'failed';
const STATUS_REFUNDED = 'refunded';
const STATUS_PENDING = 'pending';
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoice,
  getProductsWithCompanyPricing,
  payInvoice,
  createDirectPayment,
  downloadInvoicePdf,
  InvoiceData,
  InvoiceCreateUpdatePayload,
  InvoiceCreateUpdateAPIPayload,
  InvoiceItemCreateUpdatePayload,
  InvoiceItemAPIPayload,
  InvoiceItemData,
  CompanyData,
  ProductData,
  CreateDirectPaymentData,
  PaymentIntentResponse,
  getCompanies
} from "@utils/accountingOld";
import { GetPaymentMethods } from "@utils/accounting";
import { formatNumber } from "@utils/Helper";

import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row, Form, Alert, Card, Badge } from "react-bootstrap";
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
import { FaShieldAlt, FaCreditCard } from "react-icons/fa";

import "@assets/scss/common.scss";

import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

import TableAction, { Action } from "@components/TableAction";
import { Spinner } from "react-bootstrap";
import { Divide, DollarSign, Download } from "lucide-react";

// Rich Text Editor Component for Terms and Conditions
const RichTextEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  id?: string;
}> = ({ value, onChange, placeholder = "Enter terms and conditions...", rows = 6, id }) => {
  const [isPreview, setIsPreview] = useState(false);

  // Convert plain text to formatted display
  const formatTextForDisplay = (text: string) => {
    if (!text) return '';
    
    return text
      .split('\n')
      .map((line, index) => {
        const trimmedLine = line.trim();
        
        // Handle bullet points
        if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
          return (
            <div key={index} className="d-flex align-items-start mb-1">
              <span className="me-2 text-primary">•</span>
              <span className="flex-grow-1">{trimmedLine.substring(1).trim()}</span>
            </div>
          );
        }
        
        // Handle numbered lists
        if (/^\d+\./.test(trimmedLine)) {
          return (
            <div key={index} className="d-flex align-items-start mb-1">
              <span className="me-2 text-primary fw-bold">{trimmedLine.match(/^\d+\./)?.[0]}</span>
              <span className="flex-grow-1">{trimmedLine.replace(/^\d+\.\s*/, '')}</span>
            </div>
          );
        }
        
        // Handle empty lines
        if (trimmedLine === '') {
          return <div key={index} className="mb-2">&nbsp;</div>;
        }
        
        // Regular lines
        return (
          <div key={index} className="mb-1">
            {trimmedLine}
          </div>
        );
      });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="form-label mb-0">Terms & Conditions</label>
        <div className="btn-group btn-group-sm" role="group">
          <button
            type="button"
            className={`btn ${!isPreview ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setIsPreview(false)}
          >
            <i className="fas fa-edit me-1"></i>
            Edit
          </button>
          <button
            type="button"
            className={`btn ${isPreview ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setIsPreview(true)}
          >
            <i className="fas fa-eye me-1"></i>
            Preview
          </button>
        </div>
      </div>
      
      {!isPreview ? (
        <div>
          <textarea
            id={id}
            className="form-control"
            value={value}
            onChange={handleTextChange}
            placeholder={placeholder}
            rows={rows}
            style={{ fontFamily: 'monospace', fontSize: '14px' }}
          />
          <div className="mt-2">
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              <strong>Formatting tips:</strong>
              <br />
              • Use <code>•</code> or <code>-</code> or <code>*</code> for bullet points
              <br />
              • Use <code>1.</code>, <code>2.</code> etc. for numbered lists
              <br />
              • Press Enter for new lines
              <br />
              • Use empty lines for spacing
            </small>
          </div>
        </div>
      ) : (
        <div 
          className="border rounded p-3 bg-light"
          style={{ minHeight: `${rows * 1.5}em` }}
        >
          {value ? (
            <div className="text-start">
              {formatTextForDisplay(value)}
            </div>
          ) : (
            <div className="text-muted fst-italic">
              {placeholder}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


interface SelectOption {
  value: number;
  label: string;
}

interface InvoiceFormData extends Omit<InvoiceData, 'items'> {
  items: InvoiceItemCreateUpdatePayload[];
  status: string;
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



// Direct Card Payment Form Component
const DirectCardPaymentForm: React.FC<{
  amount: number;
  currency: string;
  invoiceId: number;
  customerId: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}> = ({ amount, currency, invoiceId, customerId, onPaymentSuccess, onPaymentError }) => {
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
          className="w-100"
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
  const [currentFilters, setCurrentFilters] = useState<{search?: string; status?: string}>({});
  const [activeStatusTab, setActiveStatusTab] = useState<string | null>(null);

  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [companyProducts, setCompanyProducts] = useState<ProductData[]>([]);
  const [isLoadingCompanyProducts, setIsLoadingCompanyProducts] = useState<boolean>(false);
  
  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceData | null>(null);
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [stripePublishableKey, setStripePublishableKey] = useState<string>("");
  const [activePaymentTab, setActivePaymentTab] = useState<string>("saved-cards");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  // Exchange rate states
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [isLoadingExchangeRates, setIsLoadingExchangeRates] = useState<boolean>(false);
  const [baseCurrency, setBaseCurrency] = useState<string>("USD");
  const [exchangeRateTimeout, setExchangeRateTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Custom VAT states
  const [showCustomVatRate, setShowCustomVatRate] = useState<boolean>(false);
  const [showEditCustomVatRate, setShowEditCustomVatRate] = useState<boolean>(false);
  const [loadedCurrencies, setLoadedCurrencies] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [processedInvoiceItems, setProcessedInvoiceItems] = useState<any[]>([]);

  const columns: Column[] = useMemo(
    () => [
      {
        key: "invoice_number",
        name: "Invoice Number",
        selector: (row: InvoiceData) => row.invoice_number,
        sortable: true,
        cell: (props: InvoiceData) => (
          <div>
            #{props.invoice_number}
          </div>
        ),
      },
     
      {
        key: "subtotal",
        name: "Subtotal",
        selector: (row: InvoiceData) => row.subtotal,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span >
            {props?.currency_code || "USD"} {" "} {formatNumber(parseFloat(props?.subtotal || "0"))}
          </span>
        ),
      },
      {
        key: "tax_amount",
        name: "VAT Amount",
        selector: (row: InvoiceData) => row.tax_amount,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span >
            {props?.currency_code || "AED"}{" "}
            {formatNumber(parseFloat(props?.tax_amount || "0"))}
          </span>
        ),
      },
      {
        key: "total_amount",
        name: "Total Amount",
        selector: (row: InvoiceData) => row.total_amount,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span >
            {props.currency_code || "AED"} {" "} {formatNumber(parseFloat(props?.total_amount || "0"))}
          </span>
        ),
      },
      {
        key: "due_date",
        name: "Due Date",
        selector: (row: InvoiceData) => row.due_date,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span>
            {props.due_date
              ? moment(props.due_date).format("DD-MMM-YYYY")
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
          <span >
            {moment(props.invoice_date).format("DD-MMM-YYYY")}
          </span>
        ),
      },
      {
        key: "status",
        name: "Status",
        selector: (row: InvoiceData) => row.status,
        sortable: true,
        cell: (props: InvoiceData) => {
          const getStatusBadge = (status: string) => {
            switch (status) {
              case STATUS_DRAFT:
                return <span className="badge bg-secondary">Draft</span>;
              case STATUS_SENT:
                return <span className="badge bg-info">Sent</span>;
              case STATUS_PAID:
                return <span className="badge bg-success">Paid</span>;
              case STATUS_OVERDUE:
                return <span className="badge bg-danger">Overdue</span>;
              case STATUS_CANCELLED:
                return <span className="badge bg-dark">Cancelled</span>;

              case STATUS_PARTIALLY_PAID:
                return <span className="badge bg-warning">Partially Paid</span>;
              case STATUS_FAILED:
                return <span className="badge bg-danger">Failed</span>;
              case STATUS_REFUNDED:
                return <span className="badge bg-danger">Refunded</span>;
              case STATUS_PENDING:
                return <span className="badge bg-warning">Pending</span>;
              case STATUS_DRAFT:
                return <span className="badge bg-secondary">Draft</span>;
              default:
                return <span className="badge bg-light text-dark">{status}</span>;
            }
          };
          
          return getStatusBadge(props.status || STATUS_DRAFT);
        },
      },
      {
        key: "Action",
        name: "ACTION",
        selector: (row: InvoiceData) => row.id,
        sortable: false,
        cell: (props: InvoiceData) => {
         
          return (
            <>
          
          <div className="d-flex gap-2"> 
            
              {props.status === STATUS_PENDING && session?.user?.permissions?.includes('pay-invoices-billing') && (
                       

              <Button 
              variant="info" 
              size="sm"
              style={{ 
                backgroundColor: '#5bc0de', 
                borderColor: '#5bc0de', 
                color: 'white',
                fontSize: '0.85rem',
                padding: '0.375rem 0.75rem'
              }}
              onClick={() => handlePayInvoice(props)}
              >
              Pay Now
              </Button>

                        
              )}
             
                       

                        <Button 
                          variant="light" 
                          size="sm"
                          style={{ 
                            backgroundColor: '#e9ecef',
                            borderColor: '#dee2e6',
                            color: '#212529',
                            fontSize: '0.85rem',
                            padding: '0.375rem 0.75rem',
                            fontWeight: '500'
                          }}
                          onClick={() => { 
                            handleDownloadPDF(props)
                          }}
                        >
                          Download
                        </Button>
                      
                        </div>
            </>
          );
        },
      },
    ],
    [session?.user?.permissions]
  );


  // Load company-specific products
  const loadCompanyProducts = useCallback(async (companyId: number) => {
    if (!companyId) {
      console.log("No company ID provided to loadCompanyProducts");
      setCompanyProducts([]);
      return;
    }

    console.log("Loading company products for company ID:", companyId);
    setIsLoadingCompanyProducts(true);
    try {
      const response = await getProductsWithCompanyPricing(companyId);
      console.log("Company products loaded:", response);
      setCompanyProducts((response as any) || []);
    } catch (error) {
      console.error("Error loading company products:", error);
      setCompanyProducts([]);
    } finally {
      setIsLoadingCompanyProducts(false);
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


  // Get exchange rate for a specific currency pair with caching
  const getExchangeRate = useCallback((fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return 1;
    
    // Direct rate lookup
    const directRate = exchangeRates.find(r => r.from === fromCurrency && r.to === toCurrency);
    if (directRate) return directRate.rate;
    
    // Try to find rates via the base currency
    const baseToTarget = exchangeRates.find(r => r.from === baseCurrency && r.to === toCurrency);
    const fromToBase = exchangeRates.find(r => r.from === fromCurrency && r.to === baseCurrency);
    
    if (baseToTarget && fromToBase) {
      // Convert: fromCurrency -> baseCurrency -> toCurrency
      return fromToBase.rate * baseToTarget.rate;
    }
    
    // If we have USD as base, calculate via USD as fallback
    if (baseCurrency !== 'USD' && fromCurrency !== 'USD' && toCurrency !== 'USD') {
      const fromUSD = exchangeRates.find(r => r.from === 'USD' && r.to === toCurrency);
      const toUSD = exchangeRates.find(r => r.from === fromCurrency && r.to === 'USD');
      
      if (fromUSD && toUSD) {
        // Convert: fromCurrency -> USD -> toCurrency
        return toUSD.rate * fromUSD.rate;
      }
    }
    
    // If no rate found and we're loading, return 1 to avoid showing wrong amounts
    if (isLoadingExchangeRates) return 1;
    
    // If no rate found, return 1 (no conversion)
    console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}, baseCurrency: ${baseCurrency}`);
    return 1;
  }, [exchangeRates, isLoadingExchangeRates, baseCurrency]);

  // Get effective price and currency for a product (company pricing if available, otherwise base price)
  const getEffectiveProductPrice = useCallback((productId: string, companyId?: string): { price: string; currency: string; includesVat: boolean } => {
    // Find the product in company products
    const companyProduct = companyProducts.find(p => p.id.toString() === productId);
    if (companyProduct) {
      console.log("Found company product:", companyProduct);
      console.log("Pricing type:", companyProduct.pricing_type);
      console.log("Company pricing:", companyProduct.company_pricing);
      
      // Check if this is company-specific pricing
      if (companyProduct.pricing_type === "company_specific" && companyProduct.company_pricing) {
        // Verify company_id matches if provided
        if (!companyId || companyProduct.company_pricing.company_id === companyId) {
          console.log("Using company-specific pricing:", companyProduct.company_pricing.selling_price);
          return {
            price: companyProduct.company_pricing.selling_price || "0",
            currency: companyProduct.currency || "USD",
            includesVat: false // Assume company pricing is base price without VAT
          };
        }
      }
      
      // Use effective_price from the API response, which already handles company-specific pricing
      // If effective_price is different from base_price, it likely includes VAT
      const basePrice = parseFloat(companyProduct.base_price || "0");
      const effectivePrice = parseFloat(companyProduct.effective_price || "0");
      const includesVat = effectivePrice > basePrice && basePrice > 0;
      
      console.log("Using effective price:", companyProduct.effective_price, "includesVat:", includesVat);
      return {
        price: companyProduct.effective_price || companyProduct.base_price || "0",
        currency: companyProduct.currency || "USD", // Default to USD if currency not found
        includesVat: includesVat
      };
    }

    // If no product found, return default values
    console.warn(`Product with ID ${productId} not found in company products`);
    return {
      price: "0",
      currency: "USD",
      includesVat: false
    };
  }, [companyProducts]);

  // Get products to display in dropdowns (always use company products)
  const getProductsToDisplay = useCallback((companyId?: string): ProductData[] => {
    return companyProducts;
  }, [companyProducts]);

  // Load exchange rates directly from free API
  const loadExchangeRates = useCallback(async (invoiceCurrency: string) => {
    console.log('Loading exchange rates for:', invoiceCurrency, 'Loaded currencies:', Array.from(loadedCurrencies));
    
    // If we already have rates loaded for this currency, don't reload
    if (exchangeRates.length > 0 && baseCurrency === invoiceCurrency && !isInitialLoad) {
      console.log('Rates already loaded for currency:', invoiceCurrency);
      return;
    }

    console.log('Fetching exchange rates from free API...');
    setIsLoadingExchangeRates(true);
    
    try {
      const rates: ExchangeRate[] = [];
      const currencies = ['USD', 'EUR', 'GBP', 'AED', 'PKR'];
      
      // Use free exchange rate API with the selected currency as base
      console.log('Fetching exchange rates from free API with base:', invoiceCurrency);
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${invoiceCurrency}`);
      
      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Exchange rate API response data:', data);
      
      // Process all currency pairs from the API response
      if (data.rates) {
        for (const currency of currencies) {
          if (currency !== invoiceCurrency && data.rates[currency]) {
            // Selected currency to other currencies
            rates.push({
              from: invoiceCurrency,
              to: currency,
              rate: data.rates[currency],
              timestamp: Date.now()
            });
            
            // Other currencies to selected currency (inverse)
            rates.push({
              from: currency,
              to: invoiceCurrency,
              rate: 1 / data.rates[currency],
              timestamp: Date.now()
            });
          }
        }
        
        // Add self-conversion rate
        rates.push({
          from: invoiceCurrency,
          to: invoiceCurrency,
          rate: 1,
          timestamp: Date.now()
        });
        
        // If the selected currency is not USD, also load USD-based rates for better coverage
        if (invoiceCurrency !== 'USD') {
          try {
            console.log('Loading USD-based rates for better coverage...');
            const usdResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            if (usdResponse.ok) {
              const usdData = await usdResponse.json();
              if (usdData.rates) {
                // Add USD to selected currency rate
                if (usdData.rates[invoiceCurrency]) {
                  rates.push({
                    from: 'USD',
                    to: invoiceCurrency,
                    rate: usdData.rates[invoiceCurrency],
                    timestamp: Date.now()
                  });
                  
                  // Add selected currency to USD rate (inverse)
                  rates.push({
                    from: invoiceCurrency,
                    to: 'USD',
                    rate: 1 / usdData.rates[invoiceCurrency],
                    timestamp: Date.now()
                  });
                }
                
                // Add other currencies to USD rates for cross-conversion
                for (const currency of currencies) {
                  if (currency !== 'USD' && currency !== invoiceCurrency && usdData.rates[currency]) {
                    // Only add if we don't already have this rate
                    const existingRate = rates.find(r => r.from === currency && r.to === 'USD');
                    if (!existingRate) {
                      rates.push({
                        from: currency,
                        to: 'USD',
                        rate: 1 / usdData.rates[currency],
                        timestamp: Date.now()
                      });
                    }
                    
                    const existingRateReverse = rates.find(r => r.from === 'USD' && r.to === currency);
                    if (!existingRateReverse) {
                      rates.push({
                        from: 'USD',
                        to: currency,
                        rate: usdData.rates[currency],
                        timestamp: Date.now()
                      });
                    }
                  }
                }
              }
            }
          } catch (usdError) {
            console.warn('Failed to load USD-based rates:', usdError);
          }
        }
      }
      
      console.log('All rates loaded for base currency:', invoiceCurrency, rates);
      
      // Update state with all rates
      setExchangeRates(rates);
      setLoadedCurrencies(new Set(currencies));
      setBaseCurrency(invoiceCurrency);
      setIsInitialLoad(false);
    } catch (error) {
      console.error("Error loading exchange rates:", error);
      
      // Fallback to another free API
      try {
        console.log('Falling back to alternative exchange rate API');
        const fallbackResponse = await fetch(`https://api.fxratesapi.com/latest?base=${invoiceCurrency}`);
        const fallbackData = await fallbackResponse.json();
        
        const fallbackRates: ExchangeRate[] = [];
        const currencies = ['USD', 'EUR', 'GBP', 'AED', 'PKR'];
        
        if (fallbackData.rates) {
          for (const currency of currencies) {
            if (currency !== invoiceCurrency && fallbackData.rates[currency]) {
              // Selected currency to other currencies
              fallbackRates.push({
                from: invoiceCurrency,
                to: currency,
                rate: fallbackData.rates[currency],
                timestamp: Date.now()
              });
              
              // Other currencies to selected currency (inverse)
              fallbackRates.push({
                from: currency,
                to: invoiceCurrency,
                rate: 1 / fallbackData.rates[currency],
                timestamp: Date.now()
              });
            }
          }
          
          // Add self-conversion rate
          fallbackRates.push({
            from: invoiceCurrency,
            to: invoiceCurrency,
            rate: 1,
            timestamp: Date.now()
          });
        }
        
        console.log('Fallback rates loaded for base currency:', invoiceCurrency, fallbackRates);
        
        // Update state with fallback rates
        setExchangeRates(fallbackRates);
        setLoadedCurrencies(new Set(currencies));
        setBaseCurrency(invoiceCurrency);
        setIsInitialLoad(false);
      } catch (fallbackError) {
        console.error('Fallback exchange rate API also failed:', fallbackError);
        // Set default rates if all APIs fail
        const defaultRates: ExchangeRate[] = [
          { from: 'USD', to: 'EUR', rate: 0.85, timestamp: Date.now() },
          { from: 'EUR', to: 'USD', rate: 1.18, timestamp: Date.now() },
          { from: 'USD', to: 'GBP', rate: 0.73, timestamp: Date.now() },
          { from: 'GBP', to: 'USD', rate: 1.37, timestamp: Date.now() },
          { from: 'USD', to: 'AED', rate: 3.67, timestamp: Date.now() },
          { from: 'AED', to: 'USD', rate: 0.27, timestamp: Date.now() },
          { from: 'USD', to: 'PKR', rate: 280, timestamp: Date.now() },
          { from: 'PKR', to: 'USD', rate: 0.0036, timestamp: Date.now() },
        ];
        setExchangeRates(defaultRates);
        setLoadedCurrencies(new Set(['USD', 'EUR', 'GBP', 'AED', 'PKR']));
        setBaseCurrency(invoiceCurrency);
        setIsInitialLoad(false);
      }
    } finally {
      setIsLoadingExchangeRates(false);
    }
  }, [exchangeRates.length, isInitialLoad, baseCurrency]);

  // Debounced version to prevent too many API calls
  const debouncedLoadExchangeRates = useCallback((invoiceCurrency: string) => {
    // Clear existing timeout
    if (exchangeRateTimeout) {
      clearTimeout(exchangeRateTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      loadExchangeRates(invoiceCurrency);
    }, 300); // Reduced timeout for better UX
    
    setExchangeRateTimeout(timeout);
  }, [loadExchangeRates, exchangeRateTimeout]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesData = await getCompanies({
          load_profile: true,
        });
        setCompanies(companiesData.data || []);
        console.log("Companies:", companiesData);
        
        // Load products for the first company if available
        if (companiesData.data && companiesData.data.length > 0) {
          const firstCompany = companiesData.data[0];
          await loadCompanyProducts(firstCompany.id);
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    fetchCompanies();
    loadStripePublishableKey();
    
    // Load exchange rates on initial mount with USD as default base
    loadExchangeRates('USD'); // Load exchange rates with USD as base initially
  }, [loadStripePublishableKey, loadExchangeRates, loadCompanyProducts]);

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  useEffect(() => {
    getPaymentMethods();
  }, []);
  const getPaymentMethods = async () => {
    const response = await GetPaymentMethods() as any;
    const methods = response?.payment_methods || [];
    setPaymentMethods(methods);
    console.log("Payment methods:", methods);
  };

  // Refresh payment methods when payment modal opens
  useEffect(() => {
    if (showPaymentModal) {
      getPaymentMethods();
    }
  }, [showPaymentModal]);

  // Set default card when payment methods are loaded and modal is open
  useEffect(() => {
    if (showPaymentModal && paymentMethods.length > 0) {
      // Set default card if available
      const defaultCard = paymentMethods.find((method) => method.is_default && method.type === 'card');
      if (defaultCard) {
        setSelectedCardId(defaultCard.id);
      } else {
        const firstCard = paymentMethods.find((method) => method.type === 'card');
        if (firstCard) {
          setSelectedCardId(firstCard.id);
        }
      }
    }
  }, [showPaymentModal, paymentMethods]);

  // Payment hook for saved cards
  const { 
    createInvoicePayment, 
    isCreateInvoicePaymentPending 
  } = useCreateInvoicePayment();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (exchangeRateTimeout) {
        clearTimeout(exchangeRateTimeout);
      }
    };
  }, [exchangeRateTimeout]);


  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);
  const [summary, setSummary] = useState<any | null>(null);

  const fetchInvoices = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        const response = await getInvoices({
          page,
          per_page: perPage,
          search,
          ...memoizedFilters,
        });

        const summary = response?.summary;
        setSummary(summary);

        // The getInvoices function returns PaginationWrapper<InvoiceData>
        // which has the structure: { data: InvoiceData[], pagination: {...} }
        return {
          data: response?.data, // The actual invoice array
          total: response?.pagination?.total,
          page: response?.pagination?.current_page || response?.pagination?.page,
          per_page: response?.pagination?.per_page || response?.pagination?.limit,
          last_page: response?.pagination?.last_page,
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
      tax_amount: (item as any).tax_amount || "0.00", // Include tax_amount from API response
    }));
    
    setSelectedInvoice({
      ...props,
      items: convertedItems,
      status: props.status || STATUS_DRAFT
    });
    setShowEditInvoiceModal(true);
    
    // Load company products for the company when editing
    if (props.company_id) {
      console.log("Loading company products for edit invoice company:", props.company_id);
      loadCompanyProducts(parseInt(props.company_id));
    }
  }, [loadCompanyProducts]);

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
      
      const totals = calculateTotals(selectedInvoice.items, companyVatRate, isVatExempt, selectedInvoice.currency_code || 'USD', selectedInvoice.company_id);
      const invoiceData: InvoiceCreateUpdatePayload = {
        company_id: selectedInvoice.company_id,
        invoice_date: selectedInvoice.invoice_date,
        due_date: selectedInvoice.due_date,
        payment_mode: selectedInvoice.payment_mode,
        currency_code: selectedInvoice.currency_code || 'USD',
        tax_amount: totals.tax_amount,
        notes: selectedInvoice.notes || "",
        terms_conditions: selectedInvoice.terms_conditions || "",
        items: selectedInvoice.items,
        subtotal: totals.subtotal,
        total_amount: totals.total_amount,
        status: selectedInvoice.status || STATUS_DRAFT,
      };
      // Transform for API (map tax_rate to vat_rate for items)
      const apiPayload = transformInvoiceForAPI(invoiceData);
      const response = await updateInvoice(selectedInvoice.id, apiPayload);

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
    status: STATUS_DRAFT,
  });

  // Recalculate totals when exchange rates change
  useEffect(() => {
    if (exchangeRates.length > 0 && !isLoadingExchangeRates) {
      // Recalculate new invoice totals if currency is not USD
      if (newInvoice.currency_code && newInvoice.currency_code !== 'USD' && newInvoice.items.length > 0) {
        const selectedCompany = companies.find(c => c.id.toString() === newInvoice.company_id);
        const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
        const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
        const totals = calculateTotals(newInvoice.items, companyVatRate, isVatExempt, newInvoice.currency_code, newInvoice.company_id);
        
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
        const totals = calculateTotals(selectedInvoice.items, companyVatRate, isVatExempt, selectedInvoice.currency_code, selectedInvoice.company_id);
        
        setSelectedInvoice(prev => ({
          ...prev!,
          subtotal: totals.subtotal.toString(),
          tax_amount: totals.tax_amount.toString(),
          total_amount: totals.total_amount.toString(),
        }));
      }
    }
  }, [exchangeRates, isLoadingExchangeRates, newInvoice.currency_code, newInvoice.company_id, newInvoice.items, selectedInvoice?.currency_code, selectedInvoice?.company_id, selectedInvoice?.items, companies]);

  // Helper function to transform invoice data for API (map tax_rate to vat_rate for items)
  const transformInvoiceForAPI = (invoice: InvoiceCreateUpdatePayload): InvoiceCreateUpdateAPIPayload => {
    return {
      ...invoice,
      items: invoice.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.tax_rate, // Map tax_rate to vat_rate for API
        tax_amount: item.tax_amount,
      }))
    };
  };

  // Helper function to calculate totals using per-product VAT rates
  const calculateTotals = (items: InvoiceItemCreateUpdatePayload[], companyVatRate: number = 0, isVatExempt: boolean = false, toCurrency: string = 'USD', companyId?: string) => {
    let subtotal = 0;
    let totalTaxAmount = 0;
    
    // Process each item individually to calculate VAT per product
    const processedItems = items.map(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      
      // Get the product's original currency with company context
      const productInfo = getEffectiveProductPrice(item.product_id, companyId);
      const productCurrency = productInfo.currency || 'USD'; // Default to USD if null
      
      // Convert the unit price from product currency to target currency
      const exchangeRate = getExchangeRate(productCurrency, toCurrency || 'USD');
      const convertedUnitPrice = unitPrice * exchangeRate;
      
      // Calculate line subtotal
      const lineSubtotal = quantity * convertedUnitPrice;
      
      // Use the tax_rate from the item (this is already set per product)
      // Priority: 1. Item tax_rate (already set), 2. Product-specific VAT rate, 3. Company VAT rate
      let effectiveVatRate = companyVatRate;
      
      // Use the tax_rate from the item if it's already set
      if (item.tax_rate && parseFloat(item.tax_rate) >= 0) {
        effectiveVatRate = parseFloat(item.tax_rate);
      } else if (item.product_id) {
        // Fallback to product-specific VAT rate if item tax_rate is not set
        const product = companyProducts.find(p => p.id.toString() === item.product_id);
        if (product?.vat_rate) {
          effectiveVatRate = parseFloat(product.vat_rate);
        }
      }
      
      
      // Calculate VAT for this line item
      // If product price already includes VAT, we need to extract the VAT amount
      let lineVatAmount = 0;
      let lineTotal = lineSubtotal;
      
      if (!isVatExempt && effectiveVatRate > 0) {
        if (productInfo.includesVat) {
          // Price already includes VAT, so we need to calculate the VAT amount from the total
          // VAT amount = (lineSubtotal * vatRate) / (100 + vatRate)
          lineVatAmount = (lineSubtotal * effectiveVatRate) / (100 + effectiveVatRate);
          lineTotal = lineSubtotal; // Total remains the same since VAT is already included
        } else {
          // Price doesn't include VAT, so we add VAT on top
          lineVatAmount = lineSubtotal * (effectiveVatRate / 100);
          lineTotal = lineSubtotal + lineVatAmount;
        }
      }
      
      // Update totals
      // If price includes VAT, subtotal should be the net amount (without VAT)
      if (productInfo.includesVat && !isVatExempt && effectiveVatRate > 0) {
        const netAmount = lineSubtotal - lineVatAmount;
        subtotal += netAmount;
      } else {
        subtotal += lineSubtotal;
      }
      totalTaxAmount += lineVatAmount;
      
      return {
        ...item,
        tax_rate: effectiveVatRate.toString(),
        tax_amount: lineVatAmount.toString(),
        line_subtotal: lineSubtotal,
        line_vat_amount: lineVatAmount,
        line_total: lineTotal
      };
    });
    
    const totalAmount = subtotal + totalTaxAmount;
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_amount: parseFloat(totalTaxAmount.toFixed(2)),
      total_amount: parseFloat(totalAmount.toFixed(2)),
      processedItems // Return processed items with individual VAT calculations
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
      
      const totals = calculateTotals(newInvoice.items, companyVatRate, isVatExempt, newInvoice.currency_code, newInvoice.company_id);
      const invoiceData: InvoiceCreateUpdatePayload = {
        ...newInvoice,
        ...totals,
        // Ensure VAT is calculated based on company settings or custom VAT rate
        tax_amount: totals.tax_amount,
        status: newInvoice.status,
      };
      // Transform for API (map tax_rate to vat_rate for items)
      const apiPayload = transformInvoiceForAPI(invoiceData);
      const response = await createInvoice(apiPayload);

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
          status: STATUS_DRAFT,
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
      status: STATUS_DRAFT,
    });
    setShowCustomVatRate(false);
    setProcessedInvoiceItems([]);
  }, []);

  const closeEditInvoiceModal = useCallback(() => {
    setShowEditInvoiceModal(false);
    setSelectedInvoice(null);
    setShowEditCustomVatRate(false);
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
  }, []);


  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setSelectedInvoiceForPayment(null);
    setPaymentNotes("");
    setActivePaymentTab("saved-cards");
    setSelectedCardId(null);
  }, []);


  // Direct payment handlers
  const handleDirectPaymentSuccess = useCallback(() => {
    toast.success("Payment processed successfully");
    
    // Close modal and reset state
    setShowPaymentModal(false);
    setSelectedInvoiceForPayment(null);
    setPaymentNotes("");
    
    // Refresh the invoice list
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleDirectPaymentError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  // Payment with saved card handler
  const handlePaymentWithSavedCard = useCallback(async () => {
    if (!selectedCardId || !selectedInvoiceForPayment) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessingPayment(true);
    createInvoicePayment({
      amount: parseFloat(selectedInvoiceForPayment.total_amount || '0'),
      currency: (selectedInvoiceForPayment.currency_code || 'USD').toLowerCase(),
      payment_method_id: selectedCardId,
      invoice_id: selectedInvoiceForPayment.id,
      customer_id: parseInt(selectedInvoiceForPayment.company_id || '0'),
    }, {
      onSuccess: (paymentResult) => {
        if ((paymentResult as any).success) {
          toast.success('Payment successful!');
          handleDirectPaymentSuccess();
        } else {
          handleDirectPaymentError('Payment was not successful. Status: ' + paymentResult.status);
        }
        setIsProcessingPayment(false);
      },
      onError: (error) => {
        handleDirectPaymentError(error.message || 'Payment processing failed');
        setIsProcessingPayment(false);
      }
    });
  }, [selectedCardId, selectedInvoiceForPayment, createInvoicePayment, handleDirectPaymentSuccess, handleDirectPaymentError]);

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
    // Get company VAT rate first
    const selectedCompany = companies.find(c => c.id.toString() === newInvoice.company_id);
    const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
    
    const newItem: InvoiceItemCreateUpdatePayload = {
      product_id: "",
      quantity: "1",
      unit_price: "0.00",
      tax_rate: companyVatRate.toString(), // Use company VAT rate
      tax_amount: "0.00", // This will be automatically calculated
    };
    
    const updatedItems = [...newInvoice.items, newItem];
    // Get company VAT rate and exemption status
    const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
    const totals = calculateTotals(updatedItems, companyVatRate, isVatExempt, newInvoice.currency_code, newInvoice.company_id);
    
    // Store processed items for table display
    setProcessedInvoiceItems(totals.processedItems || []);
    
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
    
    // Auto-populate unit price and tax rate when product is selected
    if (field === 'product_id' && value) {
      const productInfo = getEffectiveProductPrice(value, newInvoice.company_id);
      const productCurrency = productInfo.currency;
      const invoiceCurrency = newInvoice.currency_code || 'USD';
      
      // Convert the product price from its currency to invoice currency
      const exchangeRate = getExchangeRate(productCurrency, invoiceCurrency);
      const convertedPrice = (parseFloat(productInfo.price) * exchangeRate).toFixed(2);
      
      updatedItems[index].unit_price = convertedPrice;
      
      // Auto-populate tax rate based on company settings (company VAT takes priority)
      const selectedCompany = companies.find(c => c.id.toString() === newInvoice.company_id);
      const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
      
      // Use company VAT rate (company settings take priority over product settings)
      updatedItems[index].tax_rate = companyVatRate.toString();
    }
    
    // Get company VAT rate and exemption status
    const selectedCompany = companies.find(c => c.id.toString() === newInvoice.company_id);
    const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
    const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
    const totals = calculateTotals(updatedItems, companyVatRate, isVatExempt, newInvoice.currency_code, newInvoice.company_id);
    
    // Store processed items for table display
    setProcessedInvoiceItems(totals.processedItems || []);
    
    setNewInvoice(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  }, [newInvoice.items, newInvoice.company_id, companies, getEffectiveProductPrice, getExchangeRate, newInvoice.currency_code, companyProducts]);

  const removeNewInvoiceItem = useCallback((index: number) => {
    const updatedItems = newInvoice.items.filter((_, i) => i !== index);
    // Get company VAT rate and exemption status
    const selectedCompany = companies.find(c => c.id.toString() === newInvoice.company_id);
    const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
    const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
    const totals = calculateTotals(updatedItems, companyVatRate, isVatExempt, newInvoice.currency_code, newInvoice.company_id);
    
    // Store processed items for table display
    setProcessedInvoiceItems(totals.processedItems || []);
    
    setNewInvoice(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  }, [newInvoice.items, newInvoice.company_id, companies]);

  const addEditInvoiceItem = useCallback(() => {
    if (!selectedInvoice) return;
    
    // Get company VAT rate first
    const selectedCompany = companies.find(c => c.id.toString() === selectedInvoice.company_id);
    const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
    
    const newItem: InvoiceItemCreateUpdatePayload = {
      product_id: "",
      quantity: "1",
      unit_price: "0.00",
      tax_rate: companyVatRate.toString(), // Use company VAT rate
      tax_amount: "0.00", // This will be automatically calculated
    };
    
    const updatedItems = [...selectedInvoice.items, newItem];
    // Get company VAT rate and exemption status
    const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
    const totals = calculateTotals(updatedItems, companyVatRate, isVatExempt, selectedInvoice.currency_code || 'USD', selectedInvoice.company_id);
    
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
    
    // Auto-populate unit price and tax rate when product is selected
    if (field === 'product_id' && value) {
      const productInfo = getEffectiveProductPrice(value, selectedInvoice.company_id);
      const productCurrency = productInfo.currency;
      const invoiceCurrency = selectedInvoice.currency_code || 'USD';
      
      // Convert the product price from its currency to invoice currency
      const exchangeRate = getExchangeRate(productCurrency, invoiceCurrency);
      const convertedPrice = (parseFloat(productInfo.price) * exchangeRate).toFixed(2);
      
      updatedItems[index].unit_price = convertedPrice;
      
      // Auto-populate tax rate based on company settings (company VAT takes priority)
      const selectedCompany = companies.find(c => c.id.toString() === selectedInvoice.company_id);
      const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
      
      // Use company VAT rate (company settings take priority over product settings)
      updatedItems[index].tax_rate = companyVatRate.toString();
    }
    
    // Get company VAT rate and exemption status
    const selectedCompany = companies.find(c => c.id.toString() === selectedInvoice.company_id);
    const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
    const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
    const totals = calculateTotals(updatedItems, companyVatRate, isVatExempt, selectedInvoice.currency_code || 'USD', selectedInvoice.company_id);
    
    setSelectedInvoice(prev => ({
      ...prev!,
      items: updatedItems,
      subtotal: totals.subtotal.toString(),
      tax_amount: totals.tax_amount.toString(),
      total_amount: totals.total_amount.toString(),
    }));
  }, [selectedInvoice, companies, getEffectiveProductPrice, getExchangeRate, companyProducts]);

  const removeEditInvoiceItem = useCallback((index: number) => {
    if (!selectedInvoice) return;
    
    const updatedItems = selectedInvoice.items.filter((_, i) => i !== index);
    // Get company VAT rate and exemption status
    const selectedCompany = companies.find(c => c.id.toString() === selectedInvoice.company_id);
    const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
    const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
    const totals = calculateTotals(updatedItems, companyVatRate, isVatExempt, selectedInvoice.currency_code || 'USD', selectedInvoice.company_id);
    
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
          
          // Update existing items' VAT rates to match the new company's VAT rate
          const updatedItems = updatedInvoice.items.map(item => ({
            ...item,
            tax_rate: companyVatRate.toString(), // Update VAT rate for all existing items
          }));
          
          const totals = calculateTotals(updatedItems, companyVatRate, isVatExempt, updatedInvoice.currency_code || 'USD', value.toString());
          
          // Store processed items for table display
          setProcessedInvoiceItems(totals.processedItems || []);
          
          return {
            ...updatedInvoice,
            items: updatedItems, // Use updated items with new VAT rates
            vat_rate: companyVatRate, // Auto-populate VAT rate from company
            ...totals
          };
        }
        
        // Recalculate totals when currency changes
        if (field === 'currency_code' && value) {
          const selectedCompany = companies.find(c => c.id.toString() === updatedInvoice.company_id);
          const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
          const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
          const totals = calculateTotals(updatedInvoice.items, companyVatRate, isVatExempt, value, updatedInvoice.company_id);
          
          // Store processed items for table display
          setProcessedInvoiceItems(totals.processedItems || []);
          
          return {
            ...updatedInvoice,
            ...totals
          };
        }
        
        
        return updatedInvoice;
      });
      
      // Load company products when company is selected
      if (field === 'company_id' && value) {
        console.log("Company selected in create modal:", value.toString());
        loadCompanyProducts(parseInt(value));
      }
      
      // Load exchange rates when currency changes
      if (field === 'currency_code' && value) {
        console.log("Currency changed in create modal:", value.toString());
        debouncedLoadExchangeRates(value);
      }
    },
    [loadCompanyProducts, debouncedLoadExchangeRates, companies]
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
          
          // Update existing items' VAT rates to match the new company's VAT rate
          const updatedItems = updatedInvoice.items.map(item => ({
            ...item,
            tax_rate: companyVatRate.toString(), // Update VAT rate for all existing items
          }));
          
          const totals = calculateTotals(updatedItems, companyVatRate, isVatExempt, updatedInvoice.currency_code || 'USD', value.toString());
          return {
            ...updatedInvoice,
            items: updatedItems, // Use updated items with new VAT rates
            vat_rate: companyVatRate, // Auto-populate VAT rate from company
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
          const totals = calculateTotals(updatedInvoice.items, companyVatRate, isVatExempt, value, updatedInvoice.company_id);
          return {
            ...updatedInvoice,
            subtotal: totals.subtotal.toString(),
            tax_amount: totals.tax_amount.toString(),
            total_amount: totals.total_amount.toString(),
          };
        }
        
        
        return updatedInvoice;
      });
      
      // Load company products when company is selected
      if (field === 'company_id' && value) {
        console.log("Company selected in edit modal:", value.toString());
        loadCompanyProducts(parseInt(value));
      }
      
      // Load exchange rates when currency changes
      if (field === 'currency_code' && value) {
        console.log("Currency changed in edit modal:", value.toString());
        debouncedLoadExchangeRates(value);
      }
    },
    [loadCompanyProducts, debouncedLoadExchangeRates, companies]
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
          * { box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa;
            color: #333;
          }
          .invoice-container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          .invoice-header {
            background: linear-gradient(135deg, #4285f4, #34a853);
            color: white;
            padding: 30px;
            position: relative;
          }
          .invoice-title {
            font-size: 32px;
            font-weight: bold;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .invoice-details {
            position: absolute;
            left: 30px;
            top: 30px;
            text-align: left;
          }
          .invoice-number {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .invoice-meta {
            font-size: 14px;
            opacity: 0.9;
          }
          .invoice-meta div {
            margin-bottom: 5px;
          }
          .invoice-body {
            padding: 30px;
          }
          .bill-to-section {
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #4285f4;
          }
          .bill-to-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
          }
          .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
          }
          .vat-info {
            background-color: #e8f4fd;
            border: 1px solid #bee5eb;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 30px;
            text-align: center;
          }
          .vat-info strong {
            color: #0c5460;
          }
          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .invoice-table th {
            background: linear-gradient(135deg, #34495e, #2c3e50);
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: bold;
            font-size: 14px;
          }
          .invoice-table th:first-child { text-align: left; }
          .invoice-table th:not(:first-child) { text-align: right; }
          .invoice-table td {
            padding: 12px;
            border-bottom: 1px solid #e9ecef;
            font-size: 14px;
          }
          .invoice-table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          .invoice-table tr:hover {
            background-color: #e3f2fd;
          }
          .invoice-table td:not(:first-child) {
            text-align: right;
          }
          .totals-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 30px;
          }
          .totals {
            display: flex;
            justify-content: flex-start;
          }
          .totals-content {
            width: 300px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
          }
          .totals-row.total-final {
            border-top: 2px solid #4285f4;
            padding-top: 10px;
            margin-top: 10px;
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
          }
          .totals-label {
            font-weight: 500;
          }
          .totals-amount {
            font-weight: 600;
          }
          .notes-section {
            margin-top: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 6px;
          }
          .notes-section h4 {
            margin-bottom: 15px;
            color: #2c3e50;
            font-size: 16px;
          }
          .notes-content {
            line-height: 1.6;
            color: #555;
          }
          .footer {
            background-color: #2c3e50;
            color: white;
            padding: 20px 30px;
            text-align: left;
            font-size: 14px;
          }
          .footer-content {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
          @media print {
            body { 
              background: white; 
              margin: 0; 
              padding: 0; 
            }
            .invoice-container {
              box-shadow: none;
              margin: 0;
              max-width: none;
            }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <h1 class="invoice-title">INVOICE</h1>
            <div class="invoice-details">
              <div class="invoice-number">#${invoice.invoice_number}</div>
              <div class="invoice-meta">
                <div><strong>Date:</strong> ${moment(invoice.invoice_date).format('DD/MM/YYYY')}</div>
                <div><strong>Due Date:</strong> ${invoice.due_date ? moment(invoice.due_date).format('DD/MM/YYYY') : 'N/A'}</div>
                <div><strong>Currency:</strong> ${invoice.currency_code || 'USD'}</div>
              </div>
            </div>
          </div>

          <div class="invoice-body">
            <div class="bill-to-section">
              <div class="bill-to-title">Bill To:</div>
              <div class="company-name">${invoice.company?.name || 'N/A'}</div>
              ${invoice.company?.profile?.tax_id ? `<div style="color: #666; margin-top: 5px;"><strong>Tax ID:</strong> ${invoice.company.profile.tax_id}</div>` : ''}
            </div>

            <div class="vat-info">
              <strong>VAT Information:</strong> ${isVatExempt ? 'VAT Exempt' : `VAT Rate: ${companyVatRate}%`}
            </div>

            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => {
                  const product = companyProducts.find(p => p.id.toString() === item.product_id.toString());
                  const productInfo = getEffectiveProductPrice(item.product_id.toString(), invoice.company_id);
                  const productCurrency = productInfo.currency;
                  const lineTotalUSD = parseFloat(item.quantity) * parseFloat(item.unit_price);
                  const exchangeRate = getExchangeRate(productCurrency, invoice.currency_code || 'USD');
                  const lineTotal = lineTotalUSD * exchangeRate;
                  return `
                    <tr>
                      <td>${product?.name || 'Unknown Product'}</td>
                      <td>${item.quantity}</td>
                      <td>${(parseFloat(item.unit_price) * exchangeRate).toFixed(2)}</td>
                      <td>${lineTotal.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="totals-section">
              <div class="totals">
                <div class="totals-content">
                  <div class="totals-row">
                    <span class="totals-label">Subtotal:</span>
                    <span class="totals-amount">${invoice.currency_code || 'AED'} ${parseFloat(invoice.subtotal || '0').toFixed(2)}</span>
                  </div>
                  <div class="totals-row">
                    <span class="totals-label">VAT (${isVatExempt ? 'Exempt' : companyVatRate + '%'}):</span>
                    <span class="totals-amount">${invoice.currency_code || 'AED'} ${parseFloat(invoice.tax_amount || '0').toFixed(2)}</span>
                  </div>
                  <div class="totals-row total-final">
                    <span class="totals-label">Total Amount:</span>
                    <span class="totals-amount">${invoice.currency_code || 'USD'} ${parseFloat(invoice.total_amount || '0').toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            ${invoice.notes ? `
              <div class="notes-section">
                <h4>Notes:</h4>
                <div class="notes-content">${invoice.notes}</div>
              </div>
            ` : ''}

            ${invoice.terms_conditions ? `
              <div class="notes-section">
                <h4>Terms & Conditions:</h4>
                <div class="notes-content">${invoice.terms_conditions
                  .split('\n')
                  .map(line => {
                    const trimmedLine = line.trim();
                    
                    // Handle bullet points
                    if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
                      return `<div class="d-flex align-items-start mb-1"><span class="me-2 text-primary">•</span><span>${trimmedLine.substring(1).trim()}</span></div>`;
                    }
                    
                    // Handle numbered lists
                    if (/^\d+\./.test(trimmedLine)) {
                      const match = trimmedLine.match(/^(\d+\.)\s*(.*)/);
                      if (match) {
                        return `<div class="d-flex align-items-start mb-1"><span class="me-2 text-primary fw-bold">${match[1]}</span><span>${match[2]}</span></div>`;
                      }
                      return `<div class="mb-1">${trimmedLine}</div>`;
                    }
                    
                    // Handle empty lines
                    if (trimmedLine === '') {
                      return '<div class="mb-2">&nbsp;</div>';
                    }
                    
                    // Regular lines
                    return `<div class="mb-1">${trimmedLine}</div>`;
                  })
                  .join('')}</div>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <div class="footer-content">
              <div>Thank you for your business!</div>
              <div>Generated on ${moment().format('DD/MM/YYYY HH:mm')}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }, [companyProducts]);

  // Print and PDF functions
  

  const handleDownloadPDF = useCallback(async (invoice: InvoiceData) => {
    try {
      await downloadInvoicePdf(invoice.id);
    } catch (error) {
      console.error('PDF download error:', error);
      // Error is already handled in the downloadInvoicePdf function
    }
  }, []);




  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Invoices" />

      <PageHeader
        title="Invoices"
        description="Manage your recurring services & renewals."
       
      />

        {/* Filter Tabs & Search */}
        <Card className="mb-4" style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Card.Body className="p-3">
          <Row className="align-items-center">
            <Col lg={9} className="mb-3 mb-lg-0">
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant={activeStatusTab === null ? 'light' : 'link'}
                  className={`custtabs border-1 text-decoration-none ${activeStatusTab === null ? 'bg-light' : ''}`}
                  onClick={() => {
                    setActiveStatusTab(null);
                    setCurrentFilters((prev) => {
                      const { status, ...rest } = prev;
                      return rest;
                    });
                    setRefreshKey(prev => prev + 1);
                  }}
                  style={{ 
                    fontWeight: activeStatusTab === null ? '600' : '400',
                    color: activeStatusTab === null ? '#212529' : '#6c757d',
                    padding: '0.5rem 1rem'
                  }}
                >
                  All 
                  <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    {summary?.total || 0}
                  </Badge>
                </Button>

                <Button
                  variant={activeStatusTab === 'paid' ? 'light' : 'link'}
                  className={`custtabs text-decoration-none ${activeStatusTab === 'paid' ? 'bg-light' : ''}`}
                  onClick={() => {
                    setActiveStatusTab('paid');
                    setCurrentFilters((prev) => ({ ...prev, status: 'paid' }));
                    setRefreshKey(prev => prev + 1);
                  }}
                  style={{ 
                    fontWeight: activeStatusTab === 'paid' ? '600' : '400',
                    color: activeStatusTab === 'paid' ? '#212529' : '#6c757d',
                    padding: '0.5rem 1rem'
                  }}
                >
                  Paid
                  <Badge bg="success" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    {summary?.status_counts?.paid || 0}
                  </Badge>
                </Button>
                
                

                <Button
                  variant={activeStatusTab === 'pending' ? 'light' : 'link'}
                  className={`custtabs text-decoration-none ${activeStatusTab === 'pending' ? 'bg-light' : ''}`}
                  onClick={() => {
                    setActiveStatusTab('pending');
                    setCurrentFilters((prev) => ({ ...prev, status: 'pending' }));
                    setRefreshKey(prev => prev + 1);
                  }}
                  style={{ 
                    fontWeight: activeStatusTab === 'pending' ? '600' : '400',
                    color: activeStatusTab === 'pending' ? '#212529' : '#6c757d',
                    padding: '0.5rem 1rem'
                  }}
                >
                  Pending 
                  <Badge bg="warning" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    {summary?.status_counts?.pending || 0}
                  </Badge>
                </Button>

                <Button
                  variant={activeStatusTab === 'overdue' ? 'light' : 'link'}
                  className={`custtabs text-decoration-none ${activeStatusTab === 'overdue' ? 'bg-light' : ''}`}
                  onClick={() => {
                    setActiveStatusTab('overdue');
                    setCurrentFilters((prev) => ({ ...prev, status: 'overdue' }));
                    setRefreshKey(prev => prev + 1);
                  }}
                  style={{ 
                    fontWeight: activeStatusTab === 'overdue' ? '600' : '400',
                    color: activeStatusTab === 'overdue' ? '#212529' : '#6c757d',
                    padding: '0.5rem 1rem'
                  }}
                >
                  Overdue 
                  <Badge bg="danger" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    {summary?.status_counts?.overdue || 0}
                  </Badge>
                </Button>


                <Button
                  variant={activeStatusTab === 'cancelled' ? 'light' : 'link'}
                  className={`custtabs text-decoration-none ${activeStatusTab === 'cancelled' ? 'bg-light' : ''}`}
                  onClick={() => {
                    setActiveStatusTab('cancelled');
                    setCurrentFilters((prev) => ({ ...prev, status: 'cancelled' }));
                    setRefreshKey(prev => prev + 1);
                  }}
                  style={{ 
                    fontWeight: activeStatusTab === 'cancelled' ? '600' : '400',
                    color: activeStatusTab === 'cancelled' ? '#212529' : '#6c757d',
                    padding: '0.5rem 1rem'
                  }}
                >
                  Cancelled 
                  <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    {summary?.status_counts?.cancelled || 0}
                  </Badge>
                </Button>

               
              </div>
            </Col>
            <Col lg={3}>
              <Form.Control 
                type="search" 
                placeholder="Search invoices..." 
                onChange={(e) => setCurrentFilters({ ...currentFilters, search: e.target.value })}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* {session?.user?.permissions?.includes('list-invoices-billing') && ( */}
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
      {/* )} */}

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && (
        <Modal
          show={showCreateInvoiceModal}
          onHide={closeCreateInvoiceModal}
          size="xl"
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
                    {/* <option value="recurring">Recurring</option> */}
                  </select>
                </div>
              </div>
            </div>

            {/* <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceStatus">Status</label>
                  <select
                    className="form-control"
                    id="newInvoiceStatus"
                    value={newInvoice.status}
                    onChange={(e) =>
                      handleNewInvoiceChange("status", e.target.value)
                    }
                  >
                    <option value={STATUS_DRAFT}>Draft</option>
                    <option value={STATUS_SENT}>Sent</option>
                    <option value={STATUS_PAID}>Paid</option>
                    <option value={STATUS_OVERDUE}>Overdue</option>
                    <option value={STATUS_CANCELLED}>Cancelled</option>
                  </select>
                </div>
              </div>
            </div> */}

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
                            <th>Base Price</th>
                            <th>Unit Price</th>
                            <th>VAT %</th>
                            <th>VAT Amount</th>
                            <th>Line Total</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newInvoice.items.map((item, index) => {
                            const product = companyProducts.find(p => p.id.toString() === item.product_id);
                            const quantity = parseFloat(item.quantity) || 0;
                            const unitPrice = parseFloat(item.unit_price) || 0;
                            
                            // Get product currency and convert to invoice currency
                            const productInfo = getEffectiveProductPrice(item.product_id, newInvoice.company_id);
                            const productCurrency = productInfo.currency;
                            const exchangeRate = getExchangeRate(productCurrency, newInvoice.currency_code);
                            const convertedUnitPrice = unitPrice * exchangeRate;
                            const lineSubtotal = quantity * convertedUnitPrice;
                            
                            // Use processed item data if available, otherwise calculate inline
                            const processedItem = processedInvoiceItems[index];
                            const lineVatAmount = processedItem ? processedItem.line_vat_amount : 0;
                            const lineTotal = processedItem ? processedItem.line_total : lineSubtotal;
                            
                            // Get VAT exemption status for display
                            const selectedCompany = companies.find(c => c.id.toString() === newInvoice.company_id);
                            const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
                            
                            return (
                              <tr key={index}>
                                <td colSpan={2}>
                                  <select
                                    className="form-control form-control-sm"
                                    value={item.product_id}
                                    onChange={(e) => updateNewInvoiceItem(index, "product_id", e.target.value)}
                                  >
                                    <option value="">Select Product</option>
                                    {getProductsToDisplay(newInvoice.company_id).map((product) => {
                                      const productInfo = getEffectiveProductPrice(product.id.toString(), newInvoice.company_id);
                                      return (
                                        <option key={product.id} value={product.id.toString()}>
                                          {product.name} - {productInfo.currency} {productInfo.price}
                                          {product.pricing_type === "company_specific" && product.company_pricing ? " (Company Price)" : ""}
                                          {productInfo.includesVat ? " (incl. VAT)" : " (excl. VAT)"}
                                        </option>
                                      );
                                    })}
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
                                  <div className="text-center">
                                    <div className="fw-bold text-muted">
                                      {productInfo.currency} {productInfo.price}
                                    </div>
                                    <small className="text-muted">
                                      {isLoadingExchangeRates && productCurrency !== newInvoice.currency_code && (
                                        <span>
                                          <Spinner animation="border" size="sm" className="me-1" />
                                          Converting...
                                        </span>
                                      )}
                                    </small>
                                  </div>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    value={convertedUnitPrice.toFixed(2)}
                                    onChange={(e) => {
                                      // Convert back to original currency for storage
                                      const convertedValue = parseFloat(e.target.value) || 0;
                                      const originalValue = convertedValue / exchangeRate;
                                      updateNewInvoiceItem(index, "unit_price", originalValue.toFixed(2));
                                    }}
                                    placeholder="0.00"
                                  />
                                  <small className="text-muted">
                                    {newInvoice.currency_code}
                                  </small>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    value={item.tax_rate}
                                    onChange={(e) => updateNewInvoiceItem(index, "tax_rate", e.target.value)}
                                    placeholder="0.00"
                                    disabled={isVatExempt}
                                  />
                                  {isVatExempt && (
                                    <small className="text-muted">Exempt</small>
                                  )}
                                </td>
                                <td>
                                  <span className="fw-bold text-warning">
                                    {isLoadingExchangeRates && productCurrency !== newInvoice.currency_code ? (
                                      <span className="text-muted">
                                        <Spinner animation="border" size="sm" className="me-1" />
                                        Loading...
                                      </span>
                                    ) : (
                                      `${newInvoice.currency_code} ${lineVatAmount.toFixed(2)}`
                                    )}
                                  </span>
                                </td>
                                <td>
                                  <span className="fw-bold">
                                    {isLoadingExchangeRates && productCurrency !== newInvoice.currency_code ? (
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
              <div className="col-md-3">
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
              <div className="col-md-3">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceTaxAmount">
                    VAT Amount 
                    <small className="text-muted">(Auto-calculated)</small>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="newInvoiceTaxAmount"
                    value={isLoadingExchangeRates && newInvoice.currency_code !== 'USD' ? 'Loading...' : newInvoice.tax_amount}
                    readOnly
                    placeholder="0.00"
                  />
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Calculated based on VAT rate above
                  </small>
                </div>
              </div>
              <div className="col-md-3">
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


            {/* Company VAT Information - Read Only */}
            {newInvoice.company_id && (
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label>VAT Information (Auto-Applied)</label>
                    <div className="card">
                      <div className="card-body">
                        {(() => {
                          const selectedCompany = companies.find(c => c.id.toString() === newInvoice.company_id);
                          console.log("Selected company for VAT display:", selectedCompany);
                          const vatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
                          const isVatExempt = selectedCompany?.profile?.vat_exemption;
                          const paymentTerm = selectedCompany?.profile?.payment_terms;
                          
                          console.log("VAT Rate:", vatRate, "Is VAT Exempt:", isVatExempt, "Payment Term:", paymentTerm, selectedCompany);
                          
                          return (
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="fas fa-info-circle text-info me-2"></i>
                                  <strong>VAT Rate:</strong> 
                                  <span className={`ms-2 badge ${isVatExempt ? 'bg-success' : 'bg-primary'}`}>
                                    {isVatExempt ? 'VAT Exempt' : `${vatRate}%`}
                                  </span>
                                </div>
                                {paymentTerm && (
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="fas fa-calendar-alt text-warning me-2"></i>
                                    <strong>Payment Term:</strong> 
                                    <span className="ms-2 badge bg-warning text-dark">
                                      {paymentTerm} days
                                    </span>
                                  </div>
                                )}
                                {selectedCompany?.profile?.tax_id && (
                                  <div className="text-muted small">
                                    <strong>Tax ID:</strong> {selectedCompany.profile.tax_id}
                                  </div>
                                )}
                              </div>
                              <div className="text-muted small text-end">
                                <div>VAT is automatically calculated</div>
                                <div>based on company settings</div>
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
                  <RichTextEditor
                    id="newInvoiceTerms"
                    value={newInvoice.terms_conditions}
                    onChange={(value) => handleNewInvoiceChange("terms_conditions", value)}
                    placeholder="Enter terms and conditions... Use bullet points (•), numbered lists (1.), and line breaks for formatting."
                    rows={6}
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
                    {/* <option value="recurring">Recurring</option> */}
                  </select>
                </div>
              </div>
            </div>

            {/* <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceStatus">Status</label>
                  <select
                    className="form-control"
                    id="editInvoiceStatus"
                    value={selectedInvoice.status || STATUS_DRAFT}
                    onChange={(e) =>
                      handleEditInvoiceChange("status", e.target.value)
                    }
                  >
                    <option value={STATUS_DRAFT}>Draft</option>
                    <option value={STATUS_SENT}>Sent</option>
                    <option value={STATUS_PAID}>Paid</option>
                    <option value={STATUS_OVERDUE}>Overdue</option>
                    <option value={STATUS_CANCELLED}>Cancelled</option>
                  </select>
                </div>
              </div>
            </div> */}

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
                            <th>Base Price</th>
                            <th>Unit Price</th>
                            <th>VAT %</th>
                            <th>VAT Amount</th>
                            <th>Line Total</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvoice.items.map((item, index) => {
                            const product = companyProducts.find(p => p.id.toString() === item.product_id);
                            const quantity = parseFloat(item.quantity) || 0;
                            const unitPrice = parseFloat(item.unit_price) || 0;
                            
                            // Get product currency and convert to invoice currency
                            const productInfo = getEffectiveProductPrice(item.product_id, selectedInvoice?.company_id);
                            const productCurrency = productInfo.currency;
                            const exchangeRate = getExchangeRate(productCurrency, selectedInvoice?.currency_code || 'USD');
                            const convertedUnitPrice = unitPrice * exchangeRate;
                            const lineSubtotal = quantity * convertedUnitPrice;
                            
                            // Calculate VAT for this line item using the item's tax_rate and tax_amount
                            const selectedCompany = companies.find(c => c.id.toString() === selectedInvoice?.company_id);
                            const companyVatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
                            const isVatExempt = selectedCompany?.profile?.vat_exemption || false;
                            
                            // Use the item's tax_rate and tax_amount if available
                            const effectiveVatRate = parseFloat(item.tax_rate) || companyVatRate;
                            const lineVatAmount = item.tax_amount ? parseFloat(item.tax_amount) : (isVatExempt ? 0 : lineSubtotal * (effectiveVatRate / 100));
                            const lineTotal = lineSubtotal + lineVatAmount;
                            
                            return (
                              <tr key={index}>
                                <td colSpan={2}>
                                  <select
                                    className="form-control form-control-sm"
                                    value={item.product_id}
                                    onChange={(e) => updateEditInvoiceItem(index, "product_id", e.target.value)}
                                  >
                                    <option value="">Select Product</option>
                                    {getProductsToDisplay(selectedInvoice?.company_id).map((product) => {
                                      const productInfo = getEffectiveProductPrice(product.id.toString(), selectedInvoice?.company_id);
                                      return (
                                        <option key={product.id} value={product.id.toString()}>
                                          {product.name} - {productInfo.currency} {productInfo.price}
                                          {product.pricing_type === "company_specific" && product.company_pricing ? " (Company Price)" : ""}
                                          {productInfo.includesVat ? " (incl. VAT)" : " (excl. VAT)"}
                                        </option>
                                      );
                                    })}
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
                                  <div className="text-center">
                                    <div className="fw-bold text-muted">
                                      {productInfo.currency} {productInfo.price}
                                    </div>
                                    <small className="text-muted">
                                      {isLoadingExchangeRates && productCurrency !== selectedInvoice?.currency_code && (
                                        <span>
                                          <Spinner animation="border" size="sm" className="me-1" />
                                          Converting...
                                        </span>
                                      )}
                                    </small>
                                  </div>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    value={convertedUnitPrice.toFixed(2)}
                                    onChange={(e) => {
                                      // Convert back to original currency for storage
                                      const convertedValue = parseFloat(e.target.value) || 0;
                                      const originalValue = convertedValue / exchangeRate;
                                      updateEditInvoiceItem(index, "unit_price", originalValue.toFixed(2));
                                    }}
                                    placeholder="0.00"
                                  />
                                  <small className="text-muted">
                                    {selectedInvoice?.currency_code}
                                  </small>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    value={item.tax_rate}
                                    onChange={(e) => updateEditInvoiceItem(index, "tax_rate", e.target.value)}
                                    placeholder="0.00"
                                    disabled={isVatExempt}
                                  />
                                  {isVatExempt && (
                                    <small className="text-muted">Exempt</small>
                                  )}
                                </td>
                                <td>
                                  <span className="fw-bold text-warning">
                                    {isLoadingExchangeRates && productCurrency !== selectedInvoice?.currency_code ? (
                                      <span className="text-muted">
                                        <Spinner animation="border" size="sm" className="me-1" />
                                        Loading...
                                      </span>
                                    ) : (
                                      `${selectedInvoice.currency_code} ${lineVatAmount.toFixed(2)}`
                                    )}
                                  </span>
                                </td>
                                <td>
                                  <span className="fw-bold">
                                    {isLoadingExchangeRates && productCurrency !== selectedInvoice?.currency_code ? (
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
              <div className="col-md-3">
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
              <div className="col-md-3">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceTaxAmount">
                    VAT Amount 
                    <small className="text-muted">(Auto-calculated)</small>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="editInvoiceTaxAmount"
                    value={isLoadingExchangeRates && selectedInvoice?.currency_code !== 'USD' ? 'Loading...' : (selectedInvoice.tax_amount || "")}
                    readOnly
                    placeholder="0.00"
                  />
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Calculated based on VAT rate above
                  </small>
                </div>
              </div>
              <div className="col-md-3">
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


            {/* Company VAT Information - Read Only */}
            {selectedInvoice.company_id && (
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label>VAT Information (Auto-Applied)</label>
                    <div className="card">
                      <div className="card-body">
                        {(() => {
                          const selectedCompany = companies.find(c => c.id.toString() === selectedInvoice.company_id);
                          console.log("Selected company for VAT display (edit):", selectedCompany);
                          const vatRate = selectedCompany?.profile?.vat_rate ? parseFloat(selectedCompany.profile.vat_rate) : 0;
                          const isVatExempt = selectedCompany?.profile?.vat_exemption;
                          const paymentTerm = selectedCompany?.profile?.payment_terms;
                          
                          console.log("VAT Rate (edit):", vatRate, "Is VAT Exempt (edit):", isVatExempt, "Payment Term (edit):", paymentTerm);
                          
                          return (
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="fas fa-info-circle text-info me-2"></i>
                                  <strong>VAT Rate:</strong> 
                                  <span className={`ms-2 badge ${isVatExempt ? 'bg-success' : 'bg-primary'}`}>
                                    {isVatExempt ? 'VAT Exempt' : `${vatRate}%`}
                                  </span>
                                </div>
                                {paymentTerm && (
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="fas fa-calendar-alt text-warning me-2"></i>
                                    <strong>Payment Term:</strong> 
                                    <span className="ms-2 badge bg-warning text-dark">
                                      {paymentTerm} days
                                    </span>
                                  </div>
                                )}
                                {selectedCompany?.profile?.tax_id && (
                                  <div className="text-muted small">
                                    <strong>Tax ID:</strong> {selectedCompany.profile.tax_id}
                                  </div>
                                )}
                              </div>
                              <div className="text-muted small text-end">
                                <div>VAT is automatically calculated</div>
                                <div>based on company settings</div>
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
                  <RichTextEditor
                    id="editInvoiceTerms"
                    value={selectedInvoice.terms_conditions || ""}
                    onChange={(value) => handleEditInvoiceChange("terms_conditions", value)}
                    placeholder="Enter terms and conditions... Use bullet points (•), numbered lists (1.), and line breaks for formatting."
                    rows={6}
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
              <DollarSign className="me-2" />
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
                    <p><strong>Invoice Date:</strong> {moment(selectedInvoiceForPayment.invoice_date).format('DD-MMM-YYYY')}</p>
                    <p><strong>Due Date:</strong> {selectedInvoiceForPayment.due_date ? moment(selectedInvoiceForPayment.due_date).format('DD-MMM-YYYY') : 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Subtotal:</strong> {selectedInvoiceForPayment.currency_code || 'USD'} {formatNumber(parseFloat(selectedInvoiceForPayment.subtotal || '0'))}</p>
                    <p><strong>VAT Amount:</strong> {selectedInvoiceForPayment.currency_code || 'USD'} {formatNumber(parseFloat(selectedInvoiceForPayment.tax_amount || '0'))}</p>
                    <p><strong className="text-primary">Total Amount:</strong> {selectedInvoiceForPayment.currency_code || 'USD'} {formatNumber(parseFloat(selectedInvoiceForPayment.total_amount || '0'))}</p>
                    
                    {/* Currency Conversion Display */}
                    {exchangeRates.length > 0 && baseCurrency !== (selectedInvoiceForPayment.currency_code || 'USD') && (
                      <div className="mt-3 p-2 bg-light rounded">
                        <small className="text-muted">Converted to {baseCurrency}:</small>
                        <div className="mt-1">
                          <div><strong>Subtotal:</strong> {baseCurrency} {formatNumber(parseFloat(selectedInvoiceForPayment.subtotal || '0') * getExchangeRate(selectedInvoiceForPayment.currency_code || 'USD', baseCurrency))}</div>
                          <div><strong>VAT Amount:</strong> {baseCurrency} {formatNumber(parseFloat(selectedInvoiceForPayment.tax_amount || '0') * getExchangeRate(selectedInvoiceForPayment.currency_code || 'USD', baseCurrency))}</div>
                          <div><strong className="text-primary">Total Amount:</strong> {baseCurrency} {formatNumber(parseFloat(selectedInvoiceForPayment.total_amount || '0') * getExchangeRate(selectedInvoiceForPayment.currency_code || 'USD', baseCurrency))}</div>
                        </div>
                        <small className="text-muted">
                          Exchange Rate: 1 {selectedInvoiceForPayment.currency_code || 'USD'} = {formatNumber(getExchangeRate(selectedInvoiceForPayment.currency_code || 'USD', baseCurrency))} {baseCurrency}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <h6 className="mb-3">Payment Method</h6>

              {/* Tabs */}
              <ul className="nav nav-tabs mb-3" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activePaymentTab === 'saved-cards' ? 'active' : ''}`}
                    onClick={() => setActivePaymentTab('saved-cards')}
                    type="button"
                    role="tab"
                  >
                    Saved Cards
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activePaymentTab === 'direct-payment' ? 'active' : ''}`}
                    onClick={() => setActivePaymentTab('direct-payment')}
                    type="button"
                    role="tab"
                  >
                    Direct Payment
                  </button>
                </li>
              </ul>

              {/* Tab Content */}
              <div className="tab-content">
                {/* Saved Cards Tab */}
                {activePaymentTab === 'saved-cards' && (
                  <div className="tab-pane active">
                    {paymentMethods.length > 0 ? (
                      <div>
                        <div className="mb-3">
                          {paymentMethods
                            .filter((method) => method.type === 'card')
                            .map((method) => (
                              <label
                                key={method.id}
                                htmlFor={`card-${method.id}`}
                                className={`card mb-2 ${selectedCardId === method.id ? 'border-primary' : ''}`}
                                style={{ cursor: 'pointer', marginBottom: 0 }}
                              >
                                <div className="card-body">
                                  <div className="d-flex align-items-center">
                                    <div className="form-check me-3">
                                      <input
                                        className="form-check-input"
                                        type="radio"
                                        name="selectedCard"
                                        id={`card-${method.id}`}
                                        checked={selectedCardId === method.id}
                                        onChange={() => setSelectedCardId(method.id)}
                                      />
                                    </div>
                                    <div className="flex-grow-1">
                                      <div className="d-flex align-items-center justify-content-between">
                                        <div>
                                          <h6 className="mb-0 text-capitalize">
                                            {method.card?.brand || 'Card'} •••• {method.card?.last4}
                                          </h6>
                                          <small className="text-muted">
                                            {method.billing_details?.name || 'Cardholder'}
                                          </small>
                                        </div>
                                        <div className="text-end">
                                          <small className="text-muted d-block">
                                            Expires {method.card?.exp_month}/{method.card?.exp_year}
                                          </small>
                                          {method.is_default && (
                                            <span className="badge bg-success">Default</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </label>
                            ))}
                        </div>
                        <Button
                          variant="success"
                          className="w-100"
                          onClick={handlePaymentWithSavedCard}
                          disabled={!selectedCardId || isProcessingPayment || isCreateInvoicePaymentPending}
                        >
                          {isProcessingPayment || isCreateInvoicePaymentPending ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              <FaCreditCard className="me-2" />
                              Make Payment
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted">No saved cards available</p>
                        <small className="text-muted">Use the Direct Payment tab to add a new card</small>
                      </div>
                    )}
                  </div>
                )}

                {/* Direct Payment Tab */}
                {activePaymentTab === 'direct-payment' && (
                  <div className="tab-pane active">
                    {stripePublishableKey ? (
                      <Elements stripe={loadStripe(stripePublishableKey)}>
                        <DirectCardPaymentForm
                          amount={parseFloat(selectedInvoiceForPayment.total_amount || '0')}
                          currency={selectedInvoiceForPayment.currency_code || 'USD'}
                          invoiceId={selectedInvoiceForPayment.id}
                          customerId={parseInt(selectedInvoiceForPayment.company_id || '0')}
                          onPaymentSuccess={handleDirectPaymentSuccess}
                          onPaymentError={handleDirectPaymentError}
                        />
                      </Elements>
                    ) : (
                      <div className="text-center py-3">
                        <Spinner animation="border" size="sm" className="me-2" />
                        <span>Loading Stripe...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
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

