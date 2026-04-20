import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import moment from "moment";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";

import { GetPaymentMethods, CompletePayment } from "@utils/accounting";
import type { InvoiceData, CreateDirectPaymentData, PaymentIntentResponse } from "@utils/accounts";
import { createDirectPayment } from "@utils/accounts";
import { formatNumber, getCompanyByCrmId } from "@utils/Helper";

/** Intent states where the payment has been accepted by Stripe (incl. async capture / 3DS done). */
const STRIPE_INTENT_COMPLETE_ENOUGH_STATUSES = new Set([
  "succeeded",
  "requires_confirmation",
  "processing",
  "requires_capture",
]);

/** When the server already reports these, the client usually does not need confirmCardPayment. */
const STRIPE_SKIP_CLIENT_CONFIRM_STATUSES = new Set(["succeeded", "requires_confirmation"]);

function intentStatusAllowsBackendComplete(status: string | undefined): boolean {
  return Boolean(status && STRIPE_INTENT_COMPLETE_ENOUGH_STATUSES.has(status));
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
    paymentResult?.data?.payment_id ??
    paymentResult?.data?.data?.payment?.id
  );
}

async function safeCompleteStripePayment(paymentId: string | number): Promise<void> {
  try {
    await CompletePayment({ payment_id: paymentId, payment_method: "stripe" });
  } catch (error) {
    console.error("Failed to update payment status:", error);
  }
}

type UseCreateInvoicePaymentReturn = Readonly<{
  createInvoicePayment: (
    data: CreateDirectPaymentData,
    callbacks?: {
      onSuccess?: (response: PaymentIntentResponse) => void;
      onError?: (error: any) => void;
    }
  ) => Promise<void>;
  isCreateInvoicePaymentPending: boolean;
  isCreateInvoicePaymentError: boolean;
  createInvoicePaymentError: any;
}>;

function getPaymentFailureMessage(response: unknown): string | null {
  if (response == null || typeof response !== "object") return null;
  const r: any = response as any;

  let success: boolean | undefined;
  if (typeof r?.success === "boolean") success = r.success;
  else if (typeof r?.data?.success === "boolean") success = r.data.success;
  else if (typeof r?.data?.data?.success === "boolean") success = r.data.data.success;

  if (success !== false) return null;

  const message =
    (typeof r?.message === "string" && r.message.trim()) ||
    (typeof r?.data?.message === "string" && r.data.message.trim()) ||
    (typeof r?.error === "string" && r.error.trim());

  return message || "Payment failed";
}

