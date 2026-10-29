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
    default: "Bedy – PG & Hostel Rent Management Software",
    template: "%s | Bedy",
  },
  description:
    "Manage your PG or hostel with Bedy. Track rent payments, pending invoices, resident details, deposits, and complaints in one simple platform.",
  applicationName: "Bedy",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "Bedy",
    "PG Management Software",
    "Hostel Management Software",
    "PG Rent Collection App",
    "Coliving Management System",
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
    url: "https://bedy.in/",
    siteName: "Bedy",
    title: "Bedy – PG & Hostel Rent Management Software",
    description:
      "Simplify rent collection, invoice tracking, and resident management with Bedy.",
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
    title: "Bedy – PG & Hostel Rent Management Software",
    description:
      "Simplify rent collection, invoice tracking, and resident management with Bedy.",
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
  themeColor: "#3154D9",
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
      <body className={`${manrope.className} min-h-screen text-[#10192E] bg-[#F8FAFF] antialiased`}>
        <FirebaseBootstrap />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
