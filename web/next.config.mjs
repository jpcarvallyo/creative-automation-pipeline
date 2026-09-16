/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid double-mount thrash in this thin POC console (can surface removeChild HMR noise).
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "3001", pathname: "/media/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "3001", pathname: "/media/**" },
    ],
  },
};

export default nextConfig;
