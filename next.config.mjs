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
};

export default nextConfig;
