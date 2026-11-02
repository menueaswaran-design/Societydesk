import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pinned so Nextdoes not infer C:\Users\VIGNESH as the workspace root
  // (there is an unrelated package-lock.json in the user profile).
  outputFileTracingRoot: __dirname,
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable disk pack cache in development to prevent OneDrive file locking and readlink EINVAL errors on Windows
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
