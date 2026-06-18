import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import moment from "moment";
import { loadStripe, type PaymentMethod as StripePaymentMethod, type Stripe } from "@stripe/stripe-js";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";

import { GetPaymentMethods, CompletePayment, recordManualInvoicePayment } from "@utils/accounting";
import type { ManualInvoicePaymentMethod } from "@utils/accounting";
import type { InvoiceData, CreateDirectPaymentData, PaymentIntentResponse } from "@utils/accounts";
import { createDirectPayment, getCustomerPaymentMethods, getInvoice } from "@utils/accounts";
import { formatNumber, getCompanyByCrmId } from "@utils/Helper";
import {
  buildManualPaymentAmounts,
  getInvoiceOutstandingAmount,
  isInvoicePartiallyPaid,
  resolveCardPaymentTotals,
} from "./shared/invoicePaymentTotals";

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

function resolveInvoicePaymentCustomerId(invoice: InvoiceData): number {
  const companyRecordId = invoice.crm_company_id;
  if (companyRecordId != null) {
    return Number(companyRecordId);
  }
  if (invoice.tenant_id != null) {
    return Number(invoice.tenant_id);
  }
  throw new Error("No customer ID found");
}

function buildStripeCreatePaymentIntentPayload(
  invoice: InvoiceData,
  paymentMethodId: string,
): CreateDirectPaymentData {
  const { base_amount, processing_fee, amount } = resolveCardPaymentTotals(invoice);
  const currency_code = (String(invoice.currency_code || "USD").trim() || "USD").toUpperCase();
  return {
    invoice_id: Number(invoice.id),
    payment_method: "stripe",
    payment_mode: String(invoice.payment_mode || "one_time"),
    amount,
    processing_fee,
    base_amount,
    payment_method_id: paymentMethodId,
    currency_code,
    currency: currency_code.toLowerCase(),
    notes: `Payment for invoice ${invoice.invoice_number}`,
    customer_id: resolveInvoicePaymentCustomerId(invoice),
  };
}

type PaymentChargeBreakdownProps = Readonly<{
  currencyCode: string;
  baseAmount: number;
  processingFee: number;
  totalCharged: number;
}>;

function PaymentChargeBreakdown({
  currencyCode,
  baseAmount,
  processingFee,
  totalCharged,
}: PaymentChargeBreakdownProps) {
  return (
    <div className="card border mb-3 small">
      <div className="card-body py-3">
        <div className="text-success fw-semibold mb-2">
          {baseAmount > 0
            ? "Card payment applies a 3% processing fee on the outstanding balance only."
            : "No outstanding balance on this invoice."}
        </div>
        <div className="d-flex justify-content-between py-1">
          <span className="text-muted">Outstanding</span>
          <span className="fw-medium">
            {currencyCode} {formatNumber(baseAmount)}
          </span>
        </div>
        <div className="d-flex justify-content-between py-1">
          <span className="text-muted">Card processing fee (3%)</span>
          <span className="text-danger fw-medium">
            + {currencyCode} {formatNumber(processingFee)}
          </span>
        </div>
        <hr className="my-2" />
        <div className="d-flex justify-content-between fw-bold">
          <span>Total to pay by card</span>
          <span className="text-primary">
            {currencyCode} {formatNumber(totalCharged)}
          </span>
        </div>
        <div className="text-muted mt-2" style={{ fontSize: "0.75rem" }}>
          Estimated fee; actual fee is determined at payment time.
        </div>
      </div>
    </div>
  );
}

async function safeCompleteStripePayment(paymentId: string | number): Promise<void> {
  try {
    await CompletePayment({ payment_id: paymentId, payment_method: "stripe" });
  } catch (error) {
    console.error("Failed to update payment status:", error);
  }
}

type StripeCardPaymentUiActions = Readonly<{
  setCardError: (message: string | null) => void;
  setIsProcessing: (value: boolean) => void;
  onPaymentSuccess: () => void;
}>;

