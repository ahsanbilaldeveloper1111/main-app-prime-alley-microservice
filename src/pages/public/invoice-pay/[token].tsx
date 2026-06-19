import Head from "next/head";
import { useParams } from "react-router-dom";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "react-toastify";

import { getStripePublishableKey } from "@config/env";
import {
  GetPublicInvoicePayByToken,
  PostPublicInvoiceCompletePaymentByToken,
  PostPublicInvoicePayByToken,
  type PublicInvoicePayData,
} from "@utils/accounting";
import { formatNumber } from "@utils/Helper";
import {
  getInvoiceOutstandingAmount,
  isInvoicePartiallyPaid,
  resolveCardPaymentTotals,
} from "@components/billings/shared/invoicePaymentTotals";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: PublicInvoicePayData }
  | { status: "error"; message: string };

function PublicInvoicePayForm({
  token,
  data,
  onPaid,
}: Readonly<{
  token: string;
  data: PublicInvoicePayData;
  onPaid: () => void;
}>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const invoice = data.invoice;
  const currencyCode = (String(invoice?.currency_code ?? "AED").trim() || "AED").toUpperCase();
  const chargeTotals = useMemo(() => resolveCardPaymentTotals(invoice ?? {}), [invoice]);
  const outstanding = useMemo(() => getInvoiceOutstandingAmount(invoice ?? {}), [invoice]);
  const partiallyPaid = useMemo(() => isInvoicePartiallyPaid(invoice ?? {}), [invoice]);

  const handlePay = useCallback(async () => {
    if (!stripe || !elements || !invoice) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error("Card form is not ready");
      return;
    }

    setIsPaying(true);
    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });
      if (error || !paymentMethod) {
        toast.error(error?.message || "Could not read card details");
        return;
      }

      const result = await PostPublicInvoicePayByToken(token, {
        payment_method_id: paymentMethod.id,
        base_amount: chargeTotals.base_amount,
        processing_fee: chargeTotals.processing_fee,
        amount: chargeTotals.amount,
        currency_code: currencyCode,
        consent_given: true,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        exp_month: paymentMethod.card?.exp_month,
        exp_year: paymentMethod.card?.exp_year,
      });

      const clientSecret =
        (result as { client_secret?: string })?.client_secret ??
        (result as { data?: { client_secret?: string } })?.data?.client_secret;
      const paymentId =
        (result as { payment_id?: number })?.payment_id ??
        (result as { payment?: { id?: number } })?.payment?.id;

      if (clientSecret) {
        const confirmed = await stripe.confirmCardPayment(clientSecret, {
          payment_method: paymentMethod.id,
        });
        if (confirmed.error) {
          toast.error(confirmed.error.message || "Card payment failed");
          return;
        }
      }

      if (paymentId != null) {
        await PostPublicInvoiceCompletePaymentByToken(token, { payment_id: Number(paymentId) });
      }

      toast.success("Payment submitted successfully");
      onPaid();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment failed";
      toast.error(message);
    } finally {
      setIsPaying(false);
    }
  }, [stripe, elements, invoice, token, chargeTotals, currencyCode, onPaid]);

  if (!invoice || outstanding <= 0) {
    return <Alert variant="success">This invoice has no outstanding balance.</Alert>;
  }

  return (
    <div>
      {partiallyPaid && (
        <Alert variant="warning" className="small">
          Partial payment already received. The 3% card fee applies to the remaining balance only.
        </Alert>
      )}

      <div className="card border mb-3 small">
        <div className="card-body py-3">
          <div className="d-flex justify-content-between py-1">
            <span className="text-muted">Outstanding</span>
            <span className="fw-medium">
              {currencyCode} {formatNumber(chargeTotals.base_amount)}
            </span>
          </div>
          <div className="d-flex justify-content-between py-1">
            <span className="text-muted">Card processing fee (3%)</span>
            <span className="text-danger fw-medium">
              + {currencyCode} {formatNumber(chargeTotals.processing_fee)}
            </span>
          </div>
          <hr className="my-2" />
          <div className="d-flex justify-content-between fw-bold">
            <span>Total to pay by card</span>
            <span className="text-primary">
              {currencyCode} {formatNumber(chargeTotals.amount)}
            </span>
          </div>
        </div>
      </div>

      <div className="border rounded p-3 mb-3">
        <CardElement
          onChange={(e) => setCardComplete(Boolean(e.complete))}
          options={{ hidePostalCode: true }}
        />
      </div>

      <Button
        variant="success"
        className="w-100"
        disabled={!cardComplete || isPaying || !stripe}
        onClick={() => {
          handlePay().catch(() => undefined);
        }}
      >
        {isPaying ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Processing...
          </>
        ) : (
          <>Pay {currencyCode} {formatNumber(chargeTotals.amount)}</>
        )}
      </Button>
    </div>
  );
}

export default function PublicInvoicePayPage() {
  const params = useParams();
  const token = String(params.token ?? "").trim();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [paid, setPaid] = useState(false);

  const reload = useCallback(async () => {
    if (!token) {
      setState({ status: "error", message: "Invalid payment link." });
      return;
    }
    setState({ status: "loading" });
    try {
      const data = (await GetPublicInvoicePayByToken(token)) as PublicInvoicePayData;
      setState({ status: "ready", data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not load invoice payment page.";
      setState({ status: "error", message });
    }
  }, [token]);

  useEffect(() => {
    reload().catch(() => undefined);
  }, [reload]);

  const publishableKey =
    state.status === "ready"
      ? String(state.data.publishable_key ?? getStripePublishableKey() ?? "")
      : "";
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  const invoiceNumber =
    state.status === "ready" ? state.data.invoice?.invoice_number : undefined;

  return (
    <>
      <Head>
        <title>Pay invoice{invoiceNumber ? ` #${invoiceNumber}` : ""}</title>
      </Head>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            padding: 28,
          }}
        >
          <h1 style={{ fontSize: "1.35rem", marginBottom: 8 }}>Pay invoice</h1>
          {invoiceNumber && (
            <p className="text-muted mb-3">Invoice #{invoiceNumber}</p>
          )}

          {state.status === "loading" && <p className="text-muted">Loading...</p>}
          {state.status === "error" && <Alert variant="danger">{state.message}</Alert>}
          {paid && (
            <Alert variant="success">Thank you — your payment was submitted.</Alert>
          )}

          {state.status === "ready" && !paid && stripePromise && (
            <Elements stripe={stripePromise}>
              <PublicInvoicePayForm
                token={token}
                data={state.data}
                onPaid={() => setPaid(true)}
              />
            </Elements>
          )}

          {state.status === "ready" && !paid && !publishableKey && (
            <Alert variant="warning">Stripe is not configured for this payment page.</Alert>
          )}
        </div>
      </div>
    </>
  );
}
