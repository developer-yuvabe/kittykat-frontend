const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**", // Allow all images from Unsplash
      },
    ],
  },
};

export default nextConfig;
