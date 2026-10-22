import { Inter } from "next/font/google";
import "./globals.css";
import FirebaseBootstrap from "@/components/FirebaseBootstrap";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: {
    default: "Bedy — Smart PG, Hostel & Rental Living Management",
    template: "%s · Bedy",
  },
  description:
    "Bedy is the modern operating system for PG, hostel, co-living and rental living managers. Live occupancy, automated rent billing, 1-click WhatsApp reminders with instant UPI, and security deposit settlements.",
  applicationName: "Bedy",
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen text-slate-900 bg-[#F8FAFC] antialiased`}>
        <FirebaseBootstrap />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
