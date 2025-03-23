const nextConfig = {
  serverRuntimeConfig: {
    port: process.env.PORT || 4000,
  },
  images: {
    domains: ['images.unsplash.com'],
  }
};

export default nextConfig;
