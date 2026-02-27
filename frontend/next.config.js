/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    const backendOrigin =
      process.env.BACKEND_ORIGIN ||
      (process.env.NODE_ENV === "development" ? "http://localhost:8080" : "http://backend:8080");
    return [
      {
        source: "/backend/:path*",
        destination: `${backendOrigin}/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
