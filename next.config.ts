import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
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
    webpack: (config, { isServer, dev }) => {
        // Fix for Sass import tracing
        config.resolve.alias = {
            ...config.resolve.alias,
            '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
        };
        
        // Suppress all warnings in webpack during build
        if (!dev) {
            config.stats = {
                ...config.stats,
                warnings: false,
                warningsFilter: [/.*/],
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

export default nextConfig;