const useCreateInvoicePayment = (): UseCreateInvoicePaymentReturn => {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<any>(null);

  const createInvoicePayment = useCallback(
    async (
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
        const failureMessage = getPaymentFailureMessage(response);
        if (failureMessage) {
          throw new Error(failureMessage);
        }
        callbacks?.onSuccess?.(response);
      } catch (err) {
        setIsError(true);
        setError(err);
        callbacks?.onError?.(err);
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return {
    createInvoicePayment,
    isCreateInvoicePaymentPending: isPending,
    isCreateInvoicePaymentError: isError,
    createInvoicePaymentError: error,
  };
};

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
  const [cardComplete, setCardComplete] = useState(false);

  const {
    createInvoicePayment,
    isCreateInvoicePaymentPending,
    isCreateInvoicePaymentError,
    createInvoicePaymentError,
  } = useCreateInvoicePayment();

  const CARD_ELEMENT_OPTIONS = useMemo(
    () => ({
      style: {
        base: {
          fontSize: "16px",
          color: "#424770",
          "::placeholder": { color: "#aab7c4" },
        },
        invalid: { color: "#9e2146" },
      },
      hidePostalCode: true,
    }),
    []
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onPaymentError("Stripe has not loaded yet");
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        onPaymentError("Card element is not ready yet");
        setIsProcessing(false);
        return;
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (error) {
        setCardError(error.message || "Failed to create payment method");
        setIsProcessing(false);
        return;
      }

      await createInvoicePayment(
        {
          amount,
          currency: currency.toLowerCase(),
          payment_method_id: paymentMethod.id,
          invoice_id: invoiceId,
          customer_id: customerId,
        },
        {
          onSuccess: (paymentResult: any) => {
            (async () => {
              if (paymentResult?.already_completed) {
                setIsProcessing(false);
                onPaymentSuccess();
                toast.success("Payment was already completed successfully!");
                return;
              }

              const gatewayResponse = extractGatewayResponse(paymentResult);
              const clientSecret = extractClientSecret(paymentResult, gatewayResponse);
              const paymentStatus = gatewayResponse?.status ?? paymentResult?.status;
              const paymentId = extractPaymentId(paymentResult);

              /** Notify backend when Stripe intent is in a settled / in-flight success state. */
              const tryCompleteDirectPayment = async (intent: { status?: string } | null | undefined) => {
                const status = intent?.status;
                if (!intentStatusAllowsBackendComplete(status)) {
                  setCardError("Payment authentication incomplete. Please try again.");
                  setIsProcessing(false);
                  return;
                }
                if (paymentId != null) await safeCompleteStripePayment(paymentId);
                setIsProcessing(false);
                onPaymentSuccess();
                toast.success("Payment processed successfully!");
              };

              if (!clientSecret) {
                if (intentStatusAllowsBackendComplete(paymentStatus) && paymentId != null) {
                  await safeCompleteStripePayment(paymentId);
                }
                setIsProcessing(false);
                onPaymentSuccess();
                toast.success("Payment processed successfully!");
                return;
              }

              if (STRIPE_SKIP_CLIENT_CONFIRM_STATUSES.has(paymentStatus ?? "")) {
                await tryCompleteDirectPayment({ status: paymentStatus });
                return;
              }

              // Server often returns status `requires_action` with next_action.type `use_stripe_sdk` (3DS2).
              // Passing the same payment_method id helps Stripe.js complete SCA reliably.
              const confirmResult = await stripe.confirmCardPayment(clientSecret, {
                payment_method: paymentMethod.id,
              });
              if (confirmResult.error) {
                setCardError(confirmResult.error.message || "Payment failed");
                setIsProcessing(false);
                return;
              }

              await tryCompleteDirectPayment(confirmResult.paymentIntent);
            })().catch((err) => {
              setCardError(err?.message || "Payment processing failed");
              setIsProcessing(false);
            });
          },
          onError: (err) => {
            setCardError(err?.message || "Payment processing failed");
            setIsProcessing(false);
          },
        }
      );
    } catch (err: any) {
      setCardError(err?.message || "Payment processing failed");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <div className="form-label fw-bold">Card Details</div>
        <div className="border rounded p-3">
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={(e) => {
              setCardComplete(Boolean(e.complete));
              setCardError(e.error?.message ?? null);
            }}
          />
        </div>
        {cardError && <div className="text-danger mt-2">{cardError}</div>}
      </div>

      <div className="mb-3">
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
            <>Pay Now</>
          )}
        </Button>
      </div>

      {isCreateInvoicePaymentError && (
        <Alert variant="danger" className="mt-3">
          {createInvoicePaymentError?.message || "Payment processing failed"}
        </Alert>
      )}
    </form>
  );
};

export type InvoicePaymentModalProps = Readonly<{
  show: boolean;
  invoice: InvoiceData | null;
  companyOptions?: { id: string | number; name?: string }[];
  onClose: () => void;
  onPaymentSuccess?: () => void;
}>;

type PaymentMethod = {
  id: string;
  type?: string;
  is_default?: boolean;
  card?: { brand?: string; last4?: string; exp_month?: number; exp_year?: number };
  billing_details?: { name?: string };
};

