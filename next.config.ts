import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // pdfkit đọc file dữ liệu nội bộ lúc chạy nên không để Next đóng gói chung
  serverExternalPackages: ["pdfkit"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
