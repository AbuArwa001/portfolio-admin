// next.config.js
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "portfolio-nq7u72ays-khalfanathman12s-projects.vercel.app",
      },
      {
        protocol: "https",
        hostname: "portfolio-3ke7.onrender.com",
      },
      {
        protocol: "https",
        hostname: "www.khalfanathman.dev",
      },
      {
        protocol: "https",
        hostname: "khalfanathman.dev",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "github-readme-stats.vercel.app",
      },
      {
        protocol: "https",
        hostname: "github-readme-streak-stats.herokuapp.com",
      },
      {
        protocol: "https",
        hostname: "github-profile-trophy.vercel.app",
      },
      {
        protocol: "https",
        hostname: "github-profile-summary-cards.vercel.app",
      },
      {
        protocol: "https",
        hostname: "api.khalfanathman.dev",
      },
      {
        protocol: "https",
        hostname: "portfolikhalif.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "portfolikhalif.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  outputFileTracingRoot: __dirname,
  async rewrites() {
    const rawApi = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "production" ? "https://api.khalfanathman.dev" : "http://127.0.0.1:8000");
    const apiDestination = (rawApi.startsWith("http://") || rawApi.startsWith("https://") ? rawApi : `https://${rawApi}`).replace(/\/+$/, "");
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: '/api/v1/:path*',
          destination: `${apiDestination}/api/v1/:path*`,
        },
        {
          source: '/api/:path*',
          destination: `${apiDestination}/api/v1/:path*`,
        },
      ],
    };
  },
};

module.exports = nextConfig;

// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
