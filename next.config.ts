import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js", "@tesseract.js-data/eng", "sharp"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@tesseract.js-data/eng/4.0.0/**", "./node_modules/tesseract.js/src/**", "./node_modules/tesseract.js-core/**"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
