import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  // Reduce logging noise in development
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  },
  // Only log errors in development, not every compilation
  ...(process.env.NODE_ENV === 'development' && {
    logging: {
      fetches: {
        fullUrl: false,
      },
    },
  }),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
  },
  // Webpack configuration for server-side modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize modules that have issues with Next.js bundling
      config.externals = config.externals || [];
      config.externals.push({
        'pdf-parse': 'commonjs pdf-parse',
        'canvas': 'commonjs canvas',
      });
    }
    return config;
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Suppresses source map uploading logs during build
  silent: true,

  // Upload source maps only in production
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  widenClientFileUpload: true,

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically annotate React components to show their name in breadcrumbs
  reactComponentAnnotation: {
    enabled: true,
  },
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
