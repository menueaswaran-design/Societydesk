import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pinned so Next does not infer C:\Users\VIGNESH as the workspace root
  // (there is an unrelated package-lock.json in the user profile).
  outputFileTracingRoot: path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1"),
};

export default nextConfig;