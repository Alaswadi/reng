const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const dest = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4501";
    return [
      {
        source: "/api/:path*",
        destination: `${dest}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