export function InvoicePaymentModal({
  show,
  invoice,
  companyOptions = [],
  onClose,
  onPaymentSuccess,
}: InvoicePaymentModalProps) {
  const [activePaymentTab, setActivePaymentTab] = useState<"saved-cards" | "direct-payment">("saved-cards");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);
  const [paymentMethodsError, setPaymentMethodsError] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState<string>("");

  const { createInvoicePayment, isCreateInvoicePaymentPending } = useCreateInvoicePayment();

  const invoiceId = Number(invoice?.id ?? 0);
  const customerId = Number.parseInt(String(invoice?.company_id ?? "0"), 10);
  const totalAmount = Number.parseFloat(String(invoice?.total_amount ?? "0"));
  const currencyCode = String(invoice?.currency_code ?? "USD");

  const resolvedCompanyName =
    getCompanyByCrmId(invoice?.company?.crm_company_id, companyOptions) ??
    (invoice as any)?.company?.name ??
    "";

  const closeAndReset = useCallback(() => {
    setActivePaymentTab("saved-cards");
    setSelectedCardId(null);
    setIsProcessingPayment(false);
    onClose();
  }, [onClose]);

  const loadStripePublishableKey = useCallback(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
    setStripePublishableKey(key);
  }, []);

  const getPaymentMethods = useCallback(async () => {
    setIsLoadingPaymentMethods(true);
    setPaymentMethodsError("");
    try {
      const response = (await GetPaymentMethods()) as any;
      const methods = (response?.payment_methods || []) as PaymentMethod[];
      setPaymentMethods(methods);
    } catch (err: any) {
      console.error("InvoicePaymentModal getPaymentMethods error:", err);
      setPaymentMethods([]);
      setPaymentMethodsError(err?.message || "Failed to load payment methods");
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    loadStripePublishableKey();
    getPaymentMethods().catch((err) => {
      console.error("InvoicePaymentModal getPaymentMethods failed:", err);
    });
  }, [show, loadStripePublishableKey, getPaymentMethods]);

  useEffect(() => {
    if (!show) return;
    if (paymentMethods.length === 0) return;
    const defaultCard = paymentMethods.find((m) => m.is_default && m.type === "card");
    const firstCard = paymentMethods.find((m) => m.type === "card");
    setSelectedCardId((defaultCard ?? firstCard)?.id ?? null);
  }, [show, paymentMethods]);

  const handleDirectPaymentSuccess = useCallback(() => {
    onPaymentSuccess?.();
    closeAndReset();
  }, [onPaymentSuccess, closeAndReset]);

  const handleDirectPaymentError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  const handleSavedCardPaymentSuccess = useCallback(
    async (paymentResult: any) => {
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

      if (intentStatusAllowsBackendComplete(intentStatus)) {
        if (paymentId) await safeCompleteStripePayment(paymentId);

        setIsProcessingPayment(false);
        handleDirectPaymentSuccess();
        toast.success("Payment authenticated and processed successfully!");
        return;
      }

      setIsProcessingPayment(false);
      toast.error("Payment authentication incomplete. Please try again.");
    },
    [
      handleDirectPaymentError,
      handleDirectPaymentSuccess,
      selectedCardId,
      stripePublishableKey,
      setIsProcessingPayment,
    ]
  );

  const handlePaymentWithSavedCard = useCallback(async () => {
    if (!selectedCardId || !invoice) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessingPayment(true);
    await createInvoicePayment(
      {
        amount: Number.parseFloat(String(invoice.total_amount || "0")),
        currency: (invoice.currency_code || "USD").toLowerCase(),
        payment_method_id: selectedCardId,
        invoice_id: Number(invoice.id),
        customer_id: Number.parseInt(String(invoice.company_id || "0"), 10),
      },
      {
        onSuccess: (paymentResult: any) => {
          handleSavedCardPaymentSuccess(paymentResult).catch((err) => {
            console.error("Saved-card payment success handler failed:", err);
            handleDirectPaymentError("Payment processing failed");
            setIsProcessingPayment(false);
          });
        },
        onError: (error) => {
          handleDirectPaymentError(error.message || "Payment processing failed");
          setIsProcessingPayment(false);
        },
      }
    );
  }, [selectedCardId, invoice, createInvoicePayment, handleSavedCardPaymentSuccess, handleDirectPaymentError]);

  if (!show || !invoice) return null;

  const hasSavedCards = paymentMethods.some((m) => m.type === "card");
  const renderSavedCardsTab = () => {
    if (isLoadingPaymentMethods) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>Loading payment methods...</span>
        </div>
      );
    }

    if (paymentMethodsError) {
      return <Alert variant="danger">{paymentMethodsError}</Alert>;
    }

    if (!hasSavedCards) {
      return <Alert variant="info">No saved cards found. Please use Direct Payment.</Alert>;
    }

    return (
      <div>
        <div className="mb-3">
          {paymentMethods
            .filter((m) => m.type === "card")
            .map((method) => (
              <label
                key={method.id}
                htmlFor={`card-${method.id}`}
                aria-label={`Select saved card ending ${method.card?.last4 || ""}`}
                className={`card mb-2 ${selectedCardId === method.id ? "border-primary" : ""}`}
                style={{ cursor: "pointer", marginBottom: 0 }}
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
                      <div className="d-flex justify-content-between">
                        <div>
                          <strong className="text-capitalize">
                            {method.card?.brand || "Card"} ****{method.card?.last4 || ""}
                          </strong>
                          {method.is_default && <span className="badge bg-success ms-2">Default</span>}
                        </div>
                        <div className="text-muted">
                          Exp: {method.card?.exp_month || "--"}/{method.card?.exp_year || "--"}
                        </div>
                      </div>
                      <div className="text-muted small">{method.billing_details?.name || ""}</div>
                    </div>
                  </div>
                </div>
              </label>
            ))}
        </div>

        <Button
          variant="success"
          className="w-100"
          onClick={() => {
            handlePaymentWithSavedCard().then(() => undefined);
          }}
          disabled={
            isLoadingPaymentMethods ||
            isProcessingPayment ||
            isCreateInvoicePaymentPending ||
            !selectedCardId
          }
        >
          {isProcessingPayment || isCreateInvoicePaymentPending ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing Payment...
            </>
          ) : (
            <>Pay Now</>
          )}
        </Button>
      </div>
    );
  };

  return (
    <Modal show={show} onHide={closeAndReset} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Process Payment - Invoice #{invoice.invoice_number}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="card mb-4">
          <div className="card-header">
            <h6 className="mb-0">Invoice Summary</h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p>
                  <strong>Company:</strong> {resolvedCompanyName}
                </p>
                <p>
                  <strong>Invoice Date:</strong>{" "}
                  {invoice.invoice_date ? moment(invoice.invoice_date).format("DD-MMM-YYYY") : "N/A"}
                </p>
                <p>
                  <strong>Due Date:</strong>{" "}
                  {invoice.due_date ? moment(invoice.due_date).format("DD-MMM-YYYY") : "N/A"}
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Subtotal:</strong> {currencyCode}{" "}
                  {formatNumber(Number.parseFloat(String(invoice.subtotal || "0")))}
                </p>
                <p>
                  <strong>TAX Amount:</strong> {currencyCode}{" "}
                  {formatNumber(Number.parseFloat(String(invoice.tax_amount || "0")))}
                </p>
                <p>
                  <strong className="text-primary">Total Amount:</strong> {currencyCode}{" "}
                  {formatNumber(Number.parseFloat(String(invoice.total_amount || "0")))}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h6 className="mb-3">Payment Method</h6>
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button
                className={`nav-link ${activePaymentTab === "saved-cards" ? "active" : ""}`}
                onClick={() => setActivePaymentTab("saved-cards")}
                type="button"
              >
                Saved Cards
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activePaymentTab === "direct-payment" ? "active" : ""}`}
                onClick={() => setActivePaymentTab("direct-payment")}
                type="button"
              >
                Direct Payment
              </button>
            </li>
          </ul>

          <div className="tab-content">
            {activePaymentTab === "saved-cards" && (
              <div className="tab-pane active">
                {renderSavedCardsTab()}
              </div>
            )}

            {activePaymentTab === "direct-payment" && (
              <div className="tab-pane active">
                {stripePublishableKey ? (
                  <Elements stripe={loadStripe(stripePublishableKey)}>
                    <DirectCardPaymentForm
                      amount={totalAmount}
                      currency={currencyCode}
                      invoiceId={invoiceId}
                      customerId={customerId}
                      onPaymentSuccess={handleDirectPaymentSuccess}
                      onPaymentError={handleDirectPaymentError}
                    />
                  </Elements>
                ) : (
                  <Alert variant="warning">Stripe publishable key is missing</Alert>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export function useInvoicePaymentModal(args: Readonly<{
  companyOptions?: { id: string | number; name?: string }[];
  onPaymentSuccess?: () => void;
}>) {
  const [show, setShow] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);

  const open = useCallback((next: InvoiceData) => {
    setInvoice(next);
    setShow(true);
  }, []);

  const close = useCallback(() => {
    setShow(false);
    setInvoice(null);
  }, []);

  const modal = (
    <InvoicePaymentModal
      show={show}
      invoice={invoice}
      companyOptions={args.companyOptions}
      onClose={close}
      onPaymentSuccess={args.onPaymentSuccess}
    />
  );

  return { openInvoicePayment: open, closeInvoicePayment: close, invoicePaymentModal: modal };
}