async function finalizeStripeIntentIfReady(
  intent: { status?: string } | null | undefined,
  paymentId: string | number | undefined,
  actions: StripeCardPaymentUiActions,
): Promise<void> {
  const status = intent?.status;
  if (!intentStatusAllowsBackendComplete(status)) {
    actions.setCardError("Payment authentication incomplete. Please try again.");
    actions.setIsProcessing(false);
    return;
  }
  if (paymentId != null) {
    await safeCompleteStripePayment(paymentId);
  }
  actions.setIsProcessing(false);
  actions.onPaymentSuccess();
  toast.success("Payment processed successfully!");
}

async function processNewCardStripePaymentSuccess(
  paymentResult: unknown,
  stripe: Stripe,
  paymentMethod: StripePaymentMethod,
  actions: StripeCardPaymentUiActions,
): Promise<void> {
  const pr = paymentResult as { already_completed?: unknown } | null | undefined;
  if (pr?.already_completed) {
    actions.setIsProcessing(false);
    actions.onPaymentSuccess();
    toast.success("Payment was already completed successfully!");
    return;
  }

  const gatewayResponse = extractGatewayResponse(paymentResult);
  const clientSecret = extractClientSecret(paymentResult, gatewayResponse);
  const paymentStatus = gatewayResponse?.status ?? (pr as { status?: string } | undefined)?.status;
  const paymentId = extractPaymentId(paymentResult);

  if (!clientSecret) {
    if (intentStatusAllowsBackendComplete(paymentStatus) && paymentId != null) {
      await safeCompleteStripePayment(paymentId);
    }
    actions.setIsProcessing(false);
    actions.onPaymentSuccess();
    toast.success("Payment processed successfully!");
    return;
  }

  if (STRIPE_SKIP_CLIENT_CONFIRM_STATUSES.has(paymentStatus ?? "")) {
    await finalizeStripeIntentIfReady({ status: paymentStatus }, paymentId, actions);
    return;
  }

  const confirmResult = await stripe.confirmCardPayment(clientSecret, {
    payment_method: paymentMethod.id,
  });
  if (confirmResult.error) {
    actions.setCardError(confirmResult.error.message || "Payment failed");
    actions.setIsProcessing(false);
    return;
  }

  await finalizeStripeIntentIfReady(confirmResult.paymentIntent, paymentId, actions);
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
    (typeof r?.error === "string" && r.error.trim()) ||
    (typeof r?.data?.error === "string" && r.data.error.trim());

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
  invoice: InvoiceData;
  currencyCode: string;
  chargeTotals: ReturnType<typeof resolveCardPaymentTotals>;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}> = ({ invoice, currencyCode, chargeTotals, onPaymentSuccess, onPaymentError }) => {
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
        buildStripeCreatePaymentIntentPayload(invoice, paymentMethod.id),
        {
          onSuccess: (paymentResult: any) => {
            const ui: StripeCardPaymentUiActions = {
              setCardError,
              setIsProcessing,
              onPaymentSuccess,
            };
            processNewCardStripePaymentSuccess(paymentResult, stripe, paymentMethod, ui).catch(
              (err: unknown) => {
                const message =
                  err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string"
                    ? (err as { message: string }).message
                    : "Payment processing failed";
                setCardError(message);
                setIsProcessing(false);
              },
            );
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
      <PaymentChargeBreakdown
        currencyCode={currencyCode}
        baseAmount={chargeTotals.base_amount}
        processingFee={chargeTotals.processing_fee}
        totalCharged={chargeTotals.amount}
      />
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
            <>Pay {currencyCode} {formatNumber(chargeTotals.amount)}</>
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
  const [activePaymentTab, setActivePaymentTab] = useState<
    "saved-cards" | "direct-payment" | "manual-payment"
  >("saved-cards");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);
  const [paymentMethodsError, setPaymentMethodsError] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState<string>("");
  const [invoiceSnapshot, setInvoiceSnapshot] = useState<InvoiceData | null>(null);
  const [isRefreshingInvoice, setIsRefreshingInvoice] = useState(false);
  const [manualPaymentMethod, setManualPaymentMethod] =
    useState<ManualInvoicePaymentMethod>("bank_transfer");
  const [manualPaymentAmount, setManualPaymentAmount] = useState<string>("");
  const [manualPaymentNotes, setManualPaymentNotes] = useState<string>("");
  const [isRecordingManualPayment, setIsRecordingManualPayment] = useState(false);

  const { createInvoicePayment, isCreateInvoicePaymentPending } = useCreateInvoicePayment();

  const activeInvoice = invoiceSnapshot ?? invoice;
  const currencyCode = (
    String(activeInvoice?.currency_code ?? "USD").trim() || "USD"
  ).toUpperCase();
  const chargeTotals = useMemo(
    () => resolveCardPaymentTotals(activeInvoice),
    [activeInvoice],
  );
  const outstandingAmount = useMemo(
    () => getInvoiceOutstandingAmount(activeInvoice),
    [activeInvoice],
  );
  const partiallyPaid = useMemo(
    () => isInvoicePartiallyPaid(activeInvoice),
    [activeInvoice],
  );

  const refreshInvoiceSnapshot = useCallback(async (invoiceId: number) => {
    const fresh = await getInvoice(invoiceId);
    setInvoiceSnapshot(fresh);
    return fresh;
  }, []);

  useEffect(() => {
    if (!show || !invoice?.id) {
      return;
    }

    let cancelled = false;
    setIsRefreshingInvoice(true);
    refreshInvoiceSnapshot(invoice.id)
      .catch((err: unknown) => {
        console.error("InvoicePaymentModal refresh invoice failed:", err);
        if (!cancelled) {
          setInvoiceSnapshot(invoice);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsRefreshingInvoice(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [show, invoice, refreshInvoiceSnapshot]);

  useEffect(() => {
    if (!show) {
      setInvoiceSnapshot(null);
      setManualPaymentAmount("");
      setManualPaymentNotes("");
      setManualPaymentMethod("bank_transfer");
    }
  }, [show]);

  useEffect(() => {
    if (!show || outstandingAmount <= 0) {
      return;
    }
    setManualPaymentAmount(String(outstandingAmount));
  }, [show, outstandingAmount, activeInvoice?.id]);

  const resolvedCompanyName =
    getCompanyByCrmId(activeInvoice?.company?.crm_company_id, companyOptions) ??
    (activeInvoice as any)?.company?.name ??
    "";

  const closeAndReset = useCallback(() => {
    setActivePaymentTab("saved-cards");
    setSelectedCardId(null);
    setIsProcessingPayment(false);
    setIsRecordingManualPayment(false);
    onClose();
  }, [onClose]);

  const loadStripePublishableKey = useCallback(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
    setStripePublishableKey(key);
  }, []);

  /**
   * Customer (billed party) invoices: saved cards from `/accounting/customer/payment-methods/:profileId`
   * (same profile id as payment-intent `customer_id`). Tenant self-pay: legacy `accounting/get-payment-methods`.
   */
  const loadPaymentMethodsList = useCallback(async () => {
    setIsLoadingPaymentMethods(true);
    setPaymentMethodsError("");
    try {
      if (!activeInvoice) {
        setPaymentMethods([]);
        return;
      }
      const tenantSelfPay = activeInvoice.is_tenant_invoice === true;
      const profileId = resolveInvoicePaymentCustomerId(activeInvoice);
      if (!tenantSelfPay && profileId > 0) {
        const methods = await getCustomerPaymentMethods(profileId);
        setPaymentMethods(Array.isArray(methods) ? (methods as PaymentMethod[]) : []);
        return;
      }
      const response = (await GetPaymentMethods()) as any;
      const methods = (response?.payment_methods || []) as PaymentMethod[];
      setPaymentMethods(methods);
    } catch (err: any) {
      console.error("InvoicePaymentModal loadPaymentMethodsList error:", err);
      setPaymentMethods([]);
      setPaymentMethodsError(err?.message || "Failed to load payment methods");
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  }, [activeInvoice]);

  useEffect(() => {
    if (!show) return;
    loadStripePublishableKey();
    loadPaymentMethodsList().catch((err) => {
      console.error("InvoicePaymentModal loadPaymentMethodsList failed:", err);
    });
  }, [show, loadStripePublishableKey, loadPaymentMethodsList]);

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
    if (!selectedCardId || !activeInvoice) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessingPayment(true);
    await createInvoicePayment(
      buildStripeCreatePaymentIntentPayload(activeInvoice, selectedCardId),
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
  }, [
    selectedCardId,
    activeInvoice,
    createInvoicePayment,
    handleSavedCardPaymentSuccess,
    handleDirectPaymentError,
  ]);

  const handleManualPaymentSubmit = useCallback(async () => {
    if (!activeInvoice?.id) {
      return;
    }

    const parsedAmount = Number.parseFloat(manualPaymentAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    if (parsedAmount > outstandingAmount + 0.009) {
      toast.error(
        `Amount cannot exceed outstanding balance (${currencyCode} ${formatNumber(outstandingAmount)})`,
      );
      return;
    }

    const { amount, base_amount } = buildManualPaymentAmounts(parsedAmount);
    setIsRecordingManualPayment(true);
    try {
      await recordManualInvoicePayment({
        invoice_id: Number(activeInvoice.id),
        tenant_id: activeInvoice.tenant_id,
        payment_method: manualPaymentMethod,
        amount,
        base_amount,
        notes: manualPaymentNotes.trim() || undefined,
      });

      const fresh = await refreshInvoiceSnapshot(activeInvoice.id);
      const remaining = getInvoiceOutstandingAmount(fresh);
      toast.success("Manual payment recorded");

      if (remaining <= 0) {
        onPaymentSuccess?.();
        closeAndReset();
        return;
      }

      setManualPaymentAmount(String(remaining));
      setActivePaymentTab("saved-cards");
    } catch (err: unknown) {
      console.error("InvoicePaymentModal manual payment failed:", err);
    } finally {
      setIsRecordingManualPayment(false);
    }
  }, [
    activeInvoice,
    manualPaymentAmount,
    manualPaymentMethod,
    manualPaymentNotes,
    outstandingAmount,
    currencyCode,
    refreshInvoiceSnapshot,
    onPaymentSuccess,
    closeAndReset,
  ]);

  if (!show || !activeInvoice) return null;

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
            <>Pay {currencyCode} {formatNumber(chargeTotals.amount)}</>
          )}
        </Button>
      </div>
    );
  };

  const renderManualPaymentTab = () => (
    <div>
      <Alert variant="info" className="small">
        Manual payments (bank transfer, cash, cheque) have <strong>no processing fee</strong>. Record a
        partial payment here, then pay the remainder by card — the 3% fee applies only to the outstanding
        balance.
      </Alert>
      <div className="mb-3">
        <label className="form-label fw-semibold" htmlFor="manual-payment-method">
          Payment method
        </label>
        <select
          id="manual-payment-method"
          className="form-select"
          value={manualPaymentMethod}
          onChange={(e) =>
            setManualPaymentMethod(e.target.value as ManualInvoicePaymentMethod)
          }
        >
          <option value="bank_transfer">Bank transfer</option>
          <option value="cash">Cash</option>
          <option value="check">Cheque</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold" htmlFor="manual-payment-amount">
          Amount ({currencyCode})
        </label>
        <input
          id="manual-payment-amount"
          type="number"
          min={0}
          step="0.01"
          max={outstandingAmount}
          className="form-control"
          value={manualPaymentAmount}
          onChange={(e) => setManualPaymentAmount(e.target.value)}
        />
        <div className="form-text">
          Outstanding: {currencyCode} {formatNumber(outstandingAmount)}
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold" htmlFor="manual-payment-notes">
          Notes (optional)
        </label>
        <textarea
          id="manual-payment-notes"
          className="form-control"
          rows={2}
          value={manualPaymentNotes}
          onChange={(e) => setManualPaymentNotes(e.target.value)}
        />
      </div>
      <Button
        variant="primary"
        className="w-100"
        disabled={isRecordingManualPayment || outstandingAmount <= 0}
        onClick={() => {
          handleManualPaymentSubmit().catch(() => undefined);
        }}
      >
        {isRecordingManualPayment ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Recording payment...
          </>
        ) : (
          <>Record manual payment</>
        )}
      </Button>
    </div>
  );

  return (
    <Modal show={show} onHide={closeAndReset} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Process Payment - Invoice #{activeInvoice.invoice_number}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isRefreshingInvoice && (
          <div className="text-muted small mb-3">
            <Spinner animation="border" size="sm" className="me-2" />
            Refreshing invoice balance...
          </div>
        )}
        {partiallyPaid && (
          <Alert variant="warning" className="small">
            This invoice is partially paid. Card checkout will charge the{" "}
            <strong>remaining balance</strong> plus a 3% fee — not the original invoice total.
          </Alert>
        )}
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
                  {activeInvoice.invoice_date
                    ? moment(activeInvoice.invoice_date).format("DD-MMM-YYYY")
                    : "N/A"}
                </p>
                <p>
                  <strong>Due Date:</strong>{" "}
                  {activeInvoice.due_date
                    ? moment(activeInvoice.due_date).format("DD-MMM-YYYY")
                    : "N/A"}
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Subtotal:</strong> {currencyCode}{" "}
                  {formatNumber(Number.parseFloat(String(activeInvoice.subtotal || "0")))}
                </p>
                <p>
                  <strong>TAX Amount:</strong> {currencyCode}{" "}
                  {formatNumber(Number.parseFloat(String(activeInvoice.tax_amount || "0")))}
                </p>
                <p>
                  <strong>Invoice total:</strong> {currencyCode}{" "}
                  {formatNumber(Number.parseFloat(String(activeInvoice.total_amount || "0")))}
                </p>
                <p>
                  <strong className="text-primary">Outstanding:</strong> {currencyCode}{" "}
                  {formatNumber(outstandingAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          {(activePaymentTab === "saved-cards" || activePaymentTab === "direct-payment") && (
            <>
              <h6 className="mb-2">Card charge (saved or direct)</h6>
              <p className="text-muted small mb-2">
                The 3% processing fee is calculated on the outstanding balance only — not on amounts already
                paid manually.
              </p>
              <PaymentChargeBreakdown
                currencyCode={currencyCode}
                baseAmount={chargeTotals.base_amount}
                processingFee={chargeTotals.processing_fee}
                totalCharged={chargeTotals.amount}
              />
            </>
          )}
          <h6 className="mb-3">Payment Method</h6>
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button
                className={`nav-link ${activePaymentTab === "manual-payment" ? "active" : ""}`}
                onClick={() => setActivePaymentTab("manual-payment")}
                type="button"
              >
                Manual payment
              </button>
            </li>
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
            {activePaymentTab === "manual-payment" && (
              <div className="tab-pane active">{renderManualPaymentTab()}</div>
            )}
            {activePaymentTab === "saved-cards" && (
              <div className="tab-pane active">{renderSavedCardsTab()}</div>
            )}

            {activePaymentTab === "direct-payment" && (
              <div className="tab-pane active">
                {stripePublishableKey ? (
                  <Elements stripe={loadStripe(stripePublishableKey)}>
                    <DirectCardPaymentForm
                      invoice={activeInvoice}
                      currencyCode={currencyCode}
                      chargeTotals={chargeTotals}
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

