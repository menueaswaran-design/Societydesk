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
    "Bedy PG Software",
    "PG Management Software",
    "Hostel Management Software",
    "PG Rent Collection App",
    "Coliving Management System",
    "Paying Guest Software India",
    "Hostel ERP",
    "Sub-meter electricity split PG",
  ],
  authors: [{ name: "Bedy Technologies", url: "https://bedy.in" }],
  creator: "Bedy Technologies",
  publisher: "Bedy Technologies",
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
      "Simplify rent collection, invoice tracking, live bed availability, and resident management with Bedy.",
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
      "Simplify rent collection, invoice tracking, live bed availability, and resident management with Bedy.",
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
      "alternateName": [
        "Bedy Technologies",
        "Bedy PG Software",
        "Bedy App",
        "Bedy Coliving OS",
      ],
      "description":
        "Smart PG, Hostel & Rental Living Management App with 1-Click WhatsApp Invoicing, Live Bed Matrix, and Sub-meter Electricity Splitting.",
      "publisher": { "@id": "https://bedy.in/#organization" },
      "inLanguage": "en-IN",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://bedy.in/?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://bedy.in/#organization",
      "name": "Bedy Technologies",
      "alternateName": "Bedy",
      "url": "https://bedy.in",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://bedy.in/#logo",
        "url": "https://bedy.in/logo.png",
        "caption": "Bedy Logo",
        "width": 1024,
        "height": 1024,
      },
      "image": { "@id": "https://bedy.in/#logo" },
      "description":
        "Developer of Bedy, modern cloud software for Paying Guest (PG) accommodations, student hostels, and co-living operators in India.",
      "email": "contact@bedy.in",
    },
    {
      "@type": "ItemList",
      "@id": "https://bedy.in/#site-navigation",
      "name": "Main Navigation",
      "itemListElement": [
        {
          "@type": "SiteNavigationElement",
          "position": 1,
          "name": "Features",
          "description": "Complete PG and hostel management software features",
          "url": "https://bedy.in/features",
        },
        {
          "@type": "SiteNavigationElement",
          "position": 2,
          "name": "Pricing",
          "description": "Affordable per-bed and monthly plans for PGs and hostels",
          "url": "https://bedy.in/pricing",
        },
        {
          "@type": "SiteNavigationElement",
          "position": 3,
          "name": "Services",
          "description": "Platform capabilities and operations management services",
          "url": "https://bedy.in/services",
        },
        {
          "@type": "SiteNavigationElement",
          "position": 4,
          "name": "About Us",
          "description": "About Bedy and our mission to digitize PG living across India",
          "url": "https://bedy.in/about",
        },
        {
          "@type": "SiteNavigationElement",
          "position": 5,
          "name": "Contact",
          "description": "Get in touch with Bedy team for demos and support",
          "url": "https://bedy.in/contact",
        },
      ],
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
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
