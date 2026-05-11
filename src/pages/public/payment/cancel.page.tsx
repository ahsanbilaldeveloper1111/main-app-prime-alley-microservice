import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Info, XCircle } from "lucide-react";
import {
  fetchPublicCancelCheckout,
  type PublicCancelCheckoutPayload,
  type PublicCancelCheckoutResult,
} from "@utils/accounting";

type CancelState =
  | { status: "loading" }
  | { status: "success"; payload: PublicCancelCheckoutResult }
  | { status: "error"; message: string };

function normalizeQueryString(query: string | string[] | undefined): string | undefined {
  if (query === undefined) {
    return undefined;
  }
  const raw = Array.isArray(query) ? query[0] : query;
  const trimmed = String(raw ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeInvoiceId(query: string | string[] | undefined): number | null {
  const str = normalizeQueryString(query);
  if (str === undefined) {
    return null;
  }
  const n = Number.parseInt(str, 10);
  return Number.isFinite(n) ? n : null;
}

function getCancelledCheckoutInvoiceNumber(payload: PublicCancelCheckoutResult): string | undefined {
  if (payload.cancelled === true) {
    const nested = payload.payment?.invoice?.invoice_number;
    return typeof nested === "string" && nested.trim() ? nested.trim() : undefined;
  }
  return undefined;
}

function resolveCancelSuccessBodyMessage(trimmedApiMessage: string, isMarkedCancelled: boolean): string {
  if (trimmedApiMessage.length > 0) {
    return trimmedApiMessage;
  }
  if (isMarkedCancelled) {
    return "Your checkout was cancelled.";
  }
  return "";
}

const PublicPaymentCancelPage = () => {
  const router = useRouter();
  const [state, setState] = useState<CancelState>({ status: "loading" });

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const invoiceId = normalizeInvoiceId(router.query.invoice_id);
    if (invoiceId === null) {
      setState({
        status: "error",
        message: "Missing invoice reference. Please use the link from your invoice or payment page.",
      });
      return;
    }

    const sessionId = normalizeQueryString(router.query.session_id);

    let effectDisposed = false;

    void (async () => {
      try {
        const requestPayload: PublicCancelCheckoutPayload = { invoice_id: invoiceId };
        if (sessionId) {
          requestPayload.session_id = sessionId;
        }
        const payload = await fetchPublicCancelCheckout(requestPayload);
        if (effectDisposed) {
          return;
        }
        setState({ status: "success", payload });
      } catch (e: unknown) {
        if (effectDisposed) {
          return;
        }
        const message = e instanceof Error ? e.message : "Could not record checkout cancellation.";
        setState({ status: "error", message });
      }
    })();

    return () => {
      effectDisposed = true;
    };
  }, [router.isReady, router.query.invoice_id, router.query.session_id]);

  const successPayload = state.status === "success" ? state.payload : null;
  const isMarkedCancelled = successPayload?.cancelled === true;
  const trimmedApiMessage = successPayload?.message?.trim() ?? "";
  const successMessage = resolveCancelSuccessBodyMessage(trimmedApiMessage, isMarkedCancelled);
  const invoiceNumberFromPayload = successPayload
    ? getCancelledCheckoutInvoiceNumber(successPayload)
    : undefined;
  const title = isMarkedCancelled ? "Payment cancelled" : "Checkout";

  return (
    <>
      <Head>
        <title>{state.status === "success" ? title : "Payment"}</title>
      </Head>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "linear-gradient(160deg, #fef2f2 0%, #fff7ed 50%, #f8fafc 100%)",
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.12)",
            border: "1px solid #e2e8f0",
            padding: "32px 28px",
            textAlign: "center",
          }}
        >
          {(!router.isReady || state.status === "loading") && (
            <p style={{ margin: 0, color: "#475569", fontSize: 16 }}>Getting your payment status…</p>
          )}
          {state.status === "success" && successPayload && (
            <>
              {isMarkedCancelled ? (
                <XCircle
                  aria-hidden
                  size={56}
                  color="#ca8a04"
                  strokeWidth={1.75}
                  style={{ margin: "0 auto 16px" }}
                />
              ) : (
                <Info
                  aria-hidden
                  size={56}
                  color="#2563eb"
                  strokeWidth={1.75}
                  style={{ margin: "0 auto 16px" }}
                />
              )}
              <h1 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>
                {isMarkedCancelled ? "Payment cancelled" : "Checkout"}
              </h1>
              <p style={{ margin: 0, color: "#475569", fontSize: 15, lineHeight: 1.5 }}>{successMessage}</p>
              {isMarkedCancelled && invoiceNumberFromPayload ? (
                <p
                  style={{
                    margin: "16px 0 0",
                    color: "#0f172a",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  Invoice Number{" "}
                  <span style={{ fontWeight: 700 }}>{invoiceNumberFromPayload}</span>
                </p>
              ) : null}
            </>
          )}
          {state.status === "error" && (
            <>
              <XCircle
                aria-hidden
                size={56}
                color="#b91c1c"
                strokeWidth={1.75}
                style={{ margin: "0 auto 16px" }}
              />
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 12px", color: "#b91c1c" }}>
                Something went wrong
              </h1>
              <p style={{ margin: 0, color: "#475569", fontSize: 15, lineHeight: 1.5 }}>{state.message}</p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PublicPaymentCancelPage;
