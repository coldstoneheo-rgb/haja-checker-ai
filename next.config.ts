import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // 모바일에서 PDF/사진 Blob을 다룰 때 큰 페이로드가 잘리는 일을 막는다.
    largePageDataBytes: 256 * 1024,
  },
};

export default nextConfig;
