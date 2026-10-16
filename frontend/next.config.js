/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Dynamically uses 'backend' inside Docker, falling back to 'localhost' for local npm run dev
    const backendUrl = process.env.BACKEND_PROXY_URL || "http://localhost:8000";

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
