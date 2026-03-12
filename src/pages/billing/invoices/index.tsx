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
const PAY_NOW_ELIGIBLE_STATUSES = new Set([STATUS_PENDING, STATUS_OVERDUE, STATUS_PARTIALLY_PAID]);
const STRIPE_AUTH_SUCCESS_INTENT_STATUSES = new Set(["succeeded", "requires_confirmation"]);

function getStatusBadgeVariant(status: string): string {
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
}

function getStatusLabel(status: string): string {
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
}

import Layout from "@layout/index";
import GenericTable, { TableColumn, TableAction as GenericTableAction, FilterPill } from "@components/GenericTable";
import GenericSidebar from "@components/GenericSidebar";
import GenericFilterSidebar, { FilterField } from "@components/GenericFilterSidebar";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { StatsCardData } from "@components/GenericStatsCards";
import { useCrmToolbarConfig } from "@hooks/useCrmToolbarConfig";
import { useRouter } from "next/router";
import {
  getInvoices,
  getInvoice,
  getProductsWithCompanyPricing,
  createDirectPayment,
  downloadInvoicePdf,
  InvoiceData,
  InvoiceCreateUpdatePayload,
  InvoiceItemCreateUpdatePayload,
  InvoiceItemAPIPayload,
  CompanyData,
  ProductData,
  CreateDirectPaymentData,
  PaymentIntentResponse,
  getCompanies
} from "@utils/accounts";
import { GetPaymentMethods,CompletePayment } from "@utils/accounting";
import { getMinifiedCompanies } from "@utils/crm";
import { formatNumber, getCompanyByCrmId } from "@utils/Helper";

