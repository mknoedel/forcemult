/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: false,
  },
  // Pin the workspace root to this project. Without it, Turbopack walks up the
  // tree, finds other lockfiles (e.g. one in the user's home directory), and
  // may infer the wrong root.
  turbopack: {
    root: __dirname,
  },
  // Note: the `experimental.turbopackUseSystemTlsCerts` flag was removed in
  // Next.js 16. In environments that route traffic through a TLS-intercepting
  // proxy (e.g. Claude Code's cloud sandbox), where next/font/google fetches
  // Google Fonts at build time, point Node at the proxy's CA bundle instead:
  //   NODE_EXTRA_CA_CERTS=/path/to/ca.pem
};

module.exports = nextConfig;
