import Badge from "./Badge";
import { titleCase } from "@/lib/format";

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

export default function StatusBadge({ status, dot = true, className = "" }) {
  if (!status) return null;
  return (
    <Badge tone={MAP[status] ?? "slate"} dot={dot} className={className}>
      {titleCase(status)}
    </Badge>
  );
}

export { MAP as STATUS_TONES };
