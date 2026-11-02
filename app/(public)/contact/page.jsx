import ContactClient from "./ContactClient";

export const metadata = {
  title: "Contact Us | Bedy – Modern PG & Hostel Management Software",
  description:
    "Get in touch with the Bedy team for product demos, onboarding support, or enterprise inquiries.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us | Bedy – Modern PG & Hostel Management Software",
    description:
      "Get in touch with the Bedy team for product demos, onboarding support, or enterprise inquiries.",
    url: "https://bedy.in/contact",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://bedy.in",
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Contact",
      "item": "https://bedy.in/contact",
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ContactClient />
    </>
  );
}
