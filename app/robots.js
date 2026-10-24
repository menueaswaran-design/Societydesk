export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bedy.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/login",
          "/forgot-password",
          "/pricing",
          "/features",
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
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
