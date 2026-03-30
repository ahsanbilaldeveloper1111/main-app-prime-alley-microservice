import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import {
  fetchPublicVerifyCheckoutSession,
  type PublicVerifyCheckoutSessionResult,
} from "@utils/accounting";

type VerifyState =
  | { status: "loading" }
  | { status: "success"; payload: PublicVerifyCheckoutSessionResult }
  | { status: "error"; message: string };

function normalizeSessionId(query: string | string[] | undefined): string | null {
  if (query === undefined) {
    return null;
  }
  const raw = Array.isArray(query) ? query[0] : query;
  const trimmed = String(raw ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

const PublicPaymentSuccessPage = () => {
  const router = useRouter();
  const [state, setState] = useState<VerifyState>({ status: "loading" });

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    const sessionId = normalizeSessionId(router.query.session_id);
    if (!sessionId) {
      setState({
        status: "error",
        message: "Missing session. Please use the link from Stripe or your invoice email.",
      });
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const payload = await fetchPublicVerifyCheckoutSession(sessionId);
        if (!cancelled) {
          setState({ status: "success", payload });
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Could not verify this payment.";
          setState({ status: "error", message });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.query.session_id]);

  const title = "Payment successful";

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "linear-gradient(160deg, #f0fdfa 0%, #ecfeff 45%, #f8fafc 100%)",
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
          {( !router.isReady || state.status === "loading") && (
            <p style={{ margin: 0, color: "#475569", fontSize: 16 }}>Confirming your payment…</p>
          )}
          {state.status === "success" && (
            <>
              <CheckCircle
                aria-hidden
                size={56}
                color="#059669"
                strokeWidth={1.75}
                style={{ margin: "0 auto 16px" }}
              />
              <h1 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>
                Thank you
              </h1>
              <p style={{ margin: 0, color: "#475569", fontSize: 15, lineHeight: 1.5 }}>
                Your payment was successful. You can close this window or return to the site that sent you here.
              </p>
              {state.payload.invoice_number ? (
                <p
                  style={{
                    margin: "16px 0 0",
                    color: "#0f172a",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  Invoice Number{" "}
                  <span style={{ fontWeight: 700 }}>{state.payload.invoice_number}</span>
                </p>
              ) : null}
            </>
          )}
          {state.status === "error" && (
            <>
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

export default PublicPaymentSuccessPage;
