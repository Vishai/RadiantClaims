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

export default nextConfig;
