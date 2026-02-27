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

import PrimeAlleyLogo from "@assets/images/Prime3.png";
import Layout from "@layout/index";
import GenericTable, { TableColumn, TableAction as GenericTableAction } from "@components/GenericTable";
import GenericSidebar from "@components/GenericSidebar";
import { ModuleSlug } from "@utils/Helper";
import GenericFilterSidebar, { FilterField } from "@components/GenericFilterSidebar";
import {
  getInvoices,
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
} from "@utils/accounts";
import { GetPaymentMethods,CompletePayment } from "@utils/accounting";
import { getMinifiedCompanies } from "@utils/crm";
import { formatNumber, GlobalDateFormat, getCompanyByCrmId } from "@utils/Helper";

import { Button, Modal, Row, Form, Alert, Card, Badge, Table } from "react-bootstrap";
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
import TableAction, { Action } from "@components/TableAction";
import { Spinner } from "react-bootstrap";
import { Divide, DollarSign, Download, FileText, Calendar, Eye, Layers, Receipt, CheckCircle, Clock, AlertCircle, Ban, Filter } from "lucide-react";

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

  // Helper function to extract payment ID from payment result (handles both response structures)
  const getPaymentId = (paymentResult: any): string | number | undefined => {
    return paymentResult?.payment?.id || paymentResult?.data?.payment?.id;
  };

  // Helper function to mark payment as complete
  const markPaymentComplete = async (paymentResult: any): Promise<void> => {
    console.log('Marking payment as complete:', paymentResult);
    const paymentId = getPaymentId(paymentResult);
    if (paymentId) {
      try {
        await CompletePayment({
          payment_id: paymentId,
          payment_method: "stripe",
        });
      } catch (error: any) {
        console.error('Error marking payment as complete:', error);
        // Don't throw - payment succeeded on Stripe, just failed to update our DB
        // The webhook or polling will eventually update the status
      }
    }
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
        onSuccess: async (paymentResult: any) => {
          // Handle payment result based on status
          console.log(paymentResult, "Payment Intent Response");
          
          // Check if payment was already completed
          if (paymentResult?.already_completed) {
            setIsProcessing(false);
            onPaymentSuccess();
            toast.success("Payment was already completed successfully!");
            return;
          }
          
          // Extract payment intent from nested structure
          // Response structure: { success: true, data: { payment: { gateway_response: {...} } }, client_secret: "..." }
          const gatewayResponse = paymentResult?.payment?.gateway_response || paymentResult?.data?.payment?.gateway_response;
          const clientSecret = paymentResult?.client_secret || paymentResult?.data?.client_secret || gatewayResponse?.client_secret || paymentResult?.payment_data?.client_secret;
          const paymentStatus = gatewayResponse?.status || paymentResult?.status;
          
          console.log('Payment Status:', paymentStatus);
          console.log('Client Secret:', clientSecret);
          console.log('Gateway Response:', gatewayResponse);
          
          // Check if this is a duplicate/reused payment
          if (paymentResult?.duplicate) {
            // This is a reused existing payment - extract client_secret and handle 3D Secure
            if (clientSecret && stripe) {
              // Check if confirmation_method is manual AND status is requires_action
              // handleCardAction can only be used when payment is in requires_action state
              const confirmationMethod = gatewayResponse?.confirmation_method;
              const requiresAction = paymentStatus === 'requires_action';
              
              // Handle 3D Secure for the reused payment
              try {
                let paymentIntent;
                let confirmError;
                
                if (confirmationMethod === 'manual' && requiresAction) {
                  // For manual confirmation with requires_action status, use handleCardAction
                  console.log('Using handleCardAction for duplicate payment (manual confirmation, requires_action)...');
                  const result = await stripe.handleCardAction(clientSecret);
                  confirmError = result.error;
                  paymentIntent = result.paymentIntent;
                } else if (confirmationMethod === 'manual' && !requiresAction) {
                  // Manual confirmation but not in requires_action state
                  // Backend will handle confirmation, just wait and refresh
                  console.log('Manual confirmation method for duplicate payment, not in requires_action state. Backend will handle confirmation.');
                  setIsProcessing(false);
                  onPaymentSuccess();
                  toast.info('Payment is being processed by the backend. Please wait...', {
                    autoClose: 3000
                  });
                  return;
                } else {
                  // For automatic confirmation, use confirmCardPayment
                  const result = await stripe.confirmCardPayment(clientSecret);
                  confirmError = result.error;
                  paymentIntent = result.paymentIntent;
                }
                
                if (confirmError) {
                  setIsProcessing(false);
                  toast.error(
                    confirmError.message || 
                    'Authentication failed. Please try again or use a different card.'
                  );
                  return;
                }
                
                // Check payment intent status
                if (paymentIntent?.status === 'succeeded') {
                  // Payment succeeded, update status
                  const paymentId = paymentResult?.payment?.id || paymentResult?.payment_id || paymentResult?.data?.payment?.id || paymentResult?.data?.payment_id;
                  if (paymentId) {
                    try {
                      await CompletePayment({
                        payment_id: paymentId,
                        payment_method: "stripe",
                      });
                      setIsProcessing(false);
                      onPaymentSuccess();
                      toast.success("Payment authenticated and processed successfully!");
                    } catch (error: any) {
                      console.error('Failed to update payment status:', error);
                      setIsProcessing(false);
                      onPaymentSuccess();
                      toast.success("Payment authenticated successfully! Status update may be delayed.");
                    }
                  } else {
                    setIsProcessing(false);
                    onPaymentSuccess();
                    toast.success("Payment authenticated and processed successfully!");
                  }
                } else if (paymentIntent?.status === 'requires_confirmation') {
                  // 3D Secure completed successfully, but payment needs backend confirmation
                  // Challenge is complete, so we should call CompletePayment
                  console.log('Payment requires backend confirmation after 3D Secure (duplicate payment)');
                  
                  const paymentId = paymentResult?.payment?.id || paymentResult?.payment_id || paymentResult?.data?.payment?.id || paymentResult?.data?.payment_id;
                  
                  if (paymentId) {
                    try {
                      await CompletePayment({
                        payment_id: paymentId,
                        payment_method: "stripe",
                      });
                      setIsProcessing(false);
                      onPaymentSuccess();
                      toast.success("3D Secure authentication completed! Payment is being processed...");
                    } catch (error: any) {
                      console.error('Failed to update payment status:', error);
                      setIsProcessing(false);
                      onPaymentSuccess();
                      toast.info('3D Secure authentication completed! Payment is being processed...', {
                        autoClose: 3000
                      });
                    }
                  } else {
                    setIsProcessing(false);
                    onPaymentSuccess();
                    toast.info('3D Secure authentication completed! Payment is being processed...', {
                      autoClose: 3000
                    });
                  }
                } else {
                  setIsProcessing(false);
                  toast.error("Payment authentication incomplete. Please try again.");
                }
              } catch (authError: any) {
                setIsProcessing(false);
                toast.error(
                  authError.message ||
                  'Authentication process failed. Please try again.'
                );
              }
            } else {
              // No client_secret for duplicate payment, just refresh
              setIsProcessing(false);
              onPaymentSuccess();
              toast.success("Payment processed successfully!");
            }
            return; // Exit early for duplicate payments
          }
          
          // Check if payment requires 3D Secure authentication
          if (clientSecret && stripe) {
            try {
              // Check if confirmation_method is manual AND status is requires_action
              // handleCardAction can only be used when payment is in requires_action state
              const confirmationMethod = gatewayResponse?.confirmation_method;
              const requiresAction = paymentStatus === 'requires_action';
              
              if (confirmationMethod === 'manual' && requiresAction) {
                // For manual confirmation with requires_action status, use handleCardAction to show 3D Secure modal
                // After customer completes 3D Secure, backend will confirm the payment
                console.log('Using handleCardAction for 3D Secure authentication (manual confirmation, requires_action)...');
                
                const { error: handleError, paymentIntent } = await stripe.handleCardAction(clientSecret);

                if (handleError) {
                  setIsProcessing(false);
                  toast.error(
                    handleError.message || 
                    '3D Secure authentication failed. Please try again.'
                  );
                  return;
                }

                console.log('3D Secure completed, payment intent status:', paymentIntent?.status);

                // After 3D Secure, check the payment intent status
                if (paymentIntent?.status === 'succeeded') {
                  // Payment succeeded, update status
                  const paymentId = paymentResult?.payment?.id || 
                                   paymentResult?.payment_id || 
                                   paymentResult?.data?.payment?.id ||
                                   paymentResult?.data?.payment_id;
                  
                  if (paymentId) {
                    try {
                      await CompletePayment({
                        payment_id: paymentId,
                        payment_method: "stripe",
                      });
                      setIsProcessing(false);
                      onPaymentSuccess();
                      toast.success("Payment authenticated and processed successfully!");
                    } catch (error: any) {
                      console.error('Failed to update payment status:', error);
                      setIsProcessing(false);
                      onPaymentSuccess();
                      toast.success("Payment authenticated successfully! Status update may be delayed.");
                    }
                  } else {
                    setIsProcessing(false);
                    onPaymentSuccess();
                    toast.success("Payment authenticated and processed successfully!");
                  }
                } else if (paymentIntent?.status === 'requires_confirmation') {
                  // 3D Secure completed successfully, but payment needs backend confirmation
                  // Challenge is complete, so we should call CompletePayment
                  console.log('Payment requires backend confirmation after 3D Secure');
                  
                  const paymentId = paymentResult?.payment?.id || 
                                   paymentResult?.payment_id || 
                                   paymentResult?.data?.payment?.id ||
                                   paymentResult?.data?.payment_id;
                  
                  if (paymentId) {
                    try {
                      await CompletePayment({
                        payment_id: paymentId,
                        payment_method: "stripe",
                      });
                      setIsProcessing(false);
                      onPaymentSuccess();
                      toast.success("3D Secure authentication completed! Payment is being processed...");
                    } catch (error: any) {
                      console.error('Failed to update payment status:', error);
                      setIsProcessing(false);
                      onPaymentSuccess();
                      toast.info('3D Secure authentication completed! Payment is being processed...', {
                        autoClose: 3000
                      });
                    }
                  } else {
                    setIsProcessing(false);
                    onPaymentSuccess();
                    toast.info('3D Secure authentication completed! Payment is being processed...', {
                      autoClose: 3000
                    });
                  }
                } else if (paymentIntent?.status === 'requires_action') {
                  // Still requires action - might need another challenge
                  setIsProcessing(false);
                  toast.error('Payment requires additional verification. Please try again.');
                } else {
                  setIsProcessing(false);
                  toast.error(`Payment status after 3D Secure: ${paymentIntent?.status}`);
                }
              } else if (confirmationMethod === 'manual' && !requiresAction) {
                // Manual confirmation but not in requires_action state
                // Backend will handle confirmation, just wait and refresh
                console.log('Manual confirmation method, payment not in requires_action state. Backend will handle confirmation.');
                setIsProcessing(false);
                onPaymentSuccess();
                toast.info('Payment is being processed by the backend. Please wait...', {
                  autoClose: 3000
                });
              } else {
                // For automatic confirmation or when not manual, use confirmCardPayment
                const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
                  clientSecret
                );
                
                if (confirmError) {
                  setIsProcessing(false);
                  toast.error(
                    confirmError.message || 
                    'Authentication failed. Please try again or use a different card.'
                  );
                  return;
                }
                
                // Check payment intent status
                if (paymentIntent?.status === 'succeeded') {
                  // Payment succeeded on Stripe, now update our database
                  // Extract payment ID from response (could be nested)
                  const paymentId = paymentResult?.payment?.id || 
                                   paymentResult?.payment_id || 
                                   paymentResult?.data?.payment?.id ||
                                   paymentResult?.data?.payment_id;
                  
                  if (paymentId) {
                    try {
                      await CompletePayment({
                        payment_id: paymentId,
                        payment_method: "stripe",
                      });
                      setIsProcessing(false);
                      onPaymentSuccess();
                      toast.success("Payment authenticated and processed successfully!");
                    } catch (error: any) {
                      // Even if completePayment fails, payment succeeded on Stripe
                      // Log error but still show success to user
                      console.error('Failed to update payment status:', error);
                      setIsProcessing(false);
                      onPaymentSuccess();
                      toast.success("Payment authenticated successfully! Status update may be delayed.");
                    }
                  } else {
                    // No payment ID found, just refresh and let webhook handle it
                    console.warn('Payment ID not found in response, webhook will update status');
                    setIsProcessing(false);
                    onPaymentSuccess();
                    toast.success("Payment authenticated successfully! Status will be updated shortly.");
                  }
                } else if (paymentIntent?.status === 'requires_action') {
                  // Should not happen after confirmCardPayment, but handle just in case
                  setIsProcessing(false);
                  toast.error("Payment requires additional authentication. Please try again.");
                } else {
                  setIsProcessing(false);
                  onPaymentSuccess();
                  toast.success("Payment processed successfully!");
                }
              }
            } catch (authError: any) {
              setIsProcessing(false);
              toast.error(
                authError.message ||
                'Authentication process failed. Please try again.'
              );
            }
          } else {
            // No 3D Secure required, payment completed
            setIsProcessing(false);
            onPaymentSuccess();
            toast.success("Payment processed successfully!");
          }
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
  const [currentFilters, setCurrentFilters] = useState<{
    search?: string;
    status?: string;
    invoice_date_from?: string;
    invoice_date_to?: string;
    date_from?: string;
    date_to?: string;
  }>({});
  const [activeStatusTab, setActiveStatusTab] = useState<string | null>(null);
  const [showFilterTabs, setShowFilterTabs] = useState<boolean>(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState<boolean>(false);
  const [pendingFilters, setPendingFilters] = useState<{
    search?: string;
    status?: string;
    invoice_date_from?: string;
    invoice_date_to?: string;
    date_from?: string;
  date_to?: string;
  }>({});
  const [showDescriptionModal, setShowDescriptionModal] = useState<boolean>(false);
  const [selectedDescription, setSelectedDescription] = useState<string>('');

  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [companyProducts, setCompanyProducts] = useState<ProductData[]>([]);
  const [isLoadingCompanyProducts, setIsLoadingCompanyProducts] = useState<boolean>(false);
  const [companyOptions, setCompanyOptions] = useState<{ id: string | number; name?: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number | ''>('');

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceData | null>(null);
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [stripePublishableKey, setStripePublishableKey] = useState<string>("");
  const [activePaymentTab, setActivePaymentTab] = useState<string>("saved-cards");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  // View invoice modal states
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState<boolean>(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<any | null>(null);
  
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

  const getStatusBadgeVariant = (status: string): string => {
    switch (status) {
      case STATUS_DRAFT: return "secondary";
      case STATUS_SENT: return "info";
      case STATUS_PAID: return "success";
      case STATUS_OVERDUE: return "danger";
      case STATUS_CANCELLED: return "dark";
      case STATUS_PARTIALLY_PAID: return "warning";
      case STATUS_FAILED: return "danger";
      case STATUS_REFUNDED: return "danger";
      case STATUS_PENDING: return "warning";
      default: return "secondary";
    }
  };
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case STATUS_DRAFT: return "Draft";
      case STATUS_SENT: return "Sent";
      case STATUS_PAID: return "Paid";
      case STATUS_OVERDUE: return "Overdue";
      case STATUS_CANCELLED: return "Cancelled";
      case STATUS_PARTIALLY_PAID: return "Partially Paid";
      case STATUS_FAILED: return "Failed";
      case STATUS_REFUNDED: return "Refunded";
      case STATUS_PENDING: return "Pending";
      default: return status || "Draft";
    }
  };

  const openInvoiceSidebar = useCallback((row: InvoiceData) => {
    setSelectedInvoiceSidebar(row);
    setShowInvoiceSidebar(true);
  }, []);
  const closeInvoiceSidebar = useCallback(() => {
    setShowInvoiceSidebar(false);
    setSelectedInvoiceSidebar(null);
  }, []);

  const handleViewInvoice = useCallback(async (invoice: InvoiceData) => {
    const invoiceDetails = await getInvoice(invoice.id);
    setSelectedInvoiceForView(invoiceDetails);
    setShowViewInvoiceModal(true);
  }, []);

  const closeViewInvoiceModal = useCallback(() => {
    setShowViewInvoiceModal(false);
    setSelectedInvoiceForView(null);
  }, []);

  const handleOpenFiltersSidebar = useCallback(() => {
    setPendingFilters({ ...currentFilters });
    setShowFiltersSidebar(true);
  }, [currentFilters]);
  const handleCloseFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(false);
  }, []);

  const tableColumns: TableColumn<InvoiceData>[] = useMemo(
    () => [
      {
        key: "invoice_number",
        label: "Invoice Number",
        sortable: true,
        render: (row) => <span>#{row.invoice_number}</span>,
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        type: "badge",
        accessor: (row) => getStatusLabel(row.status || STATUS_DRAFT),
        badge: { getVariant: (row) => getStatusBadgeVariant(row.status || STATUS_DRAFT) as any },
      },
      {
        key: "total_amount",
        label: "Total Amount",
        sortable: true,
        render: (row) => (
          <span>
            {row.currency_code || "AED"} {formatNumber(parseFloat(row?.total_amount || "0"))}
          </span>
        ),
      },
      {
        key: "amount_due",
        label: "Amount Due",
        sortable: true,
        render: (row) => (
          <span>
            {row.currency_code || "AED"} {formatNumber(parseFloat(row?.amount_due || "0"))}
          </span>
        ),
      },
      {
        key: "invoice_date",
        label: "Invoice Date",
        sortable: true,
        accessor: (row) => (row.invoice_date ? moment(row.invoice_date).format("DD-MMM-YYYY") : ""),
      },
      {
        key: "due_date",
        label: "Due Date",
        sortable: true,
        accessor: (row) =>
          row.due_date ? moment(row.due_date).format("DD-MMM-YYYY") : "No due date",
      },
    ],
    []
  );

  const invoiceTableActions: GenericTableAction<InvoiceData>[] = useMemo(
    () => [
      {
        label: "View",
        icon: <Eye size={16} />,
        onClick: (row: InvoiceData) => handleViewInvoice(row),
      },
      {
        label: "Pay Now",
        icon: <DollarSign size={16} />,
        // variant: "danger",
        show: (row: InvoiceData) =>
          (row.status === STATUS_PENDING || row.status === STATUS_OVERDUE || row.status === STATUS_PARTIALLY_PAID) &&
          !!session?.user?.permissions?.includes("pay-invoices-billing"),
        onClick: (row: InvoiceData) => handlePayInvoice(row),
      },
      {
        label: "Download",
        icon: <Download size={16} />,
        onClick: (row: InvoiceData) => handleDownloadPDF(row),
      },
    ],
    [session?.user?.permissions, handleViewInvoice]
  );

  const invoiceFilterFields: FilterField[] = useMemo(
    () => [
      {
        id: "search",
        label: "Search",
        type: "text",
        value: pendingFilters.search ?? "",
        onChange: (value) =>
          setPendingFilters((prev) => ({ ...prev, search: value || undefined })),
        placeholder: "Search by invoice number...",
      },
      {
        id: "status",
        label: "Status",
        type: "dropdown",
        value: pendingFilters.status ?? "",
        onChange: (value) =>
          setPendingFilters((prev) => ({ ...prev, status: value || undefined })),
        options: [
          { value: "", label: "All Status" },
          { value: STATUS_DRAFT, label: "Draft" },
          { value: STATUS_SENT, label: "Sent" },
          { value: STATUS_PAID, label: "Paid" },
          { value: STATUS_PENDING, label: "Pending" },
          { value: STATUS_OVERDUE, label: "Overdue" },
          { value: STATUS_PARTIALLY_PAID, label: "Partially Paid" },
          { value: STATUS_CANCELLED, label: "Cancelled" },
          { value: STATUS_FAILED, label: "Failed" },
          { value: STATUS_REFUNDED, label: "Refunded" },
        ],
      },
      {
        id: "invoice_date_from",
        label: "Invoice Date From",
        type: "date",
        value: pendingFilters.invoice_date_from ?? "",
        onChange: (value) =>
          setPendingFilters((prev) => ({ ...prev, invoice_date_from: value || undefined })),
      },
      // {
      //   id: "invoice_date_to",
      //   label: "Invoice Date To",
      //   type: "date",
      //   value: pendingFilters.invoice_date_to ?? "",
      //   onChange: (value) =>
      //     setPendingFilters((prev) => ({ ...prev, invoice_date_to: value || undefined })),
      // },
      {
        id: "due_date_from",
        label: "Date From",
        type: "date",
        value: pendingFilters.date_from ?? "",
        onChange: (value) =>
          setPendingFilters((prev) => ({ ...prev, date_from: value || undefined })),
      },
      {
        id: "due_date_to",
        label: "Date To",
        type: "date",
        value: pendingFilters.date_to ?? "",
        onChange: (value) =>
          setPendingFilters((prev) => ({ ...prev, date_to: value || undefined })),
      },
    ],
    [
      pendingFilters.search,
      pendingFilters.status,
      pendingFilters.invoice_date_from,
      pendingFilters.invoice_date_to,
      pendingFilters.date_from,
      pendingFilters.date_to,
    ]
  );

  // Load company-specific products
  const loadCompanyProducts = useCallback(async (companyId: number) => {
    if (!companyId) {
      console.log("No company ID provided to loadCompanyProducts");
      setCompanyProducts([]);
      return;
    }

   
    setIsLoadingCompanyProducts(true);
    try {
      const response = await getProductsWithCompanyPricing(companyId);
      
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

 

  // Load exchange rates directly from free API
  const loadExchangeRates = useCallback(async (invoiceCurrency: string) => {
    
    // If we already have rates loaded for this currency, don't reload
    if (exchangeRates.length > 0 && baseCurrency === invoiceCurrency && !isInitialLoad) {
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
        
        // Load products for the first company if available
        if (companiesData.data && companiesData.data.length > 0) {
          const firstCompany = companiesData.data[0];
         // await loadCompanyProducts(firstCompany.id);
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };
    const fetchCompanyOptions = async () => {
      try {
        const result = await getMinifiedCompanies({ send_all: "true" });
        setCompanyOptions(result ?? []);
      } catch (e) {
        console.error("Error fetching company options:", e);
      }
    };

    fetchCompanies();
    fetchCompanyOptions();
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

  const [invoiceList, setInvoiceList] = useState<InvoiceData[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    totalRows: 0,
  });
  const [selectedInvoiceSidebar, setSelectedInvoiceSidebar] = useState<InvoiceData | null>(null);
  const [showInvoiceSidebar, setShowInvoiceSidebar] = useState(false);
  const invoiceRequestIdRef = React.useRef(0);

  const loadInvoices = useCallback(async () => {
    invoiceRequestIdRef.current += 1;
    const currentRequestId = invoiceRequestIdRef.current;
    setInvoiceLoading(true);
    try {
      const response = await getInvoices({
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
        search: memoizedFilters.search || "",
        ...memoizedFilters,
        ...(selectedCompanyId ? { crm_company_id: selectedCompanyId } : {}),
      });
      if (currentRequestId !== invoiceRequestIdRef.current) return;
      const data = response?.data || [];
      const total = response?.pagination?.total ?? 0;
      setInvoiceList(data);
      setTotalRecords(total);
      setPagination((prev) => ({ ...prev, totalRows: total }));
      if (response?.summary) setSummary(response.summary);
    } catch (error) {
      if (currentRequestId !== invoiceRequestIdRef.current) return;
      console.error("Error fetching invoices:", error);
      setInvoiceList([]);
      setTotalRecords(0);
      setPagination((prev) => ({ ...prev, totalRows: 0 }));
    } finally {
      if (invoiceRequestIdRef.current === currentRequestId) {
        setInvoiceLoading(false);
      }
    }
  }, [pagination.currentPage, pagination.rowsPerPage, memoizedFilters, refreshKey, selectedCompanyId]);

  React.useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const fetchInvoices = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        const response = await getInvoices({
          page,
          per_page: perPage,
          search,
          ...memoizedFilters,
          ...(selectedCompanyId ? { crm_company_id: selectedCompanyId } : {}),
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
    [memoizedFilters, selectedCompanyId]
  );

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

  // Edit Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceFormData | null>(
    null
  );

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
    //toast.success("Payment processed successfully");
    
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
      onSuccess: async (paymentResult: any) => {
        // Check if payment was already completed
        if (paymentResult?.already_completed) {
          setIsProcessingPayment(false);
          handleDirectPaymentSuccess();
          toast.success("Payment was already completed successfully!");
          return;
        }

        // Helper function to extract payment ID from payment result (handles both response structures)
        const getPaymentId = (result: any): string | number | undefined => {
          return result?.payment?.id || result?.data?.payment?.id || result?.payment_id || result?.data?.payment_id;
        };

        // Helper function to mark payment as complete
        const markPaymentComplete = async (result: any): Promise<void> => {
          console.log('Marking payment as complete:', result);
          const paymentId = getPaymentId(result);
          if (paymentId) {
            try {
              await CompletePayment({
                payment_id: paymentId,
                payment_method: "stripe",
              });
            } catch (error: any) {
              console.error('Error marking payment as complete:', error);
              // Don't throw - payment succeeded on Stripe, just failed to update our DB
              // The webhook or polling will eventually update the status
            }
          }
        };

        // Extract payment intent from nested structure
        // Response structure: { success: true, data: { payment: { gateway_response: {...} } }, client_secret: "..." }
        const gatewayResponse = paymentResult?.payment?.gateway_response || paymentResult?.data?.payment?.gateway_response;
        const clientSecret = paymentResult?.client_secret || paymentResult?.data?.client_secret || gatewayResponse?.client_secret || paymentResult?.payment_data?.client_secret;
        const paymentStatus = gatewayResponse?.status || paymentResult?.status;
        
        // Check if this is a duplicate/reused payment
        if (paymentResult?.duplicate) {
          // This is a reused existing payment - extract client_secret and handle 3D Secure
          if (clientSecret) {
            // Load Stripe to confirm payment
            if (!stripePublishableKey) {
              handleDirectPaymentError('Stripe is not initialized');
              setIsProcessingPayment(false);
              return;
            }

            const stripeInstance = await loadStripe(stripePublishableKey);
            if (!stripeInstance) {
              handleDirectPaymentError('Failed to load Stripe');
              setIsProcessingPayment(false);
              return;
            }

            // Check if confirmation_method is manual AND status is requires_action
            // handleCardAction can only be used when payment is in requires_action state
            const confirmationMethod = gatewayResponse?.confirmation_method;
            const requiresAction = paymentStatus === 'requires_action';
            
            // Handle 3D Secure for the reused payment
            try {
              let paymentIntent;
              let confirmError;
              
              if (confirmationMethod === 'manual' && requiresAction) {
                // For manual confirmation with requires_action status, use handleCardAction
                console.log('Using handleCardAction for duplicate payment (manual confirmation, requires_action)...');
                const result = await stripeInstance.handleCardAction(clientSecret);
                confirmError = result.error;
                paymentIntent = result.paymentIntent;
              } else if (confirmationMethod === 'manual' && !requiresAction) {
                // Manual confirmation but not in requires_action state
                // Backend will handle confirmation, just wait and refresh
                console.log('Manual confirmation method for duplicate payment, not in requires_action state. Backend will handle confirmation.');
                setIsProcessingPayment(false);
                handleDirectPaymentSuccess();
                toast.info('Payment is being processed by the backend. Please wait...', {
                  autoClose: 3000
                });
                return;
              } else {
                // For automatic confirmation, use confirmCardPayment
                const result = await stripeInstance.confirmCardPayment(clientSecret);
                confirmError = result.error;
                paymentIntent = result.paymentIntent;
              }
              
              if (confirmError) {
                setIsProcessingPayment(false);
                toast.error(
                  confirmError.message || 
                  'Authentication failed. Please try again or use a different card.'
                );
                return;
              }
              
              // Check payment intent status
              if (paymentIntent?.status === 'succeeded') {
                // Payment succeeded, update status
                const paymentId = getPaymentId(paymentResult);
                if (paymentId) {
                  try {
                    await CompletePayment({
                      payment_id: paymentId,
                      payment_method: "stripe",
                    });
                    setIsProcessingPayment(false);
                    handleDirectPaymentSuccess();
                    toast.success("Payment authenticated and processed successfully!");
                  } catch (error: any) {
                    console.error('Failed to update payment status:', error);
                    setIsProcessingPayment(false);
                    handleDirectPaymentSuccess();
                    toast.success("Payment authenticated successfully! Status update may be delayed.");
                  }
                } else {
                  setIsProcessingPayment(false);
                  handleDirectPaymentSuccess();
                  toast.success("Payment authenticated and processed successfully!");
                }
              } else if (paymentIntent?.status === 'requires_confirmation') {
                // 3D Secure completed successfully, but payment needs backend confirmation
                // Challenge is complete, so we should call CompletePayment
                console.log('Payment requires backend confirmation after 3D Secure (duplicate payment - saved card)');
                
                const paymentId = getPaymentId(paymentResult);
                
                if (paymentId) {
                  try {
                    await CompletePayment({
                      payment_id: paymentId,
                      payment_method: "stripe",
                    });
                    setIsProcessingPayment(false);
                    handleDirectPaymentSuccess();
                    toast.success("3D Secure authentication completed! Payment is being processed...");
                  } catch (error: any) {
                    console.error('Failed to update payment status:', error);
                    setIsProcessingPayment(false);
                    handleDirectPaymentSuccess();
                    toast.info('3D Secure authentication completed! Payment is being processed...', {
                      autoClose: 3000
                    });
                  }
                } else {
                  setIsProcessingPayment(false);
                  handleDirectPaymentSuccess();
                  toast.info('3D Secure authentication completed! Payment is being processed...', {
                    autoClose: 3000
                  });
                }
              } else {
                setIsProcessingPayment(false);
                toast.error("Payment authentication incomplete. Please try again.");
              }
            } catch (authError: any) {
              setIsProcessingPayment(false);
              toast.error(
                authError.message ||
                'Authentication process failed. Please try again.'
              );
            }
          } else {
            // No client_secret for duplicate payment, just refresh
            setIsProcessingPayment(false);
            handleDirectPaymentSuccess();
            toast.success("Payment processed successfully!");
          }
          return; // Exit early for duplicate payments
        }
        
        // Check if payment requires 3D Secure authentication
        if (clientSecret) {
          // Load Stripe to confirm payment
          if (!stripePublishableKey) {
            handleDirectPaymentError('Stripe is not initialized');
            setIsProcessingPayment(false);
            return;
          }

          const stripeInstance = await loadStripe(stripePublishableKey);
          if (!stripeInstance) {
            handleDirectPaymentError('Failed to load Stripe');
            setIsProcessingPayment(false);
            return;
          }

          try {
            // Check if confirmation_method is manual AND status is requires_action
            // handleCardAction can only be used when payment is in requires_action state
            const confirmationMethod = gatewayResponse?.confirmation_method;
            const requiresAction = paymentStatus === 'requires_action';
            
            let paymentIntent;
            let confirmError;
            
            if (confirmationMethod === 'manual' && requiresAction) {
              // For manual confirmation with requires_action status, use handleCardAction to show 3D Secure modal
              console.log('Using handleCardAction for 3D Secure authentication (manual confirmation, requires_action)...');
              
              const result = await stripeInstance.handleCardAction(clientSecret);
              confirmError = result.error;
              paymentIntent = result.paymentIntent;
            } else if (confirmationMethod === 'manual' && !requiresAction) {
              // Manual confirmation but not in requires_action state
              // Backend will handle confirmation, just wait and refresh
              console.log('Manual confirmation method, payment not in requires_action state. Backend will handle confirmation.');
              setIsProcessingPayment(false);
              handleDirectPaymentSuccess();
              toast.info('Payment is being processed by the backend. Please wait...', {
                autoClose: 3000
              });
              return;
            } else {
              // For automatic confirmation or when not manual, use confirmCardPayment
              const result = await stripeInstance.confirmCardPayment(
                clientSecret,
                {
                  payment_method: selectedCardId
                }
              );
              confirmError = result.error;
              paymentIntent = result.paymentIntent;
            }
            
            if (confirmError) {
              setIsProcessingPayment(false);
              toast.error(
                confirmError.message || 
                'Authentication failed. Please try again or use a different card.'
              );
              return;
            }
            
            // Check payment intent status
            if (paymentIntent?.status === 'succeeded') {
              // Payment succeeded on Stripe, now update our database
              // Extract payment ID from response (could be nested)
              const paymentId = getPaymentId(paymentResult);
              
              if (paymentId) {
                try {
                  await CompletePayment({
                    payment_id: paymentId,
                    payment_method: "stripe",
                  });
                  setIsProcessingPayment(false);
                  handleDirectPaymentSuccess();
                  toast.success("Payment authenticated and processed successfully!");
                } catch (error: any) {
                  // Even if completePayment fails, payment succeeded on Stripe
                  // Log error but still show success to user
                  console.error('Failed to update payment status:', error);
                  setIsProcessingPayment(false);
                  handleDirectPaymentSuccess();
                  toast.success("Payment authenticated successfully! Status update may be delayed.");
                }
              } else {
                // No payment ID found, just refresh and let webhook handle it
                console.warn('Payment ID not found in response, webhook will update status');
                setIsProcessingPayment(false);
                handleDirectPaymentSuccess();
                toast.success("Payment authenticated successfully! Status will be updated shortly.");
              }
            } else if (paymentIntent?.status === 'requires_confirmation') {
              // 3D Secure completed successfully, but payment needs backend confirmation
              // Challenge is complete, so we should call CompletePayment
              console.log('Payment requires backend confirmation after 3D Secure (saved card)');
              
              const paymentId = getPaymentId(paymentResult);
              
              if (paymentId) {
                try {
                  await CompletePayment({
                    payment_id: paymentId,
                    payment_method: "stripe",
                  });
                  setIsProcessingPayment(false);
                  handleDirectPaymentSuccess();
                  toast.success("3D Secure authentication completed! Payment is being processed...");
                } catch (error: any) {
                  console.error('Failed to update payment status:', error);
                  setIsProcessingPayment(false);
                  handleDirectPaymentSuccess();
                  toast.info('3D Secure authentication completed! Payment is being processed...', {
                    autoClose: 3000
                  });
                }
              } else {
                setIsProcessingPayment(false);
                handleDirectPaymentSuccess();
                toast.info('3D Secure authentication completed! Payment is being processed...', {
                  autoClose: 3000
                });
              }
            } else if (paymentIntent?.status === 'requires_action') {
              // Should not happen after confirmCardPayment/handleCardAction, but handle just in case
              setIsProcessingPayment(false);
              toast.error("Payment requires additional authentication. Please try again.");
            } else {
              setIsProcessingPayment(false);
              handleDirectPaymentSuccess();
              toast.success("Payment processed successfully!");
            }
          } catch (authError: any) {
            setIsProcessingPayment(false);
            toast.error(
              authError.message ||
              'Authentication process failed. Please try again.'
            );
          }
        } else {
          // No 3D Secure required, payment completed
          setIsProcessingPayment(false);
          handleDirectPaymentSuccess();
          toast.success("Payment processed successfully!");
        }
      },
      onError: (error) => {
        handleDirectPaymentError(error.message || 'Payment processing failed');
        setIsProcessingPayment(false);
      }
    });
  }, [selectedCardId, selectedInvoiceForPayment, createInvoicePayment, handleDirectPaymentSuccess, handleDirectPaymentError, stripePublishableKey]);


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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/dashboard" className="text-decoration-none">
                  Accounting
                </a>
              </li>
              <li className="breadcrumb-item active fw-bold" aria-current="page">
                Invoices
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <Form.Select
            size="sm"
            style={{ width: '220px' }}
            value={String(selectedCompanyId)}
            onChange={(e) => setSelectedCompanyId(e.target.value === '' ? '' : e.target.value)}
          >
            <option value="">All companies</option>
            {companyOptions.map((c: { id: string | number; name?: string }) => (
              <option key={c.id} value={c.id}>
                {c.name ?? c.id}
              </option>
            ))}
          </Form.Select>
          <Button
            variant={showFilterTabs ? "secondary" : "outline-secondary"}
            onClick={() => setShowFilterTabs(!showFilterTabs)}
          >
            <Layers size={16} className="me-2" />
            {showFilterTabs ? "Hide Tabs" : "Show Tabs"}
          </Button>
          <Button
            variant="outline-secondary"
            onClick={handleOpenFiltersSidebar}
          >
            <Filter size={16} className="me-2" />
            Filters
          </Button>
        </div>
      </div>

        {/* Filter Tabs & Search (styled like customer-billing-history via filter-bar-* classes) */}
        {showFilterTabs && (
        <Card className="filter-bar-card">
          <Card.Body className="filter-bar-body">
            <div className="filter-bar-tabs">
              <Button
                variant={activeStatusTab === null ? "primary" : "outline-secondary"}
                className="filter-bar-tab"
                onClick={() => {
                  setActiveStatusTab(null);
                  setCurrentFilters((prev) => {
                    const { status, ...rest } = prev;
                    return rest;
                  });
                  setRefreshKey((prev) => prev + 1);
                }}
              >
                <Receipt size={16} />
                All
              </Button>
              <Button
                variant={activeStatusTab === "paid" ? "primary" : "outline-secondary"}
                className="filter-bar-tab"
                onClick={() => {
                  setActiveStatusTab("paid");
                  setCurrentFilters((prev) => ({ ...prev, status: "paid" }));
                  setRefreshKey((prev) => prev + 1);
                }}
              >
                <CheckCircle size={16} />
                Paid
              </Button>
              <Button
                variant={activeStatusTab === "pending" ? "primary" : "outline-secondary"}
                className="filter-bar-tab"
                onClick={() => {
                  setActiveStatusTab("pending");
                  setCurrentFilters((prev) => ({ ...prev, status: "pending" }));
                  setRefreshKey((prev) => prev + 1);
                }}
              >
                <Clock size={16} />
                Pending
              </Button>
              <Button
                variant={activeStatusTab === "overdue" ? "primary" : "outline-secondary"}
                className="filter-bar-tab"
                onClick={() => {
                  setActiveStatusTab("overdue");
                  setCurrentFilters((prev) => ({ ...prev, status: "overdue" }));
                  setRefreshKey((prev) => prev + 1);
                }}
              >
                <AlertCircle size={16} />
                Overdue
              </Button>
              <Button
                variant={activeStatusTab === "cancelled" ? "primary" : "outline-secondary"}
                className="filter-bar-tab"
                onClick={() => {
                  setActiveStatusTab("cancelled");
                  setCurrentFilters((prev) => ({ ...prev, status: "cancelled" }));
                  setRefreshKey((prev) => prev + 1);
                }}
              >
                <Ban size={16} />
                Cancelled
              </Button>
            </div>
            {/* <div className="filter-bar-actions">
              <Form.Control
                type="search"
                placeholder="Search invoices..."
                onChange={(e) =>
                  setCurrentFilters({ ...currentFilters, search: e.target.value })
                }
              />
            </div> */}
          </Card.Body>
        </Card>
        )}

      <GenericTable<InvoiceData>
        data={invoiceList}
        columns={tableColumns}
        actions={invoiceTableActions}
        showActions={true}
        actionsLabel="Actions"
        customizableColumns={true}
        defaultSelectedColumns={["invoice_number", "status", "total_amount", "amount_due", "invoice_date", "due_date"]}
        columnStorageKey="customerInvoicesSelectedColumns"
        pagination={{
          currentPage: pagination.currentPage,
          rowsPerPage: pagination.rowsPerPage,
          totalRows: totalRecords,
          pageSizeOptions: [10, 15, 25, 50],
        }}
        onPaginationChange={(page, rowsPerPage) => {
          setPagination((prev) => ({ ...prev, currentPage: page, rowsPerPage }));
        }}
        sortable={true}
        loading={invoiceLoading}
        emptyMessage="No invoices found"
        loadingMessage="Loading invoices..."
        hover={true}
        uniqueKey="id"
        onRowClick={(row) => openInvoiceSidebar(row)}
      />

      <GenericSidebar
        isOpen={showInvoiceSidebar}
        onClose={closeInvoiceSidebar}
        moduleSlug={ModuleSlug.BILLING}
        title={selectedInvoiceSidebar ? `Invoice #${selectedInvoiceSidebar.invoice_number}` : "Invoice Details"}
        subtitle={selectedInvoiceSidebar?.company?.name ?? ""}
        metadata={selectedInvoiceSidebar?.due_date ? `Due: ${moment(selectedInvoiceSidebar.due_date).format("DD-MMM-YYYY")}` : undefined}
        width="400px"
        sections={[
          {
            id: "invoice-info",
            title: "Invoice Information",
            icon: FileText,
            fields: [
              { label: "Invoice Number", value: selectedInvoiceSidebar ? `#${selectedInvoiceSidebar.invoice_number}` : "N/A" },
              {
                label: "Status",
                value: selectedInvoiceSidebar ? getStatusLabel(selectedInvoiceSidebar.status || STATUS_DRAFT) : "N/A",
                type: "badge",
                badgeVariant: selectedInvoiceSidebar ? getStatusBadgeVariant(selectedInvoiceSidebar.status || STATUS_DRAFT) : "secondary",
              },
              {
                label: "Total Amount",
                value: selectedInvoiceSidebar
                  ? `${selectedInvoiceSidebar.currency_code || "AED"} ${formatNumber(parseFloat(selectedInvoiceSidebar?.total_amount || "0"))}`
                  : "N/A",
              },
              {
                label: "Amount Due",
                value: selectedInvoiceSidebar
                  ? `${selectedInvoiceSidebar.currency_code || "AED"} ${formatNumber(parseFloat(selectedInvoiceSidebar?.amount_due || "0"))}`
                  : "N/A",
              },
              {
                label: "Invoice Date",
                value: selectedInvoiceSidebar?.invoice_date ?? null,
                type: "date",
                icon: Calendar,
              },
              {
                label: "Due Date",
                value: selectedInvoiceSidebar?.due_date ?? null,
                type: "date",
                icon: Calendar,
              },
            ],
          },
          {
            id: "company-info",
            title: "Bill To",
            icon: FileText,
            fields: [
              { label: "Company", value: selectedInvoiceSidebar?.company?.name ?? "N/A" },
              { label: "Country", value: selectedInvoiceSidebar?.company?.country ?? "N/A" },
            ].filter((f) => f.value !== "N/A" || f.label === "Company"),
          },
        ]}
        actions={[
          {
            label: "View Full Invoice",
            icon: FileText,
            variant: "primary",
            onClick: () => {
              if (selectedInvoiceSidebar) {
                setSelectedInvoiceForView(selectedInvoiceSidebar);
                setShowViewInvoiceModal(true);
                closeInvoiceSidebar();
              }
            },
          },
          {
            label: "Pay Now",
            icon: DollarSign,
            variant: "success",
            show: !!(selectedInvoiceSidebar && (selectedInvoiceSidebar.status === STATUS_PENDING || selectedInvoiceSidebar.status === STATUS_OVERDUE || selectedInvoiceSidebar.status === STATUS_PARTIALLY_PAID) && session?.user?.permissions?.includes("pay-invoices-billing")),
            onClick: () => {
              if (selectedInvoiceSidebar) {
                handlePayInvoice(selectedInvoiceSidebar);
                closeInvoiceSidebar();
              }
            },
          },
          {
            label: "Download PDF",
            icon: Download,
            variant: "outline-primary",
            onClick: () => {
              if (selectedInvoiceSidebar) {
                handleDownloadPDF(selectedInvoiceSidebar);
              }
            },
          },
        ]}
      />

      <GenericFilterSidebar
        isOpen={showFiltersSidebar}
        onClose={handleCloseFiltersSidebar}
        title="Filters"
        subtitle="Filter invoices by status, date range, and search"
        width="400px"
        filters={invoiceFilterFields}
        onApply={() => {
          setCurrentFilters({ ...pendingFilters });
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((prev) => prev + 1);
          setActiveStatusTab(pendingFilters.status ?? null);
          setShowFiltersSidebar(false);
        }}
        onReset={() => {
          setPendingFilters({});
          setCurrentFilters({});
          setActiveStatusTab(null);
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((prev) => prev + 1);
          setShowFiltersSidebar(false);
        }}
      />

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
                    <p><strong>Company:</strong>{getCompanyByCrmId(selectedInvoiceForPayment?.company?.crm_company_id, companyOptions) ?? ''}</p>
                    <p><strong>Invoice Date:</strong> {moment(selectedInvoiceForPayment.invoice_date).format('DD-MMM-YYYY')}</p>
                    <p><strong>Due Date:</strong> {selectedInvoiceForPayment.due_date ? moment(selectedInvoiceForPayment.due_date).format('DD-MMM-YYYY') : 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Subtotal:</strong> {selectedInvoiceForPayment.currency_code || 'USD'} {formatNumber(parseFloat(selectedInvoiceForPayment.subtotal || '0'))}</p>
                    <p><strong>TAX Amount:</strong> {selectedInvoiceForPayment.currency_code || 'USD'} {formatNumber(parseFloat(selectedInvoiceForPayment.tax_amount || '0'))}</p>
                    <p><strong className="text-primary">Total Amount:</strong> {selectedInvoiceForPayment.currency_code || 'USD'} {formatNumber(parseFloat(selectedInvoiceForPayment.total_amount || '0'))}</p>
                    
                    {/* Currency Conversion Display */}
                    {/* {exchangeRates.length > 0 && baseCurrency !== (selectedInvoiceForPayment.currency_code || 'USD') && (
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
                    )} */}
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

      {/* View Invoice Modal */}
      {showViewInvoiceModal && (
        <Modal
          show={showViewInvoiceModal}
          onHide={closeViewInvoiceModal}
          size="xl"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Invoice Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedInvoiceForView ? (
              <>

              <Row>
                <Col md={6}>
                  <h3 className="mb-2">{session?.user?.company_name || ''}</h3>
                    
                    {selectedInvoiceForView?.company?.reseller?.profile?.tax_id && selectedInvoiceForView?.company?.reseller?.profile?.tax_id > 0 && (
                    <h5 className="mb-3 fw-bold" style={{ color: '#14509e' }}>TAX INVOICE {selectedInvoiceForView?.company?.reseller?.profile?.tax_id || ''}</h5>
                    )}
                    
                  <p className="mb-2">{selectedInvoiceForView?.company?.reseller?.profile?.address || ''}</p>
                    {selectedInvoiceForView?.company?.reseller?.profile?.city && selectedInvoiceForView?.company?.reseller?.profile?.city > 0 && (
                    <p className="mb-2">{selectedInvoiceForView?.company?.reseller?.profile?.city || ''}, {selectedInvoiceForView?.company?.reseller?.profile?.country || ''}</p>
                    )}
                    
                  <p className="mb-2"><b>Phone:</b>{selectedInvoiceForView?.company?.reseller?.phone || ''}</p>
                  <p className="mb-3"><b>Email:</b> {selectedInvoiceForView?.company?.reseller?.email || ''}</p>
                </Col>
                <Col md={6}>
                  <div>
                  <img src={selectedInvoiceForView?.company?.reseller?.profile?.logo_url || PrimeAlleyLogo.src} alt="Logo" className="img-fluid" style={{maxWidth: '60%',float:"right"}} />
                    </div>
                  {Number(selectedInvoiceForView.amount_due) > 0 && (
                        <>
                        <div className="text-end mt-3" style={{float:"right",clear:"both",fontSize:"1.2rem",}}>Due Amount: 
                          <span className="fw-bold text-danger">{selectedInvoiceForView.currency_code || 'AED'} {formatNumber(parseFloat(String(selectedInvoiceForView.amount_due ?? 0)))}</span>
                        </div>
                        </>
                    )}
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                <h5 className="mb-2 fw-bold" style={{ color: '#14509e' }}>Bill To</h5>
                  <div className="border p-3 rounded bg-light mb-3">
                    <p className="mb-2 fw-bold">{getCompanyByCrmId(selectedInvoiceForView?.company?.crm_company_id, companyOptions) ?? ''}</p>
                    <p className="mb-2">{selectedInvoiceForView?.company?.profile?.address || ''}</p>
                    <p className="mb-3">{selectedInvoiceForView?.company?.country || ''}</p>

                    {selectedInvoiceForView?.company?.profile?.tax_id && selectedInvoiceForView?.company?.profile?.tax_id > 0 && (
                    <p className="mb-0 fw-bold"><b>TRN No.:</b> {selectedInvoiceForView?.company?.profile?.tax_id || ''}</p>
                    )}

                  </div>
                </Col>
                <Col md={6}>
                <table className="table table-borderless">
                      <tbody>
                      
                        <tr>
                          <td className="fw-bold p-2" style={{ verticalAlign: 'top', width: '40%' }}>Invoice Number:</td>
                          <td className="p-2">{selectedInvoiceForView.invoice_number || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold p-2" style={{ verticalAlign: 'top', width: '40%' }}>Invoice Date:</td>
                          <td className="p-2">{selectedInvoiceForView.invoice_date
                              ? moment(selectedInvoiceForView.invoice_date).format(GlobalDateFormat)
                              : 'N/A'}</td>
                        </tr>
                        
                        <tr>
                          <td className="fw-bold p-2" style={{ verticalAlign: 'top' }}>Invoice Period:</td>
                          <td className="p-2">
                            {selectedInvoiceForView.invoice_date
                              ? moment(selectedInvoiceForView.invoice_date).format('DD MMM YYYY')
                              : 'N/A'} - {(selectedInvoiceForView?.end_date ?? selectedInvoiceForView?.due_date) ? moment(selectedInvoiceForView?.end_date ?? selectedInvoiceForView?.due_date).format('DD MMM YYYY') : 'N/A'}
                          </td>
                        </tr>

                        {/* <tr>
                          <td className="fw-bold p-2" style={{ verticalAlign: 'top' }}>End Date:</td>
                          <td className="p-2">{(selectedInvoiceForView?.end_date ?? selectedInvoiceForView?.due_date) ? moment(selectedInvoiceForView?.end_date ?? selectedInvoiceForView?.due_date).format(GlobalDateFormat) : ''}</td>
                        </tr> */}
                        
                        <tr>
                          <td className="fw-bold p-2" style={{ verticalAlign: 'top', width: '40%' }}>Terms:</td>
                          <td className="p-2">{selectedInvoiceForView?.company?.reseller?.profile?.payment_terms+ ' days'}</td>
                        </tr>
                        
                        

                        <tr>
                          <td className="fw-bold p-2" style={{ verticalAlign: 'top', width: '40%' }}>Due Date:</td>
                          <td className="p-2">{selectedInvoiceForView?.due_date ? moment(selectedInvoiceForView?.due_date).format(GlobalDateFormat) : ''}</td>
                        </tr>

                      </tbody>
                    </table>
                </Col>
              </Row>
              
              
              <div>
                {/* Invoice Header */}
                {/* <div className="row mb-4">
                  <div className="col-md-6">
                    <h5 className="mb-3 alert alert-info">Invoice Information</h5>
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td className="fw-bold" style={{ verticalAlign: 'top', width: '40%' }}>Invoice Number:</td>
                          <td>{selectedInvoiceForView.invoice_number || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold" style={{ verticalAlign: 'top' }}>Invoice Date:</td>
                          <td>
                            {selectedInvoiceForView.invoice_date
                              ? moment(selectedInvoiceForView.invoice_date).format('DD MMM YYYY')
                              : 'N/A'}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold" style={{ verticalAlign: 'top' }}>Due Date:</td>
                          <td>
                            {selectedInvoiceForView.due_date
                              ? moment(selectedInvoiceForView.due_date).format('DD MMM YYYY')
                              : 'N/A'}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold" style={{ verticalAlign: 'top' }}>Status:</td>
                          <td>
                            <Badge
                              bg={
                                selectedInvoiceForView.status === STATUS_PAID
                                  ? 'success'
                                  : selectedInvoiceForView.status === STATUS_OVERDUE
                                  ? 'danger'
                                  : selectedInvoiceForView.status === STATUS_PARTIALLY_PAID
                                  ? 'warning'
                                  : selectedInvoiceForView.status === STATUS_PENDING
                                  ? 'info'
                                  : 'secondary'
                              }
                            >
                              {selectedInvoiceForView.status?.toUpperCase() || 'N/A'}
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold" style={{ verticalAlign: 'top' }}>Payment Mode:</td>
                          <td style={{ textTransform: 'uppercase' }}>{selectedInvoiceForView.payment_mode || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h5 className="mb-3 alert alert-info">Company Information</h5>
                    {selectedInvoiceForView.company ? (
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td style={{ verticalAlign: 'top', width: '40%' }} className="fw-bold" >Company Name:</td>
                            <td>{selectedInvoiceForView.company.name || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={{ verticalAlign: 'top' }} className="fw-bold">Country:</td>  
                            <td>{selectedInvoiceForView.company.country || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={{ verticalAlign: 'top' }} className="fw-bold">Phone:</td>
                            <td>{selectedInvoiceForView.company.phone || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={{ verticalAlign: 'top' }} className="fw-bold">Email:</td>
                            <td className="text-lowercase">{selectedInvoiceForView.company.email || 'N/A'}</td>
                          </tr>
                          {selectedInvoiceForView.company.profile?.address && (
                            <tr>
                              <td style={{ verticalAlign: 'top' }} className="fw-bold">Address:</td>
                              <td className="text-capitalize">{selectedInvoiceForView.company.profile.address}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-muted">No company information available</p>
                    )}
                  </div>
                </div> */}

                {/* Invoice Items */}
                <div className="mb-4">
                  {/* <h5 className="mb-3">Invoice Items</h5> */}
                  {selectedInvoiceForView.items && selectedInvoiceForView.items.length > 0 ? (
                    <div className="">
                      <table className="table table-bordered table-sm">
                        <thead className="table-dark" style={{backgroundColor: '#0f3b66', color: 'white'}}>
                          <tr>
                            <th className="text-uppercase">Product Name</th>
                            <th className="text-uppercase text-start">Product Description</th>
                            <th className="text-uppercase text-end">QTY</th>
                            <th className="text-uppercase text-end">Unit Price ({selectedInvoiceForView.currency_code || 'AED'})</th>
                            <th className="text-uppercase text-end">Tax ({selectedInvoiceForView.currency_code || 'AED'})</th>
                            <th className="text-uppercase text-end">Amount ({selectedInvoiceForView.currency_code || 'AED'})</th>
                            <th className="text-uppercase text-end">Total Price ({selectedInvoiceForView.currency_code || 'AED'})</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvoiceForView.items.map((item: any, index: number) => (
                            
                            <tr key={item.id || index}>
                              <td className="text-capitalize">{item.product?.name}</td>
                              <td className="text-start" style={{whiteSpace: 'wrap'}}>
                              <p className="mb-0">{item.description}</p>
                                {/* <div>
                                  <strong>{item.product?.name || item.description || 'N/A'}</strong>
                                  {(() => {
                                    // Use item.description if available, otherwise use item.product.description
                                    const description = item.description || item.product?.description || '';
                                    const productName = item.product?.name || '';
                                    // Only show description if it exists and is different from the product name
                                    if (description && description !== productName) {
                                      return (
                                        <div className="text-muted small">
                                          {description.length > 50 ? (
                                            <>
                                              {description.substring(0, 50)}...
                                              <button
                                                className="btn btn-link p-0 ms-1 text-decoration-none"
                                                style={{ fontSize: '0.875rem' }}
                                                onClick={() => {
                                                  setSelectedDescription(description);
                                                  setShowDescriptionModal(true);
                                                }}
                                              >
                                                Show more
                                              </button>
                                            </>
                                          ) : (
                                            description
                                          )}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div> */}
                              </td>
                              <td className="text-end">{item.quantity}</td>
                              <td className="text-end">
                                 {formatNumber(parseFloat(item.unit_price || '0'))}
                              </td>
                              
                              {/* <td className="text-end">{formatNumber(parseFloat(item.tax_rate || '0'))}%</td> */}
                              <td className="text-end">
                                 {formatNumber(parseFloat(item.tax_amount || '0'))}
                              </td>


                              <td className="text-end">
                                 {formatNumber(parseFloat(item.line_total || '0'))}
                              </td>
                              
                              <td className="text-end">
                                <strong>
                                  {formatNumber(parseFloat(item.tax_amount || '0') + parseFloat(item.line_total || '0'))}
                                </strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <Row>
                        <Col md={6}>
                          {/* <Card>
                            <Card.Body>
                              <Card.Title>Notes & Terms</Card.Title>
                              <p>{selectedInvoiceForView.notes}</p>
                              <p>{selectedInvoiceForView.terms_conditions}</p>
                              <p>{!selectedInvoiceForView.notes && !selectedInvoiceForView.terms_conditions && 'No notes or terms provided'}</p>
                            </Card.Body>
                          </Card> */}
                          <h5 className="mb-2 fw-bold" style={{ color: '#14509e' }}>Terms & Conditions</h5>
                          <ol style={{paddingLeft: '15px'}}>
                            <li><p className="mb-1 text-muted">Payment can be made as bank transfer or direct deposit</p></li>
                            <li><p className="mb-1 text-muted">Cheque can be issued in favor of {selectedInvoiceForView?.company?.reseller?.name || 'N/A'}.</p></li>
                            <li><p className="mb-1 text-muted">Services may be disconnected after the due date without further notice.</p></li>
                            <li><p className="mb-1 text-muted">Value Added Tax (VAT) 5% will be applicable to this invoice.</p></li>
                          </ol>
                        </Col>
                        <Col md={6}>
                        <table className="table table-borderless table-sm">
                                <tr> <td className="p-0 fw-bold">Subtotal</td> <td className="text-end fw-bold">{selectedInvoiceForView.currency_code || 'AED'} {formatNumber(parseFloat(selectedInvoiceForView.subtotal || '0'))}</td> </tr>
                                <tr> <td className="p-0 fw-bold">Vat Total</td> <td className="text-end fw-bold">{selectedInvoiceForView.currency_code || 'AED'} {formatNumber(parseFloat(selectedInvoiceForView.tax_amount || '0'))}</td> </tr>
                                <tr> <td className="p-0 fw-bold">Total</td> <td className="text-end fw-bold">{selectedInvoiceForView.currency_code || 'AED'} {formatNumber(parseFloat(selectedInvoiceForView.total_amount || '0'))}</td> </tr>
                                

                                {Number(selectedInvoiceForView.paid_amount) >= 0 && (
                                <tr style={{borderTop: '2px #000 solid'}}>
                                  <td className="p-0 fw-bold text-uppercase">Paid Amount</td>
                                  <td className="text-end fw-bold text-success">{selectedInvoiceForView.currency_code || 'AED'} {formatNumber(parseFloat(String(selectedInvoiceForView.paid_amount ?? 0)))}</td>
                                </tr>
                                )}
                                {Number(selectedInvoiceForView.amount_due) >= 0 && (
                                <tr >
                                  <td className="p-0 fw-bold text-uppercase">Due Amount</td>
                                  <td className="text-end fw-bold text-danger">{selectedInvoiceForView.currency_code || 'AED'} {formatNumber(parseFloat(String(selectedInvoiceForView.amount_due ?? 0)))}</td>
                                </tr>
                                )}


                           </table>
                        </Col>
                      </Row>
                    </div>
                  ) : (
                    <Alert variant="info">No items found for this invoice</Alert>
                  )}
                </div>

                 {/* Notes */}
                 <div className="mb-3 alert alert-info">
                    <h6>Bank Accounts</h6>
                    
                   
                 {selectedInvoiceForView?.company?.reseller?.bank_accounts && selectedInvoiceForView?.company?.reseller?.bank_accounts.length > 0 && (
                   
                      <>
                      <Row>
                        {selectedInvoiceForView?.company?.reseller?.bank_accounts?.map((bankAccount: any) => (
                        
                          <Col md={4}>
                            <p className="mb-1"><b>Bank Name:</b> {bankAccount.bank_name}</p>
                            <p className="mb-1"><b>Account Holder Name:</b> {bankAccount.account_holder_name}</p>
                            <p className="mb-1"><b>Account Number:</b> {bankAccount.account_number}</p>
                            <p className="mb-1"><b>Currency:</b> {bankAccount.currency}</p>
                            <p className="mb-1"><b>Routing Number:</b> {bankAccount.routing_number}</p>
                            <p className="mb-1"><b>Swift Code:</b> {bankAccount.swift_code}</p>
                            <p className="mb-1"><b>IBAN:</b> {bankAccount.iban}</p>
                          </Col>
                          
                        ))}
                         </Row>
                       
                   </>
                )}
               
                 
                  </div>
              </div>

              </>

            ) : (
              <Alert variant="warning">No invoice data available</Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeViewInvoiceModal}>
              Close
            </Button>
            
          </Modal.Footer>
        </Modal>
      )}

      {/* Description Modal */}
      <Modal
        show={showDescriptionModal}
        onHide={() => setShowDescriptionModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Description</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {selectedDescription}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDescriptionModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

InvoiceList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default InvoiceList;

