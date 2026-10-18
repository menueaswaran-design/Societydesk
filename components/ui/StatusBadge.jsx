"use client";

import Badge from "./Badge";
import { titleCase } from "@/lib/format";
import { useTranslation } from "@/components/i18n/LanguageProvider";

const MAP = {
  // invoices
  PENDING: "amber",
  PARTIALLY_PAID: "blue",
  PAID: "green",
  OVERDUE: "red",
  CANCELLED: "slate",
  // flats
  OCCUPIED: "green",
  VACANT: "slate",
  // complaints
  OPEN: "amber",
  ASSIGNED: "blue",
  IN_PROGRESS: "blue",
  RESOLVED: "green",
  CLOSED: "slate",
  REOPENED: "red",
  // notices
  DRAFT: "slate",
  PUBLISHED: "green",
  ARCHIVED: "slate",
  // priority
  LOW: "slate",
  MEDIUM: "blue",
  HIGH: "amber",
  URGENT: "red",
  // users / societies
  ACTIVE: "green",
  INACTIVE: "slate",
  // payment orders
  CREATED: "amber",
  EXPIRED: "slate",
  COMPLETED: "green",
  CANCELLED_ORDER: "slate",
};

const STATUS_TA = {
  PAID: "செலுத்தப்பட்டது",
  PENDING: "நிலுவையில்",
  PARTIALLY_PAID: "பகுதி செலுத்தப்பட்டது",
  OVERDUE: "காலாவதியானது",
  CANCELLED: "ரத்து செய்யப்பட்டது",
  OPEN: "திறந்துள்ளது",
  ASSIGNED: "ஒதுக்கப்பட்டது",
  IN_PROGRESS: "செயல்பாட்டில்",
  RESOLVED: "தீர்க்கப்பட்டது",
  CLOSED: "மூடப்பட்டது",
  REOPENED: "மீண்டும் திறக்கப்பட்டது",
  OCCUPIED: "குடியேறியுள்ளது",
  VACANT: "காலியாக உள்ளது",
  DRAFT: "வரைவு",
  PUBLISHED: "வெளியிடப்பட்டது",
  ARCHIVED: "காப்பகப்படுத்தப்பட்டது",
  ACTIVE: "செயலில்",
  INACTIVE: "செயலற்றது",
  LOW: "குறைந்த",
  MEDIUM: "நடுத்தர",
  HIGH: "அதிக",
  URGENT: "அவசரமானது",
};

export default function StatusBadge({ status, dot = true, className = "" }) {
  const { locale } = useTranslation();
  if (!status) return null;

  const label = locale === "ta" && STATUS_TA[status] ? STATUS_TA[status] : titleCase(status);

  return (
    <Badge tone={MAP[status] ?? "slate"} dot={dot} className={className}>
      {label}
    </Badge>
  );
}

export { MAP as STATUS_TONES };
