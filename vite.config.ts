import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
import { nextImageCompatPlugin } from "./src/vite-plugins/next-image-compat";

// `next/*` and `next-auth/*` imports are redirected to local shims so existing
// pages keep compiling unchanged after dropping Next.js. New code should import
// directly from `react-router-dom`, `react-helmet-async`, `@/auth`, etc.
const nextShimAliases = {
  "next/router": path.resolve(__dirname, "src/shims/next-router.tsx"),
  "next/head": path.resolve(__dirname, "src/shims/next-head.tsx"),
  "next/link": path.resolve(__dirname, "src/shims/next-link.tsx"),
  "next/dynamic": path.resolve(__dirname, "src/shims/next-dynamic.tsx"),
  "next/image": path.resolve(__dirname, "src/shims/next-image.tsx"),
  "next/document": path.resolve(__dirname, "src/shims/next-document.tsx"),
  "next/error": path.resolve(__dirname, "src/shims/next-error.tsx"),
  "next/app": path.resolve(__dirname, "src/shims/next-app.tsx"),
  "next/server": path.resolve(__dirname, "src/shims/next-server.tsx"),
  "next/script": path.resolve(__dirname, "src/shims/next-script.tsx"),
  "next/font/google": path.resolve(__dirname, "src/shims/next-font.tsx"),
  "next/font/local": path.resolve(__dirname, "src/shims/next-font.tsx"),
  next: path.resolve(__dirname, "src/shims/next-types.tsx"),
  "next-auth/react": path.resolve(__dirname, "src/shims/next-auth-react.tsx"),
  "next-auth/jwt": path.resolve(__dirname, "src/shims/next-auth-jwt.tsx"),
  "next-auth": path.resolve(__dirname, "src/shims/next-auth.tsx"),
  "next-i18next": path.resolve(__dirname, "src/shims/next-i18next.tsx"),
  "next-redux-wrapper": path.resolve(
    __dirname,
    "src/shims/next-redux-wrapper.tsx",
  ),
  "@sentry/nextjs": path.resolve(__dirname, "src/shims/sentry-nextjs.ts"),
};

/** Upstream origin for dev `server.proxy['/api']` (parsed from absolute backend URLs in env). */
function resolveDevApiProxyTarget(env: Record<string, string>): string {
  const explicit = (env.VITE_DEV_API_PROXY_TARGET || "")
    .trim()
    .replace(/\/+$/, "");
  if (explicit.length > 0) return explicit;
  for (const key of ["NEXT_PUBLIC_BACKEND_URL", "VITE_BACKEND_URL"] as const) {
    const raw = (env[key] || "").trim();
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      try {
        return new URL(raw).origin;
      } catch {
        /* ignore */
      }
    }
  }
  return "http://127.0.0.1:3001";
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Mirror NEXT_PUBLIC_* and VITE_* env vars onto process.env.* at build time so
  // legacy modules that still read process.env.NEXT_PUBLIC_FOO keep working
  // without an immediate rewrite. New code should prefer import.meta.env.VITE_*.
  const exposedEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("NEXT_PUBLIC_") || key.startsWith("VITE_")) {
      exposedEnv[`process.env.${key}`] = JSON.stringify(value ?? "");
    }
  }

  const streamingProxy: ProxyOptions = {
    target: env.VITE_STREAMING_URL || "http://localhost:3100",
    changeOrigin: true,
    ws: true,
    rewrite: (path) => path.replace(/^\/streaming/, ""),
  };

  const serverProxy: Record<string, string | ProxyOptions> = {
    "/streaming": streamingProxy,
  };

  if (env.APPLY_PROXY_TO_API) {
    serverProxy["/api"] = {
      target: resolveDevApiProxyTarget(env),
      changeOrigin: true,
      secure: false,
    };
  }

  return {
    plugins: [react(), tsconfigPaths(), nextImageCompatPlugin()],

    resolve: {
      alias: {
        ...nextShimAliases,
        "~bootstrap": path.resolve(__dirname, "node_modules/bootstrap"),
        // Default react-bootstrap Modal: static backdrop + no Esc dismiss
        // (preserved from the previous webpack NormalModuleReplacementPlugin).
        "react-bootstrap/esm/Modal.js": path.resolve(
          __dirname,
          "src/shims/react-bootstrap-modal.tsx",
        ),
      },
    },

    css: {
      preprocessorOptions: {
        scss: {
          // Replicate the Webpack `resolve.modules` behavior the previous Next
          // build relied on: `@import 'node_modules/bootstrap/scss/...'`
          // resolves from the project root, while `@import 'partials/...'`
          // resolves from `src/assets/scss`.
          loadPaths: [
            __dirname,
            path.join(__dirname, "src/assets/scss"),
            path.join(__dirname, "node_modules"),
          ],
          quietDeps: true,
          silenceDeprecations: ["legacy-js-api", "import", "global-builtin"],
        },
      },
    },

    define: {
      // Vite normally only inlines import.meta.env.*. Backfill process.env.* for
      // any legacy module still reading from process.env, so the rewrite stays
      // minimal during the migration.
      "process.env.NODE_ENV": JSON.stringify(mode),
      ...exposedEnv,
    },

    server: {
      port: 3000,
      host: true,
      proxy: serverProxy,
    },

    build: {
      outDir: "dist",
      sourcemap: true,
      chunkSizeWarningLimit: 2000,
    },

    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom", "axios"],
    },
  };
});
