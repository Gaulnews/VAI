/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'llamaindex'],
  },
  serverExternalPackages: ['pdf-parse', 'llamaindex'],
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: '50mb',
  },
};

module.exports = nextConfig;
