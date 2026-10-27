import ContactClient from "./ContactClient";

export const metadata = {
  title: "Contact Us | Bedy",
  description:
    "Get in touch with the Bedy team for product demos, onboarding support, or enterprise inquiries.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
