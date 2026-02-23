import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {

    eslint: {
        // ignoreDuringBuilds: true,
    },
    
    typescript: {
        // ignoreBuildErrors: true,
    },
    
    sassOptions: {
        includePaths: [
            path.join(__dirname, "src/assets/scss"),
            path.join(__dirname, "node_modules"),
        ],
        // Completely suppress all deprecation warnings
        quietDeps: true,
        // Additional options to suppress all warnings
        style: 'compressed',
        sourceMap: false,
    },
    turbopack: {
  
    },
    webpack: (config, { isServer, dev }) => {
        // Fix for Sass import tracing
        config.resolve.alias = {
            ...config.resolve.alias,
            '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
        };
        
        // Suppress CSS loader import trace warnings
        config.ignoreWarnings = [
            {
                module: /node_modules\/next\/dist\/build\/webpack\/loaders\/css-loader/,
            },
            {
                message: /Import trace for requested module/,
            },
        ];
        
        // Suppress all warnings in webpack during build
        if (!dev) {
            config.stats = {
                ...config.stats,
                warnings: false,
                warningsFilter: [
                    /Import trace for requested module/,
                    /css-loader/,
                    /.*/,
                ],
            };
            
            // Suppress console warnings during build
            config.infrastructureLogging = {
                level: 'error',
            };
        }
        
        return config;
    },
    // Suppress build warnings
    onDemandEntries: {
        maxInactiveAge: 25 * 1000,
        pagesBufferLength: 2,
    },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "sentry",

  project: "main-app",
  sentryUrl: "http://sentry.primealley.com:7800/",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
