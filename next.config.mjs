/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // libSQL ships native bindings — keep them external to the server bundle.
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;