import { Alert, Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
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
import InvoiceViewModal, { InvoiceViewData } from "@components/billings/InvoiceViewModal";
import { DollarSign, Download, FileText, Calendar, Eye, Receipt, CheckCircle, Clock, AlertCircle, Plus } from "lucide-react";

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

const EXCHANGE_CURRENCIES = ["USD", "EUR", "GBP", "AED", "PKR"] as const;

function buildExchangeRates(
  base: string,
  ratesByCurrency: Record<string, number>,
  timestamp: number
): ExchangeRate[] {
  const pairs = EXCHANGE_CURRENCIES.flatMap((currency) => {
    if (currency === base) return [];
    const rate = ratesByCurrency[currency];
    if (!rate) return [];
    return [
      { from: base, to: currency, rate, timestamp },
      { from: currency, to: base, rate: 1 / rate, timestamp },
    ];
  });

  return [...pairs, { from: base, to: base, rate: 1, timestamp }];
}

function dedupeExchangeRates(rates: ExchangeRate[]): ExchangeRate[] {
  const seen = new Set<string>();
  return rates.filter((r) => {
    const key = `${r.from}|${r.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchExchangeRateApiRates(base: string): Promise<Record<string, number>> {
  const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
  if (!response.ok) throw new Error(`Exchange rate API error: ${response.status}`);
  const data = (await response.json()) as { rates?: Record<string, number> };
  if (!data.rates) throw new Error("Exchange rate API missing rates");
  return data.rates;
}

async function fetchFxRatesApiRates(base: string): Promise<Record<string, number>> {
  const response = await fetch(`https://api.fxratesapi.com/latest?base=${base}`);
  const data = (await response.json()) as { rates?: Record<string, number> };
  if (!data.rates) throw new Error("FX rates API missing rates");
  return data.rates;
}

function extractGatewayResponse(paymentResult: any): any {
  return paymentResult?.payment?.gateway_response ?? paymentResult?.data?.payment?.gateway_response;
}

function extractClientSecret(paymentResult: any, gatewayResponse: any): string | undefined {
  return (
    paymentResult?.client_secret ??
    paymentResult?.data?.client_secret ??
    gatewayResponse?.client_secret ??
    paymentResult?.payment_data?.client_secret
  );
}

function extractPaymentId(paymentResult: any): string | number | undefined {
  return (
    paymentResult?.payment?.id ??
    paymentResult?.payment_id ??
    paymentResult?.data?.payment?.id ??
    paymentResult?.data?.payment_id
  );
}

async function safeCompleteStripePayment(paymentId: string | number): Promise<void> {
  try {
    await CompletePayment({ payment_id: paymentId, payment_method: "stripe" });
  } catch (error) {
    console.error("Failed to update payment status:", error);
  }
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
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<{
    search?: string;
    status?: string;
    invoice_date_from?: string;
    invoice_date_to?: string;
    date_from?: string;
    date_to?: string;
  }>({});
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
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

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
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<InvoiceViewData | null>(null);
  
  // Exchange rate states
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [isLoadingExchangeRates, setIsLoadingExchangeRates] = useState<boolean>(false);
  const [baseCurrency, setBaseCurrency] = useState<string>("USD");
  // Custom VAT states
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  const toInvoiceViewData = useCallback((invoice: InvoiceData): InvoiceViewData => {
    const view = invoice as unknown as InvoiceViewData;
    const company = view.company;
    return {
      ...view,
      company: company
        ? { ...company, crm_company_id: company.crm_company_id ?? undefined }
        : undefined,
    };
  }, []);

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
    setSelectedInvoiceForView(toInvoiceViewData(invoiceDetails));
    setShowViewInvoiceModal(true);
  }, [toInvoiceViewData]);

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
            {row.currency_code || "AED"} {formatNumber(Number.parseFloat(row?.total_amount || "0"))}
          </span>
        ),
      },
      {
        key: "amount_due",
        label: "Amount Due",
        sortable: true,
        render: (row) => (
          <span>
            {row.currency_code || "AED"} {formatNumber(Number.parseFloat(row?.amount_due || "0"))}
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
      const basePrice = Number.parseFloat(companyProduct.base_price || "0");
      const effectivePrice = Number.parseFloat(companyProduct.effective_price || "0");
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
    if (exchangeRates.length > 0 && baseCurrency === invoiceCurrency && !isInitialLoad) return;

    console.log("Fetching exchange rates from free API...");
    setIsLoadingExchangeRates(true);

    const timestamp = Date.now();

    try {
      const baseRatesByCurrency = await fetchExchangeRateApiRates(invoiceCurrency);
      const baseRates = buildExchangeRates(invoiceCurrency, baseRatesByCurrency, timestamp);

      let allRates = baseRates;
      if (invoiceCurrency !== "USD") {
        try {
          const usdRatesByCurrency = await fetchExchangeRateApiRates("USD");
          const usdRates = buildExchangeRates("USD", usdRatesByCurrency, timestamp);
          allRates = dedupeExchangeRates([...baseRates, ...usdRates]);
        } catch (usdError) {
          console.warn("Failed to load USD-based rates for better coverage:", usdError);
        }
      }

      setExchangeRates(allRates);
      setBaseCurrency(invoiceCurrency);
      setIsInitialLoad(false);
    } catch (error) {
      console.error("Error loading exchange rates:", error);

      try {
        console.log("Falling back to alternative exchange rate API");
        const fallbackRatesByCurrency = await fetchFxRatesApiRates(invoiceCurrency);
        const fallbackRates = buildExchangeRates(invoiceCurrency, fallbackRatesByCurrency, timestamp);
        setExchangeRates(fallbackRates);
        setBaseCurrency(invoiceCurrency);
        setIsInitialLoad(false);
      } catch (fallbackError) {
        console.error("Fallback exchange rate API also failed:", fallbackError);

        const defaultRates: ExchangeRate[] = [
          { from: "USD", to: "EUR", rate: 0.85, timestamp },
          { from: "EUR", to: "USD", rate: 1.18, timestamp },
          { from: "USD", to: "GBP", rate: 0.73, timestamp },
          { from: "GBP", to: "USD", rate: 1.37, timestamp },
          { from: "USD", to: "AED", rate: 3.67, timestamp },
          { from: "AED", to: "USD", rate: 0.27, timestamp },
          { from: "USD", to: "PKR", rate: 280, timestamp },
          { from: "PKR", to: "USD", rate: 0.0036, timestamp },
        ];
        setExchangeRates(defaultRates);
        setBaseCurrency(invoiceCurrency);
        setIsInitialLoad(false);
      }
    } finally {
      setIsLoadingExchangeRates(false);
    }
  }, [exchangeRates.length, isInitialLoad, baseCurrency]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesData = await getCompanies({
          load_profile: true,
        });
        setCompanies(companiesData.data || []);
        
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

  type PaymentMethod = {
    id: string;
    type?: string;
    is_default?: boolean;
    card?: { brand?: string; last4?: string; exp_month?: number; exp_year?: number };
    billing_details?: { name?: string };
  };
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
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

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);
  type InvoiceSummary = {
    paid_count?: number;
    pending_count?: number;
    overdue_count?: number;
  };
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);

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
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [totalAllInvoices, setTotalAllInvoices] = useState(0);
  const canPayInvoices = !!session?.user?.permissions?.includes("pay-invoices-billing");
  const canPaySelectedInvoice =
    !!selectedInvoiceSidebar &&
    canPayInvoices &&
    PAY_NOW_ELIGIBLE_STATUSES.has(selectedInvoiceSidebar.status ?? "");

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
      // Keep total all invoices when no status filter is applied
      if (!memoizedFilters.status) {
        setTotalAllInvoices(total);
      }
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
        const companyVatRate = selectedCompany?.profile?.vat_rate ? Number.parseFloat(selectedCompany.profile.vat_rate) : 0;
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
        const companyVatRate = selectedCompany?.profile?.vat_rate ? Number.parseFloat(selectedCompany.profile.vat_rate) : 0;
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

  // Helper function to calculate totals using per-product VAT rates
  const calculateTotals = (items: InvoiceItemCreateUpdatePayload[], companyVatRate: number = 0, isVatExempt: boolean = false, toCurrency: string = 'USD', companyId?: string) => {
    let subtotal = 0;
    let totalTaxAmount = 0;
    
    // Process each item individually to calculate VAT per product
    const processedItems = items.map(item => {
      const quantity = Number.parseFloat(item.quantity) || 0;
      const unitPrice = Number.parseFloat(item.unit_price) || 0;
      
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
      if (item.tax_rate && Number.parseFloat(item.tax_rate) >= 0) {
        effectiveVatRate = Number.parseFloat(item.tax_rate);
      } else if (item.product_id) {
        // Fallback to product-specific VAT rate if item tax_rate is not set
        const product = companyProducts.find(p => p.id.toString() === item.product_id);
        if (product?.vat_rate) {
          effectiveVatRate = Number.parseFloat(product.vat_rate);
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
      subtotal: Number.parseFloat(subtotal.toFixed(2)),
      tax_amount: Number.parseFloat(totalTaxAmount.toFixed(2)),
      total_amount: Number.parseFloat(totalAmount.toFixed(2)),
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

  const handleSavedCardPaymentSuccess = useCallback(async (paymentResult: any) => {
    if (paymentResult?.already_completed) {
      setIsProcessingPayment(false);
      handleDirectPaymentSuccess();
      toast.success("Payment was already completed successfully!");
      return;
    }

    const gatewayResponse = extractGatewayResponse(paymentResult);
    const clientSecret = extractClientSecret(paymentResult, gatewayResponse);
    const paymentStatus = gatewayResponse?.status ?? paymentResult?.status;

    if (!clientSecret) {
      setIsProcessingPayment(false);
      handleDirectPaymentSuccess();
      toast.success("Payment processed successfully!");
      return;
    }

    if (!stripePublishableKey) {
      handleDirectPaymentError("Stripe is not initialized");
      setIsProcessingPayment(false);
      return;
    }

    const stripeInstance = await loadStripe(stripePublishableKey);
    if (!stripeInstance) {
      handleDirectPaymentError("Failed to load Stripe");
      setIsProcessingPayment(false);
      return;
    }

    const confirmationMethod = gatewayResponse?.confirmation_method;
    const requiresAction = paymentStatus === "requires_action";
    if (confirmationMethod === "manual" && !requiresAction) {
      setIsProcessingPayment(false);
      handleDirectPaymentSuccess();
      toast.info("Payment is being processed by the backend. Please wait...", { autoClose: 3000 });
      return;
    }

    let authResult: any;
    if (confirmationMethod === "manual" && requiresAction) {
      authResult = await stripeInstance.handleCardAction(clientSecret);
    } else {
      let confirmOptions: { payment_method: string } | undefined;
      if (selectedCardId) confirmOptions = { payment_method: selectedCardId };
      authResult = await stripeInstance.confirmCardPayment(clientSecret, confirmOptions);
    }

    if (authResult?.error) {
      setIsProcessingPayment(false);
      toast.error(authResult.error.message || "Authentication failed. Please try again or use a different card.");
      return;
    }

    const paymentIntent = authResult?.paymentIntent;
    const paymentId = extractPaymentId(paymentResult);

    const intentStatus = paymentIntent?.status;
    if (STRIPE_AUTH_SUCCESS_INTENT_STATUSES.has(intentStatus ?? "")) {
      if (paymentId) {
        await safeCompleteStripePayment(paymentId);
      }

      setIsProcessingPayment(false);
      handleDirectPaymentSuccess();
      toast.success("Payment authenticated and processed successfully!");
      return;
    }

    setIsProcessingPayment(false);
    toast.error("Payment authentication incomplete. Please try again.");
  }, [handleDirectPaymentError, handleDirectPaymentSuccess, selectedCardId, stripePublishableKey]);

  // Payment with saved card handler
  const handlePaymentWithSavedCard = useCallback(async () => {
    if (!selectedCardId || !selectedInvoiceForPayment) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessingPayment(true);
    createInvoicePayment({
      amount: Number.parseFloat(selectedInvoiceForPayment.total_amount || "0"),
      currency: (selectedInvoiceForPayment.currency_code || 'USD').toLowerCase(),
      payment_method_id: selectedCardId,
      invoice_id: selectedInvoiceForPayment.id,
      customer_id: Number.parseInt(selectedInvoiceForPayment.company_id || "0", 10),
    }, {
      onSuccess: (paymentResult: any) => {
        handleSavedCardPaymentSuccess(paymentResult).catch((err) => {
          console.error("Saved-card payment success handler failed:", err);
          handleDirectPaymentError("Payment processing failed");
          setIsProcessingPayment(false);
        });
      },
      onError: (error) => {
        handleDirectPaymentError(error.message || 'Payment processing failed');
        setIsProcessingPayment(false);
      }
    });
  }, [selectedCardId, selectedInvoiceForPayment, createInvoicePayment, handleSavedCardPaymentSuccess, handleDirectPaymentError]);
  const handleDownloadPDF = useCallback(async (invoice: InvoiceData) => {
    try {
      await downloadInvoicePdf(invoice.id);
    } catch (error) {
      console.error('PDF download error:', error);
      // Error is already handled in the downloadInvoicePdf function
    }
  }, []);

  // Filter pills for invoices
  const invoiceFilterPills = React.useMemo<FilterPill[]>(
    () => [
      {
        id: "status",
        label: "Status",
        type: "select",
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
        value: currentFilters.status || "",
        onChange: (value: string) => {
          setCurrentFilters((prev) => {
            if (value) {
              return { ...prev, status: value };
            } else {
              const { status, ...rest } = prev;
              return rest;
            }
          });
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((prev) => prev + 1);
        },
      },
      {
        id: "invoice_date",
        label: "Invoice Date",
        type: "date",
        value: currentFilters.invoice_date_from || "",
        onChange: (value: string) => {
          setCurrentFilters((prev) => {
            if (value) {
              return { ...prev, invoice_date_from: value };
            } else {
              const { invoice_date_from, ...rest } = prev;
              return rest;
            }
          });
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((prev) => prev + 1);
        },
      },
    ],
    [currentFilters]
  );

  // Stats cards for invoices
  const invoiceStatsCards: StatsCardData[] = React.useMemo(
    () => [
      {
        title: "Total Invoices",
        value: totalRecords,
        icon: Receipt,
        iconColor: "#6366F1",
        iconBgColor: "#EEF2FF",
      },
      {
        title: "Paid",
        value: summary?.paid_count ?? 0,
        icon: CheckCircle,
        iconColor: "#10B981",
        iconBgColor: "#D1FAE5",
      },
      {
        title: "Pending",
        value: summary?.pending_count ?? 0,
        icon: Clock,
        iconColor: "#F59E0B",
        iconBgColor: "#FEF3C7",
      },
      {
        title: "Overdue",
        value: summary?.overdue_count ?? 0,
        icon: AlertCircle,
        iconColor: "#EF4444",
        iconBgColor: "#FEE2E2",
      },
    ],
    [summary, totalRecords]
  );

  // Render Create Invoice Button
  const renderCreateInvoiceButton = () => (
    <div
      style={{
        position: "absolute",
        right: "19px",
        top: "18px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <button
        onClick={() => {
          router.push('/billing/create-invoice');
        }}
        style={{
          padding: "9px 13px",
          backgroundColor: "#000000",
          color: "#ffffff",
          border: "none",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "500",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#1a1a1a";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#000000";
        }}
      >
        <Plus size={16} />
        Create Invoice
      </button>
    </div>
  );

  // Handle preview button click
  const handlePreviewClick = useCallback((invoice: InvoiceData) => {
    openInvoiceSidebar(invoice);
  }, [openInvoiceSidebar]);

  // Toolbar configuration
  const invoicesToolbarConfig = useCrmToolbarConfig({
    entity: "invoices" as any,
    searchValue: invoiceSearch,
    searchPlaceholder: "Search invoices...",
    onSearchChange: setInvoiceSearch,
    onSearch: () => {
      setCurrentFilters((prev) => ({ ...prev, search: invoiceSearch }));
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      setRefreshKey((prev) => prev + 1);
    },
    currentFilters,
    handleFiltersChange: (filters: any) => setCurrentFilters(filters),
    refresh: () => setRefreshKey((prev) => prev + 1),
    activeTab: "all",
    onTabChange: () => {},
    tabs: [
      {
        id: "all",
        label: "All Invoices",
        count: totalAllInvoices,
        removable: false,
      },
    ],
    onTabAdd: () => {},
    onTabRemove: () => {},
    tabsDropdownLabel: "Invoices",
    onFiltersClick: handleOpenFiltersSidebar,
    onExportClick: () => {},
    onEditColumnsClick: () => {},
    showImport: false,
    onImportClick: () => {},
    currentTableView: "table",
    onTableViewChange: () => {},
    extensions: [],
    onPaginationReset: () => setPagination((prev) => ({ ...prev, currentPage: 1 })),
    rightActions: renderCreateInvoiceButton(),
  });




  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Billing"
        mainLink="/billing/dashboard"
        subTitle="Invoices"
      />

      <div className="container-fluid">
        <div className="mb-3 d-flex align-items-center gap-2">
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
        </div>

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
        onPreviewClick={(row) => handlePreviewClick(row)}
        showToolbar={true}
        toolbar={{
          ...invoicesToolbarConfig,
          showFilterPills: true,
          filterPills: invoiceFilterPills,
          showMoreFiltersButton: true,
          onAdvancedFiltersClick: handleOpenFiltersSidebar,
        }}
        statsCards={invoiceStatsCards}
        fixedHeight={true}
        maxHeight="calc(100vh - 345px)"
      />
      </div>

      <GenericSidebar
        isOpen={showInvoiceSidebar}
        onClose={closeInvoiceSidebar}
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
                  ? `${selectedInvoiceSidebar.currency_code || "AED"} ${formatNumber(Number.parseFloat(selectedInvoiceSidebar?.total_amount || "0"))}`
                  : "N/A",
              },
              {
                label: "Amount Due",
                value: selectedInvoiceSidebar
                  ? `${selectedInvoiceSidebar.currency_code || "AED"} ${formatNumber(Number.parseFloat(selectedInvoiceSidebar?.amount_due || "0"))}`
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
                setSelectedInvoiceForView(toInvoiceViewData(selectedInvoiceSidebar));
                setShowViewInvoiceModal(true);
                closeInvoiceSidebar();
              }
            },
          },
          {
            label: "Pay Now",
            icon: DollarSign,
            variant: "success",
            show: canPaySelectedInvoice,
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
          setShowFiltersSidebar(false);
        }}
        onReset={() => {
          setPendingFilters({});
          setCurrentFilters({});
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
                    <p><strong>Subtotal:</strong> {selectedInvoiceForPayment.currency_code || 'USD'} {formatNumber(Number.parseFloat(selectedInvoiceForPayment.subtotal || '0'))}</p>
                    <p><strong>TAX Amount:</strong> {selectedInvoiceForPayment.currency_code || 'USD'} {formatNumber(Number.parseFloat(selectedInvoiceForPayment.tax_amount || '0'))}</p>
                    <p><strong className="text-primary">Total Amount:</strong> {selectedInvoiceForPayment.currency_code || 'USD'} {formatNumber(Number.parseFloat(selectedInvoiceForPayment.total_amount || '0'))}</p>
                    
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <h6 className="mb-3">Payment Method</h6>

              {/* Tabs */}
              <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activePaymentTab === 'saved-cards' ? 'active' : ''}`}
                    onClick={() => setActivePaymentTab('saved-cards')}
                    type="button"
                  >
                    Saved Cards
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activePaymentTab === 'direct-payment' ? 'active' : ''}`}
                    onClick={() => setActivePaymentTab('direct-payment')}
                    type="button"
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
                          amount={Number.parseFloat(selectedInvoiceForPayment.total_amount || "0")}
                          currency={selectedInvoiceForPayment.currency_code || 'USD'}
                          invoiceId={selectedInvoiceForPayment.id}
                          customerId={Number.parseInt(selectedInvoiceForPayment.company_id || "0", 10)}
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
      <InvoiceViewModal
        show={showViewInvoiceModal}
        onHide={closeViewInvoiceModal}
        invoice={selectedInvoiceForView}
        companyName={session?.user?.company_name || ""}
        companyOptions={companyOptions}
      />

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

