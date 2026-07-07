import type { NextConfig } from "next";

const securityHeaders = [
  // Enforce HTTPS (only meaningful over HTTPS).
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Prevent MIME sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Reduce referrer leakage.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable powerful APIs we don't use.
  {
    key: "Permissions-Policy",
    value: "geolocation=(), microphone=(), camera=()",
  },
  // Basic clickjacking defense.
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  images: {
    // next/image is used with quality 75 and 90 across the site. Next 16
    // rejects qualities that aren't allowlisted here.
    qualities: [75, 90],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
