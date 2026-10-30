export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bedy.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/favicon.ico",
          "/favicon-48x48.png",
          "/favicon-96x96.png",
          "/favicon.png",
          "/apple-icon.png",
          "/apple-touch-icon.png",
          "/icon.png",
          "/logo.png",
          "/about",
          "/services",
          "/contact",
          "/refund-policy",
          "/terms",
          "/privacy",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/resident/",
          "/super-admin/",
          "/staff/",
          "/dashboard/",
          "/account/",
          "/login",
          "/forgot-password",
          "/pay/",
        ],
      },
      {
        userAgent: "Googlebot-Image",
        allow: [
          "/favicon.ico",
          "/favicon-48x48.png",
          "/favicon-96x96.png",
          "/favicon.png",
          "/apple-icon.png",
          "/apple-touch-icon.png",
          "/icon.png",
          "/logo.png",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
