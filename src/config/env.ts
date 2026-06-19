// Build-time environment configuration sourced from Vite. Legacy callers still
// reach for `process.env.NEXT_PUBLIC_*`, which Vite's `define` block backfills.
const env = (import.meta.env ?? {}) as Record<string, string | undefined>;

const value = (...keys: string[]) => {
  for (const key of keys) {
    const v = env[key];
    if (v) return v;
  }
  return "";
};

export const config = {
  app: {
    name: "Business Workspace AI-Powered",
    baseUrl: value("VITE_BASE_URL", "NEXT_PUBLIC_BASE_URL"),
  },

  backend: {
    url: value("VITE_BACKEND_URL", "NEXT_PUBLIC_BACKEND_URL"),
    timeout: 10000,
  },

  streaming: {
    url: value("VITE_STREAMING_URL"),
  },

  stripe: {
    publishableKey: value(
      "VITE_STRIPE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    ),
  },

  firebase: {
    apiKey: value("VITE_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: value(
      "VITE_FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    ),
    projectId: value(
      "VITE_FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    ),
    storageBucket: value(
      "VITE_FIREBASE_STORAGE_BUCKET",
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    ),
    messagingSenderId: value(
      "VITE_FIREBASE_MESSAGING_SENDER_ID",
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    ),
    appId: value("VITE_FIREBASE_APP_ID", "NEXT_PUBLIC_FIREBASE_APP_ID"),
    vapidKey: value(
      "VITE_FIREBASE_VAPID_KEY",
      "NEXT_PUBLIC_FIREBASE_VAPID_KEY",
    ),
  },
};

/** Stripe.js publishable key (`VITE_STRIPE_PUBLISHABLE_KEY` or legacy `NEXT_PUBLIC_*`). */
export function getStripePublishableKey(): string {
  return config.stripe.publishableKey;
}

export const validateEnv = () => {
  if (!config.backend.url) {
    // Surface configuration issues early rather than failing on first request.
    // eslint-disable-next-line no-console
    console.warn(
      "[config] VITE_BACKEND_URL (or NEXT_PUBLIC_BACKEND_URL) is empty; API calls will fail.",
    );
  }
};

validateEnv();
