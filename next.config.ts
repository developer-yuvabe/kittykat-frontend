const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**", // Allow all paths under storage.googleapis.com
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
        pathname: "/**", // Allow all paths under storage.googleapis.com
      },
    ],
  },
};

export default nextConfig;
