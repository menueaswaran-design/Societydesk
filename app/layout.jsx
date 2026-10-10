import "./globals.css";
import FirebaseBootstrap from "@/components/FirebaseBootstrap";

export const metadata = {
  title: {
    default: "SocietyDesk",
    template: "%s · SocietyDesk",
  },
  description:
    "Property management, billing, and apartment society administration system.",
  applicationName: "SocietyDesk",
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <FirebaseBootstrap />
        {children}
      </body>
    </html>
  );
}
