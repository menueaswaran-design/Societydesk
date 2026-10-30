export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bedy.in";
  const lastModified = new Date("2026-10-30T10:13:00.000Z");

  return [
    {
      url: `${baseUrl}`,
      lastModified,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
    },
    {
      url: `${baseUrl}/services`,
      lastModified,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
    },
  ];
}
