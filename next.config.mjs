import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pinned so Next does not infer C:\Users\VIGNESH as the workspace root
  // (there is an unrelated package-lock.json in the user profile).
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [
      {
        source: "/pricing",
        destination: "/#pricing",
        permanent: true,
      },
      {
        source: "/features",
        destination: "/#features",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
