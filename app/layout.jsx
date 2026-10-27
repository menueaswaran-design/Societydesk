import { Manrope } from "next/font/google";
import "./globals.css";
import FirebaseBootstrap from "@/components/FirebaseBootstrap";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://bedy.in"),
  title: {
    default: "Bedy | PG/Hostel/Co-Living Management App",
    template: "%s · Bedy",
  },
  description:
    "Now manage your PG/Hostel smartly with Bedy. Get automated reports, 1-click WhatsApp rent reminders, instant UPI, per-bed matrix, and deposit settlements.",
  applicationName: "Bedy",
  keywords: [
    "Bedy",
    "PG Management App",
    "Hostel Management Software",
    "Coliving Management System",
    "Rent Collection App",
    "Paying Guest Software India",
  ],
  authors: [{ name: "Bedy Technologies" }],
  creator: "Bedy",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://bedy.in",
    siteName: "Bedy",
    title: "Bedy | PG/Hostel/Co-Living Management App",
    description:
      "Now manage your PG/Hostel smartly with Bedy. Automated reports, bulk WhatsApp reminders, instant UPI, and real-time bed occupancy.",
    images: [
      {
        url: "https://bedy.in/logo.png",
        width: 1024,
        height: 1024,
        alt: "Bedy Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bedy | PG/Hostel/Co-Living Management App",
    description:
      "Now manage your PG/Hostel smartly with Bedy. Automated reports, bulk WhatsApp reminders, instant UPI, and real-time bed occupancy.",
    images: ["https://bedy.in/logo.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://bedy.in/#website",
      "url": "https://bedy.in",
      "name": "Bedy",
      "description": "Smart PG, Hostel & Rental Living Management App",
      "publisher": { "@id": "https://bedy.in/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://bedy.in/?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://bedy.in/#organization",
      "name": "Bedy",
      "url": "https://bedy.in",
      "logo": {
        "@type": "ImageObject",
        "url": "https://bedy.in/logo.png",
        "width": 1024,
        "height": 1024
      },
      "sameAs": [],
    },
    {
      "@type": "SiteNavigationElement",
      "name": "Live Showcase",
      "url": "https://bedy.in/#showcase",
    },
    {
      "@type": "SiteNavigationElement",
      "name": "Features",
      "url": "https://bedy.in/#features",
    },
    {
      "@type": "SiteNavigationElement",
      "name": "Pricing Plans",
      "url": "https://bedy.in/#pricing",
    },
    {
      "@type": "SiteNavigationElement",
      "name": "Test Drive Demo",
      "url": "https://bedy.in/#demo-portals",
    },
    {
      "@type": "SiteNavigationElement",
      "name": "Sign In",
      "url": "https://bedy.in/login",
    },
    {
      "@type": "SiteNavigationElement",
      "name": "Refund & Cancellation Policy",
      "url": "https://bedy.in/refund-policy",
    },
    {
      "@type": "SiteNavigationElement",
      "name": "Terms of Service",
      "url": "https://bedy.in/terms",
    },
  ],
};

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={manrope.variable}>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${manrope.className} min-h-screen text-slate-900 bg-[#F8FAFC] antialiased`}>
        <FirebaseBootstrap />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
