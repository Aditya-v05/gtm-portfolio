/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The blog became the notebook's Writing section, and the Paper Trail
  // (/signals) was retired. Old links shared on LinkedIn keep working.
  async redirects() {
    return [
      { source: "/blog", destination: "/writing", permanent: true },
      { source: "/blog/:slug", destination: "/writing/:slug", permanent: true },
      { source: "/signals", destination: "/", permanent: true },
      { source: "/signals/:path*", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
