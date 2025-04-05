/**
 * Next.js configuration
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
const nextConfig = {
  serverRuntimeConfig: {
    port: process.env.PORT || 4000,
  },
  images: {
    domains: ['images.unsplash.com'],
  },
  // Add redirects for legacy endpoints
  async redirects() {
    return [
      {
        source: '/api/test',
        destination: '/api/health',
        permanent: true,
      },
    ];
  },
  // Explicitly exclude routes from the build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].filter(ext => 
    // This ensures files named test.ts are not treated as pages
    !(ext === 'ts' && process.env.NODE_ENV === 'production')
  ),
  // Customize webpack config to exclude test files
  webpack: (config, { dev, isServer }) => {
    if (!dev && isServer) {
      // Exclude test files from production build
      config.module.rules.push({
        test: /\/test\.(js|ts)x?$/,
        loader: 'ignore-loader',
      });
    }
    return config;
  },
  // Add security headers
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Allow scripts from self and trusted sources
              "script-src 'self' 'unsafe-inline' https://js.stripe.com https://cdn.auth0.com https://www.google-analytics.com",
              // Allow styles from self and inline (needed for some components)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Allow fonts from Google Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Allow images from self and trusted sources
              "img-src 'self' data: https://images.unsplash.com https://www.google-analytics.com",
              // Allow connections to API endpoints and trusted services
              "connect-src 'self' https://*.auth0.com https://api.stripe.com https://api.airtable.com https://api.twilio.com https://www.google-analytics.com",
              // Allow frames from trusted sources
              "frame-src 'self' https://js.stripe.com https://cdn.auth0.com",
              // Block all object tags
              "object-src 'none'",
              // Restrict form submissions to self
              "form-action 'self'",
              // Upgrade insecure requests
              "upgrade-insecure-requests",
            ].join('; '),
          },
          // X-Content-Type-Options
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // X-Frame-Options
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // X-XSS-Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer-Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions-Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Strict-Transport-Security
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Apply CORS headers to API routes
        source: '/api/:path*',
        headers: [
          // Allow requests from the frontend
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://smarttext-connect.vercel.app',
          },
          // Allow specific methods
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          // Allow specific headers
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          // Allow credentials
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          // Max age for preflight requests
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
