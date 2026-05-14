// Ambient type declarations consumed everywhere in the app. This file MUST
// stay an ambient script (no top-level imports/exports) so module/interface
// augmentations are visible globally.

// CSS / SCSS modules and side-effect imports.
declare module "*.css";
declare module "*.scss";
declare module "*.sass";
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Audio/video assets resolve to URL strings.
declare module "*.mp3" {
  const src: string;
  export default src;
}
declare module "*.mp4" {
  const src: string;
  export default src;
}
declare module "*.wav" {
  const src: string;
  export default src;
}

// JSON imports return their parsed shape (TypeScript handles the type via
// `resolveJsonModule`); this fallback covers raw JSON imports without a
// generated declaration.
declare module "*.json" {
  const value: unknown;
  export default value;
}

// Image and asset imports are wrapped by `next-image-compat` (see
// `src/vite-plugins/next-image-compat.ts`) so they keep the shape consumers
// expect from Next.js (`{ src, width, height, blurDataURL }`). The default
// export is also coerced to its URL via `toString`, so passing it directly to
// `src={...}` still renders the raw URL.
interface NextStaticImageData {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  toString(): string;
}

declare module "*.png" {
  const value: NextStaticImageData;
  export default value;
}
declare module "*.jpg" {
  const value: NextStaticImageData;
  export default value;
}
declare module "*.jpeg" {
  const value: NextStaticImageData;
  export default value;
}
declare module "*.gif" {
  const value: NextStaticImageData;
  export default value;
}
declare module "*.svg" {
  const value: NextStaticImageData;
  export default value;
}
declare module "*.webp" {
  const value: NextStaticImageData;
  export default value;
}
declare module "*.avif" {
  const value: NextStaticImageData;
  export default value;
}
declare module "*.ico" {
  const value: NextStaticImageData;
  export default value;
}

interface ImportMetaEnv {
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  readonly BASE_URL: string;
  readonly VITE_BASE_URL: string;
  readonly VITE_BACKEND_URL: string;
  /** Optional: override dev `/api` proxy target (origin only, e.g. http://192.168.30.150:3001). */
  readonly VITE_DEV_API_PROXY_TARGET?: string;
  readonly VITE_BACKEND_STORAGE_URL: string;
  readonly VITE_STREAMING_URL: string;
  readonly VITE_ENCODING_SECRET_KEY: string;
  readonly VITE_CALL_LOGS_SOCKET_URL: string;
  readonly VITE_PRIVATE_CTI_SOCKET_URL: string;
  readonly VITE_PRIVATE_AIML_SOCKET_URL: string;
  readonly VITE_AIML_WEBSOCKET_PROTOCOL: string;
  readonly VITE_DOMAIN: string;
  readonly VITE_TINYMCE_API_KEY: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_FIREBASE_VAPID_KEY: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
  readonly VITE_FIREBASE_DATABASE_URL: string;
  readonly VITE_ENABLED_FIREBASE_FUNCTION: string;
  readonly VITE_WHATSAPP_SOCKET_URL: string;
  readonly VITE_SENTRY_DSN: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly glob: <T = unknown>(
    pattern: string | string[],
    options?: { eager?: boolean; query?: string; import?: string },
  ) => Record<string, T> | Record<string, () => Promise<T>>;
}

interface Window {
  __SENTRY_ENVIRONMENT__?: string;
  __authLogoutInProgress?: boolean;
}

// `var` declarations at the top level of an ambient script also live on
// `globalThis`, so the same names work via `window.X`, bare `X`, or
// `globalThis.X` without TypeScript flagging an implicit-any index access.
declare var __SENTRY_ENVIRONMENT__: string | undefined;
declare var __authLogoutInProgress: boolean | undefined;

declare module "simplebar-react";
