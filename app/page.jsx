import { getServerSessionOrNull } from "@/lib/auth/server";
import HomePageClient from "@/components/HomePageClient";

export const metadata = {
  title: "SocietyDesk — Apartment & Society Operations",
  description:
    "Modern web platform for maintenance billing, 1-click payments, complaint tracking, and resident notices.",
};

export default async function HomePage() {
  const user = await getServerSessionOrNull();
  return <HomePageClient user={user} />;
}